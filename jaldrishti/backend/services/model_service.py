"""
services/model_service.py
=========================
Production model-loading service for JalDrishti XGBoost forecasting engines.

Loads and serves the two validated production XGBoost regressors:
1. Primary Baseline Model: ml_package/models/xgboost_groundwater_baseline.json (history_count >= 20)
2. Robust Fallback Model: ml_package/models/xgboost_groundwater_robust.json (3 <= history_count <= 19)

Both models operate on an identical 30-feature numerical matrix in native XGBoost format.
Models are loaded once at server startup and cached in-memory for zero-latency inference.
"""

import os
import sys
import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any

# Ensure backend directory is in sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import xgboost as xgb
import numpy as np

logger = logging.getLogger("jaldrishti.model_service")

# Canonical 30-feature ordering required by both models
FEATURE_NAMES: List[str] = [
    "lag_1",
    "lag_2",
    "lag_4",
    "lag_8",
    "is_missing_lag_1",
    "is_missing_lag_2",
    "is_missing_lag_4",
    "is_missing_lag_8",
    "last_observed_dtwl",
    "periods_since_last_observation",
    "last_same_season_dtwl",
    "rolling_mean_4",
    "rolling_mean_8",
    "rolling_mean_12",
    "rolling_std_4",
    "rolling_std_8",
    "rolling_std_12",
    "slope_8",
    "slope_12",
    "sin_season",
    "cos_season",
    "season_august",
    "season_january",
    "season_post_monsoon",
    "season_pre_monsoon",
    "latitude",
    "longitude",
    "n_wells",
    "history_count",
    "eligible_for_ml",
]


class ModelLoadError(Exception):
    """Raised when loading the XGBoost models fails during initialization."""
    pass


class ModelService:
    """
    Manages in-memory loading, version inspection, model routing, and inference
    for the JalDrishti XGBoost regressors.
    """

    def __init__(self, models_dir: Optional[str] = None):
        if models_dir is None:
            # Look in ml_package/models/ relative to repo root
            repo_root = Path(__file__).resolve().parent.parent.parent
            models_dir = str(repo_root / "ml_package" / "models")
        self.models_dir = models_dir

        self.baseline_model: Optional[xgb.Booster] = None
        self.robust_model: Optional[xgb.Booster] = None
        self.is_loaded: bool = False
        self.feature_names: List[str] = list(FEATURE_NAMES)
        self.expected_feature_count: int = len(FEATURE_NAMES)
        self.xgboost_version: str = getattr(xgb, "__version__", "unknown")

    def load_models(self) -> None:
        """
        Loads both trained JSON models from disk once into memory.
        Logs startup verification information and validates feature compatibility.
        """
        if self.is_loaded:
            return

        baseline_path = os.path.join(self.models_dir, "xgboost_groundwater_baseline.json")
        robust_path = os.path.join(self.models_dir, "xgboost_groundwater_robust.json")

        if not os.path.exists(baseline_path):
            raise ModelLoadError(f"Baseline XGBoost model file not found at: {baseline_path}")
        if not os.path.exists(robust_path):
            raise ModelLoadError(f"Robust XGBoost model file not found at: {robust_path}")

        # 1. Load Baseline Model
        try:
            m_base = xgb.Booster()
            m_base.load_model(baseline_path)
            self.baseline_model = m_base
        except Exception as exc:
            raise ModelLoadError(f"Failed to load baseline model from {baseline_path}: {exc}") from exc

        # 2. Load Robust Model
        try:
            m_rob = xgb.Booster()
            m_rob.load_model(robust_path)
            self.robust_model = m_rob
        except Exception as exc:
            raise ModelLoadError(f"Failed to load robust model from {robust_path}: {exc}") from exc

        # Validate feature counts
        base_features = self.baseline_model.num_features()
        robust_features = self.robust_model.num_features()

        if base_features != self.expected_feature_count:
            raise ModelLoadError(
                f"Baseline model features mismatch: expected {self.expected_feature_count}, got {base_features}"
            )
        if robust_features != self.expected_feature_count:
            raise ModelLoadError(
                f"Robust model features mismatch: expected {self.expected_feature_count}, got {robust_features}"
            )

        self.is_loaded = True

        # Startup logging verification
        logger.info("=" * 60)
        logger.info("JalDrishti Machine Learning Model Service Initialized")
        logger.info("=" * 60)
        logger.info("Baseline XGBoost model loaded: %s", baseline_path)
        logger.info("Robust XGBoost model loaded:   %s", robust_path)
        logger.info("XGBoost runtime version:       %s", self.xgboost_version)
        logger.info("Number of features expected:   %d", self.expected_feature_count)
        logger.info("=" * 60)

        print("\n" + "=" * 60)
        print("JalDrishti ML Model Service")
        print("=" * 60)
        print(f"Baseline XGBoost model loaded: {baseline_path}")
        print(f"Robust XGBoost model loaded:   {robust_path}")
        print(f"XGBoost version:               {self.xgboost_version}")
        print(f"Features expected:             {self.expected_feature_count}")
        print("=" * 60 + "\n")

    def _ensure_loaded(self) -> None:
        """Ensures models are loaded before handling an inference query."""
        if not self.is_loaded:
            self.load_models()

    def select_model(self, history_count: int) -> Tuple[Optional[xgb.Booster], Optional[str], Optional[str]]:
        """
        Determines the appropriate forecasting model based on historical observation depth:
        - history_count >= 20 -> baseline model ('xgboost_primary_exp01')
        - 3 <= history_count <= 19 -> robust model ('xgboost_fallback_robust_exp02')
        - history_count < 3 -> not eligible for ML forecast

        Returns:
            Tuple of (model_booster, model_tier, model_identifier)
        """
        self._ensure_loaded()
        if history_count >= 20:
            return self.baseline_model, "baseline", "xgboost_primary_exp01"
        elif 3 <= history_count <= 19:
            return self.robust_model, "robust", "xgboost_fallback_robust_exp02"
        else:
            return None, "ineligible", None

    def predict(self, feature_vector: List[Any], history_count: int) -> float:
        """
        Executes single-step inference using the selected model.

        Parameters:
            feature_vector: List of 30 numerical values matching FEATURE_NAMES.
            history_count: Number of historical quarters to drive routing.

        Returns:
            Predicted DTWL (meters below ground level) as a float.
        """
        self._ensure_loaded()

        if len(feature_vector) != self.expected_feature_count:
            raise ValueError(
                f"Feature vector length mismatch: expected {self.expected_feature_count}, got {len(feature_vector)}"
            )

        model, tier, model_id = self.select_model(history_count)
        if model is None:
            raise ValueError(
                f"Series with history_count={history_count} is not eligible for ML forecast (<3 observations)."
            )

        # Convert to DMatrix
        arr = np.array([feature_vector], dtype=np.float32)
        dmatrix = xgb.DMatrix(arr, feature_names=self.feature_names)
        preds = model.predict(dmatrix)
        return float(preds[0])


# Singleton instance
model_service = ModelService()
