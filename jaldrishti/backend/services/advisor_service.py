"""
services/advisor_service.py
===========================
Rule-based Explainable Groundwater Advisory Service for JalDrishti.

Synthesizes authoritative groundwater telemetry:
- Current depth to water level (DTWL in meters below ground level - mbgl)
- Long-term secular decadal trend (m/year) and recent 4-year acceleration
- Central Ground Water Board (CGWB) risk classification & evidence score
- Approved 4-quarter forward forecast projections (H1 through H4)
- Forecast net change and calibrated confidence uncertainty spread
- Observation history confidence & data density gating

Produces transparent, farmer- and policy-friendly advisories categorized into:
- LOW_RISK (SAFE)
- MODERATE_RISK (WATCH)
- CRITICAL_RISK (CRITICAL)
- INSUFFICIENT_DATA (<3 quarters / sparse data)

Designed with extensible hooks for future agronomic crop and canal infrastructure
layers without fabricating unverified inputs.
"""

import sys
import logging
from pathlib import Path
from typing import Dict, List, Optional, Any

# Ensure backend directory is in sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from services.data_service import data_service

logger = logging.getLogger("jaldrishti.advisor_service")


class AdvisorService:
    """
    Synthesizes groundwater levels, trends, risks, and forecasts into
    actionable, transparent agronomic and water-management advisories.
    """

    def generate_advisory(
        self,
        state: str,
        district: str,
        block: str,
        crop_context: Optional[Dict[str, Any]] = None,
        canal_context: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Generates a structured, explainable groundwater advisory.

        Parameters:
            state: Indian State or Union Territory name
            district: District name
            block: Administrative Block name
            crop_context: Optional future hook for regional cropping patterns (default None)
            canal_context: Optional future hook for canal command availability (default None)

        Returns:
            Dictionary with structured advisory response, or None if the block
            is completely unknown in the groundwater registry.
        """
        # 1. Fetch risk record and history from the authoritative data service
        risk_record = data_service.get_block_risk(state, district, block)
        block_history = data_service.get_block_history(state, district, block)

        # If block is unknown in both risk and history, location does not exist
        if risk_record is None and block_history is None:
            return None

        canonical_state = (
            risk_record["state"]
            if risk_record
            else (block_history["state"] if block_history else state)
        )
        canonical_district = (
            risk_record["district"]
            if risk_record
            else (block_history["district"] if block_history else district)
        )
        canonical_block = (
            risk_record["block"]
            if risk_record
            else (block_history["block"] if block_history else block)
        )

        history_count = (
            len(block_history["history"])
            if block_history and "history" in block_history
            else (risk_record.get("history_count", 0) if risk_record else 0)
        )

        # 2. Case: Insufficient observation data (<3 quarters or missing risk record)
        if risk_record is None or history_count < 3:
            latest_depth = None
            if block_history and block_history.get("history"):
                latest_depth = round(float(block_history["history"][-1]["avg_dtwl"]), 2)

            return {
                "state": canonical_state,
                "district": canonical_district,
                "block": canonical_block,
                "advisory_level": "INSUFFICIENT_DATA",
                "risk_level": "INSUFFICIENT_DATA",
                "risk_score": None,
                "current_groundwater_depth_m": latest_depth,
                "trend": None,
                "forecast": None,
                "summary": (
                    f"Historical observation records for block '{canonical_block}' are insufficient "
                    f"({history_count} quarters available, minimum 3 required). Reliable ML forecast and "
                    "risk evaluation cannot be established under CGWB guardrails."
                ),
                "recommendations": [
                    "Insufficient historical observations for a reliable ML forecast; avoid speculative long-term water planning.",
                    "Do not present a confident groundwater prediction to local irrigators without verified baseline data.",
                    "Prioritize localized observation well readings and telemetry activation to build historical baseline records.",
                    "Follow standard regional water conservation best practices while baseline monitoring is established.",
                ],
                "limitations": [
                    "Forecasts and risk classifications require at least 3 historical observation quarters under CGWB guardrails.",
                    "Actual local water levels may vary significantly across unmonitored aquifers.",
                ],
            }

        # 3. Authoritative risk and metric values
        raw_risk_level = risk_record.get("risk_level", "").upper()
        risk_score = int(risk_record.get("risk_score", 0))
        current_dtwl = round(float(risk_record.get("current_dtwl", 0.0)), 2)
        trend_m_per_year = round(float(risk_record.get("trend_m_per_year", 0.0)), 4)
        recent_trend = round(float(risk_record.get("recent_trend", 0.0)), 4)
        h1 = round(float(risk_record.get("forecast_h1", 0.0)), 2)
        h2 = round(float(risk_record.get("forecast_h2", 0.0)), 2)
        h3 = round(float(risk_record.get("forecast_h3", 0.0)), 2)
        h4 = round(float(risk_record.get("forecast_h4", 0.0)), 2)
        forecast_change = round(float(risk_record.get("forecast_change", 0.0)), 2)
        uncertainty = round(float(risk_record.get("forecast_uncertainty", 0.0)), 2)
        risk_reason = risk_record.get("risk_reason", "")
        low_data = bool(risk_record.get("low_data", False))

        # 4. Map advisory level strictly from official risk classification
        if raw_risk_level == "SAFE":
            advisory_level = "LOW_RISK"
        elif raw_risk_level == "WATCH":
            advisory_level = "MODERATE_RISK"
        elif raw_risk_level == "CRITICAL":
            advisory_level = "CRITICAL_RISK"
        else:
            advisory_level = "MODERATE_RISK"

        # 5. Interpret Trend (Distinguish depth increase from water level rise)
        # In CGWB conventions: positive trend (>0) = depth increasing (depletion)
        # negative trend (<0) = depth decreasing (shallowing / recharge)
        if trend_m_per_year > 0.05:
            secular_desc = (
                f"Groundwater depth is increasing at a long-term rate of +{trend_m_per_year:.2f} m/year, "
                "indicating a deeper water table and secular aquifer depletion."
            )
        elif trend_m_per_year < -0.05:
            secular_desc = (
                f"Groundwater depth is decreasing at an annual rate of {trend_m_per_year:.2f} m/year, "
                "indicating a shallower water table and aquifer recharge."
            )
        else:
            secular_desc = (
                f"Groundwater depth is relatively stable over the decadal period ({trend_m_per_year:+.2f} m/year), "
                "with minimal secular drift."
            )

        if recent_trend > 0.1:
            recent_desc = (
                f" Recent 4-year trend indicates accelerating drawdown (+{recent_trend:.2f} m/year), "
                "representing a deeper water table and intensified extraction stress."
            )
        elif recent_trend < -0.1:
            recent_desc = (
                f" Recent 4-year trend indicates localized water table recovery ({recent_trend:.2f} m/year), "
                "representing a shallower water table."
            )
        else:
            recent_desc = (
                f" Recent 4-year water table movement remains steady ({recent_trend:+.2f} m/year)."
            )

        trend_interpretation = secular_desc + recent_desc

        # 6. Interpret Forecast (Compare current depth to H1-H4 and forecast_change)
        if forecast_change > 0.2:
            forecast_desc = (
                f"Projected 4-quarter forward trajectory indicates groundwater depth will increase by "
                f"+{forecast_change:.2f} m (from {current_dtwl:.2f} m to {h4:.2f} m mbgl), representing a deeper water table over the coming year."
            )
        elif forecast_change < -0.2:
            forecast_desc = (
                f"Projected 4-quarter forward trajectory indicates groundwater depth will decrease by "
                f"{forecast_change:.2f} m (from {current_dtwl:.2f} m to {h4:.2f} m mbgl), representing a shallower water table and seasonal replenishment."
            )
        else:
            forecast_desc = (
                f"Projected 4-quarter forward trajectory indicates stable water levels over the coming year "
                f"(net projected change {forecast_change:+.2f} m mbgl)."
            )

        # 7. Generate Practical, Farmer-Friendly Recommendations
        recommendations: List[str] = []
        if advisory_level == "LOW_RISK":
            recommendations = [
                "Groundwater conditions are currently relatively stable; continue responsible groundwater use.",
                "Maintain regular seasonal monitoring of local observation wells across pre- and post-monsoon quarters.",
                "Avoid unnecessary over-extraction during peak dry season periods.",
                "Adopt water conservation measures such as rainwater harvesting and soil mulching to preserve aquifer health.",
            ]
        elif advisory_level == "MODERATE_RISK":
            recommendations = [
                "Groundwater requires active monitoring due to localized drawdown or seasonal stress.",
                "Reduce unnecessary pumping and eliminate daytime operational irrigation losses.",
                "Prefer water-efficient irrigation methods (e.g., drip or sprinkler systems) over flood irrigation.",
                "Plan irrigation schedules according to seasonal crop water requirements and local soil moisture.",
                "Monitor subsequent quarterly forecast updates closely to detect further water table depression.",
            ]
        else:  # CRITICAL_RISK
            recommendations = [
                "Groundwater stress is severe with sustained aquifer depletion; avoid all unnecessary groundwater extraction.",
                "Prioritize high-efficiency micro-irrigation systems and schedule pumping strictly during low-evaporation night hours.",
                "Consider lower-water-demand crops (such as pulses, oilseeds, or millets) where agronomically appropriate.",
                "Use available surface-water or canal alternatives if officially accessible in the command area.",
                "Construct community groundwater recharge structures (check dams, percolation pits) to aid monsoon replenishment.",
                "Conduct frequent well monitoring to guard against pump intake dry-out.",
            ]

        # 8. Build Concise Executive Summary
        summary = (
            f"Groundwater advisory tier is {advisory_level} (CGWB Risk: {raw_risk_level}, Evidence Score: {risk_score}). "
            f"Current water table depth is {current_dtwl:.2f} m below ground level. {trend_interpretation} {forecast_desc}"
        )

        # 9. Assemble Structured Response
        advisory_response = {
            "state": canonical_state,
            "district": canonical_district,
            "block": canonical_block,
            "advisory_level": advisory_level,
            "risk_level": raw_risk_level,
            "risk_score": risk_score,
            "current_groundwater_depth_m": current_dtwl,
            "trend": {
                "trend_m_per_year": trend_m_per_year,
                "recent_trend": recent_trend,
                "interpretation": trend_interpretation,
            },
            "forecast": {
                "h1": h1,
                "h2": h2,
                "h3": h3,
                "h4": h4,
                "forecast_change": forecast_change,
                "uncertainty": uncertainty,
            },
            "summary": summary,
            "recommendations": recommendations,
            "limitations": [
                "Forecasts are model-based estimates derived from historical Central Ground Water Board (CGWB) observation records.",
                "Actual groundwater conditions may vary with rainfall fluctuations, extraction intensity, and localized aquifer hydrogeology.",
            ],
        }

        return advisory_response


# Singleton instance
advisor_service = AdvisorService()
