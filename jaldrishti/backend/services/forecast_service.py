"""
services/forecast_service.py
============================
Live XGBoost forecasting service for JalDrishti groundwater levels (DTWL).

Extracts the exact 30-feature numerical vectors from chronological historical
series (block_series.csv and wells.csv), routes inference through the selected
XGBoost model (Baseline for >= 20 quarters, Robust for 3-19 quarters), and generates
a forward 4-quarter recursive projection (H1 through H4).

Adheres strictly to the scientific ML pipeline specification:
- Real groundwater history without synthetic observation interpolation
- Natural missingness preservation via indicators and elapsed period counters
- Recursive autoregressive feedback for horizons H2-H4
- Unaltered physical units (mbgl)
"""

import math
import logging
import sys
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple

# Ensure backend directory is in sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import numpy as np

from services.data_service import data_service
from services.model_service import model_service, FEATURE_NAMES

logger = logging.getLogger("jaldrishti.forecast_service")


def _get_quarter_info(period_str: str) -> Tuple[int, int]:
    """Extracts (year, month) from a 'YYYY-MM-DD' period string."""
    parts = period_str.strip().split("-")
    return int(parts[0]), int(parts[1])


def _advance_quarter(period_str: str) -> Tuple[str, str, int]:
    """
    Advances a quarterly observation period to the next CGWB monitoring quarter:
    - January (month 1) -> Pre-monsoon (month 5)
    - Pre-monsoon (month 5) -> August (month 8)
    - August (month 8) -> Post-monsoon (month 11)
    - Post-monsoon (month 11) -> January of next year (month 1)
    """
    year, month = _get_quarter_info(period_str)
    if month == 1:
        return f"{year}-05-01", "pre_monsoon", 5
    elif month <= 5:
        return f"{year}-08-01", "august", 8
    elif month <= 8:
        return f"{year}-11-01", "post_monsoon", 11
    else:
        return f"{year + 1}-01-01", "january", 1


def _prior_quarter(period_str: str, steps: int = 1) -> str:
    """
    Returns the period string 'steps' quarters prior on the canonical CGWB grid:
    1 step prior to 05-01 is 01-01
    1 step prior to 08-01 is 05-01
    1 step prior to 11-01 is 08-01
    1 step prior to 01-01 is (year-1)-11-01
    """
    curr = period_str
    for _ in range(steps):
        year, month = _get_quarter_info(curr)
        if month == 1:
            curr = f"{year - 1}-11-01"
        elif month <= 5:
            curr = f"{year}-01-01"
        elif month <= 8:
            curr = f"{year}-05-01"
        else:
            curr = f"{year}-08-01"
    return curr


class ForecastService:
    """
    Service generating runtime multi-horizon XGBoost forecasts for administrative blocks.
    """

    def __init__(self):
        self.feature_names = FEATURE_NAMES

    def generate_live_forecast(
        self, state: str, district: str, block: str
    ) -> Optional[Dict[str, Any]]:
        """
        Generates live 4-quarter forward predictions using the trained XGBoost models.

        Returns:
            Dictionary containing forecast results and model metadata,
            or None if the block has no historical groundwater records.
        """
        # 1. Retrieve historical series from the validated data service
        history_data = data_service.get_block_history(state, district, block)
        if history_data is None:
            return None

        canonical_state = history_data["state"]
        canonical_district = history_data["district"]
        canonical_block = history_data["block"]
        history: List[Dict[str, Any]] = history_data["history"]

        # Ensure chronological sort
        sorted_history = sorted(history, key=lambda x: x["period"])
        history_count = len(sorted_history)

        # 2. Check minimum eligibility threshold (>= 3 observations)
        if history_count < 3:
            return {
                "state": canonical_state,
                "district": canonical_district,
                "block": canonical_block,
                "eligible_for_ml": False,
                "history_count": history_count,
                "model_used": None,
                "model_tier": "ineligible",
                "message": (
                    f"Block has {history_count} historical quarters (<3 minimum required). "
                    "Forecast is intentionally suppressed according to ML guardrails to prevent spurious outputs."
                ),
                "forecasts": [],
            }

        # 3. Model selection based on historical depth
        model, model_tier, model_identifier = model_service.select_model(history_count)
        if model is None:
            return {
                "state": canonical_state,
                "district": canonical_district,
                "block": canonical_block,
                "eligible_for_ml": False,
                "history_count": history_count,
                "model_used": None,
                "model_tier": "ineligible",
                "message": "Model routing determined block is ineligible for forecast.",
                "forecasts": [],
            }

        # 4. Extract geospatial context (Centroid coordinates & well count)
        wells = data_service.get_block_wells(canonical_state, canonical_district, canonical_block) or []
        if wells:
            centroid_lat = float(np.mean([w["latitude"] for w in wells]))
            centroid_lon = float(np.mean([w["longitude"] for w in wells]))
            n_wells = sorted_history[-1].get("n_wells", len(wells))
        else:
            centroid_lat = 0.0
            centroid_lon = 0.0
            n_wells = sorted_history[-1].get("n_wells", 1)

        # 5. Initialize recursive state
        # Map period string -> avg_dtwl
        period_dtwl_map: Dict[str, float] = {
            item["period"]: float(item["avg_dtwl"]) for item in sorted_history
        }
        # Chronological series of observed DTWL values
        active_dtwls: List[float] = [float(item["avg_dtwl"]) for item in sorted_history]

        latest_observed_period = sorted_history[-1]["period"]
        latest_observed_dtwl = float(sorted_history[-1]["avg_dtwl"])

        current_period = latest_observed_period
        forecast_results: List[Dict[str, Any]] = []

        # 6. Generate 4-quarter forward forecasts (H1 to H4)
        for horizon_step in range(1, 5):
            target_period, target_season, target_month = _advance_quarter(current_period)

            # Build exact 30-feature vector
            features = self._build_feature_vector(
                period_dtwl_map=period_dtwl_map,
                active_dtwls=active_dtwls,
                target_period=target_period,
                target_season=target_season,
                target_month=target_month,
                horizon_step=horizon_step,
                centroid_lat=centroid_lat,
                centroid_lon=centroid_lon,
                n_wells=n_wells,
                history_count=history_count,
                sorted_history=sorted_history,
            )

            # Execute model prediction
            pred_dtwl = model_service.predict(features, history_count)

            forecast_entry = {
                "horizon_step": horizon_step,
                "target_period": target_period,
                "season": target_season,
                "pred_dtwl": round(float(pred_dtwl), 2),
                "is_recursive": (horizon_step > 1),
                "model_used": model_identifier,
            }
            forecast_results.append(forecast_entry)

            # Recursive feedback: append predicted value as the observation for target_period
            period_dtwl_map[target_period] = float(pred_dtwl)
            active_dtwls.append(float(pred_dtwl))
            current_period = target_period

        return {
            "state": canonical_state,
            "district": canonical_district,
            "block": canonical_block,
            "eligible_for_ml": True,
            "history_count": history_count,
            "model_used": model_identifier,
            "model_tier": model_tier,
            "latest_observed_period": latest_observed_period,
            "latest_observed_dtwl": round(latest_observed_dtwl, 2),
            "forecasts": forecast_results,
        }

    def _build_feature_vector(
        self,
        period_dtwl_map: Dict[str, float],
        active_dtwls: List[float],
        target_period: str,
        target_season: str,
        target_month: int,
        horizon_step: int,
        centroid_lat: float,
        centroid_lon: float,
        n_wells: int,
        history_count: int,
        sorted_history: List[Dict[str, Any]],
    ) -> List[Any]:
        """
        Constructs the exact 30-feature vector matching the trained model specification.
        """
        # 1-8: Autoregressive lags & missingness flags
        p_lag1 = _prior_quarter(target_period, 1)
        p_lag2 = _prior_quarter(target_period, 2)
        p_lag4 = _prior_quarter(target_period, 4)
        p_lag8 = _prior_quarter(target_period, 8)

        lag_1 = period_dtwl_map.get(p_lag1, np.nan)
        is_missing_lag_1 = 1 if np.isnan(lag_1) else 0

        lag_2 = period_dtwl_map.get(p_lag2, np.nan)
        is_missing_lag_2 = 1 if np.isnan(lag_2) else 0

        lag_4 = period_dtwl_map.get(p_lag4, np.nan)
        is_missing_lag_4 = 1 if np.isnan(lag_4) else 0

        lag_8 = period_dtwl_map.get(p_lag8, np.nan)
        is_missing_lag_8 = 1 if np.isnan(lag_8) else 0

        # 9: last_observed_dtwl
        last_observed_dtwl = float(active_dtwls[-1])

        # 10: periods_since_last_observation
        periods_since_last_obs = float(horizon_step)

        # 11: last_same_season_dtwl (find most recent observation matching target_season)
        last_same_season_dtwl = np.nan
        for item in reversed(sorted_history):
            if item.get("season") == target_season:
                last_same_season_dtwl = float(item["avg_dtwl"])
                break
        if np.isnan(last_same_season_dtwl):
            last_same_season_dtwl = last_observed_dtwl

        # 12-14: rolling_mean (4, 8, 12)
        rm4 = float(np.mean(active_dtwls[-4:]))
        rm8 = float(np.mean(active_dtwls[-8:]))
        rm12 = float(np.mean(active_dtwls[-12:]))

        # 15-17: rolling_std (4, 8, 12)
        rs4 = float(np.std(active_dtwls[-4:], ddof=0)) if len(active_dtwls) >= 4 else 0.0
        rs8 = float(np.std(active_dtwls[-8:], ddof=0)) if len(active_dtwls) >= 8 else 0.0
        rs12 = float(np.std(active_dtwls[-12:], ddof=0)) if len(active_dtwls) >= 12 else 0.0

        # 18-19: slope_8 and slope_12
        k8 = min(8, len(active_dtwls))
        if k8 >= 2:
            s8 = float(np.polyfit(np.arange(k8), active_dtwls[-k8:], 1)[0])
        else:
            s8 = 0.0

        k12 = min(12, len(active_dtwls))
        if k12 >= 2:
            s12 = float(np.polyfit(np.arange(k12), active_dtwls[-k12:], 1)[0])
        else:
            s12 = 0.0

        # 20-21: Trigonometric cyclical seasonal encodings (month / 12)
        sin_season = math.sin(2.0 * math.pi * float(target_month) / 12.0)
        cos_season = math.cos(2.0 * math.pi * float(target_month) / 12.0)

        # 22-25: One-hot season indicator flags
        season_august = 1.0 if target_season == "august" else 0.0
        season_january = 1.0 if target_season == "january" else 0.0
        season_post_monsoon = 1.0 if target_season == "post_monsoon" else 0.0
        season_pre_monsoon = 1.0 if target_season == "pre_monsoon" else 0.0

        # 26-30: Spatial coordinates, well density, count, eligibility
        latitude = float(centroid_lat)
        longitude = float(centroid_lon)
        n_wells_val = int(n_wells)
        history_cnt_val = int(history_count)
        eligible_for_ml = 1 if history_count >= 3 else 0

        # Maintain exact 30-feature order
        feature_vector = [
            lag_1,
            lag_2,
            lag_4,
            lag_8,
            is_missing_lag_1,
            is_missing_lag_2,
            is_missing_lag_4,
            is_missing_lag_8,
            last_observed_dtwl,
            periods_since_last_obs,
            last_same_season_dtwl,
            rm4,
            rm8,
            rm12,
            rs4,
            rs8,
            rs12,
            s8,
            s12,
            sin_season,
            cos_season,
            season_august,
            season_january,
            season_post_monsoon,
            season_pre_monsoon,
            latitude,
            longitude,
            n_wells_val,
            history_cnt_val,
            eligible_for_ml,
        ]

        return feature_vector


# Singleton instance
forecast_service = ForecastService()
