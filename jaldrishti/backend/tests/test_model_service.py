"""
tests/test_model_service.py
===========================
Unit and integration tests for XGBoost model service and live recursive forecasting.

Validates:
1. Both baseline and robust models load cleanly without retraining.
2. Model routing strictly adheres to historical data tiers:
   - >= 20 quarters -> Baseline model ('xgboost_primary_exp01')
   - 3 to 19 quarters -> Robust model ('xgboost_fallback_robust_exp02')
   - < 3 quarters -> Ineligible for ML forecast
3. Real prediction generation using actual block: Punjab -> Bathinda -> Talwandi Sabo.
4. Real prediction generation on robust tier: Andhra Pradesh -> Anakapalli -> K.Kotapadu.
5. Ineligible block handling: Assam -> Kokrajhar -> Mahamaya-Btc.
6. Predictions are finite, positive, physically plausible, and without fake data.
7. Recursive forecasting flags (H1 not recursive, H2-H4 recursive).
"""

import math
import sys
from pathlib import Path
import unittest

# Ensure backend directory is in sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from services.data_service import data_service
from services.model_service import model_service, FEATURE_NAMES
from services.forecast_service import forecast_service


class TestModelService(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        data_service.initialize()
        model_service.load_models()

    def test_01_models_loaded_successfully(self):
        """Verify that both trained XGBoost models are loaded and configured."""
        self.assertTrue(model_service.is_loaded)
        self.assertIsNotNone(model_service.baseline_model)
        self.assertIsNotNone(model_service.robust_model)

        # Verify feature count
        self.assertEqual(model_service.baseline_model.num_features(), 30)
        self.assertEqual(model_service.robust_model.num_features(), 30)
        self.assertEqual(len(FEATURE_NAMES), 30)
        self.assertEqual(model_service.expected_feature_count, 30)

        # Verify XGBoost version
        self.assertTrue(model_service.xgboost_version.startswith("3."))

    def test_02_model_selection_routing(self):
        """Verify model routing based on historical observation depth."""
        # Tier 1: history_count >= 20 -> Baseline
        m, tier, m_id = model_service.select_model(127)
        self.assertIsNotNone(m)
        self.assertEqual(tier, "baseline")
        self.assertEqual(m_id, "xgboost_primary_exp01")

        m, tier, m_id = model_service.select_model(20)
        self.assertEqual(tier, "baseline")

        # Tier 2: 3 <= history_count <= 19 -> Robust
        m, tier, m_id = model_service.select_model(19)
        self.assertEqual(tier, "robust")
        self.assertEqual(m_id, "xgboost_fallback_robust_exp02")

        m, tier, m_id = model_service.select_model(3)
        self.assertEqual(tier, "robust")

        # Tier 3: history_count < 3 -> Ineligible
        m, tier, m_id = model_service.select_model(2)
        self.assertIsNone(m)
        self.assertEqual(tier, "ineligible")
        self.assertIsNone(m_id)

        m, tier, m_id = model_service.select_model(0)
        self.assertIsNone(m)
        self.assertEqual(tier, "ineligible")

    def test_03_talwandi_sabo_live_prediction(self):
        """Run real live XGBoost prediction on Punjab -> Bathinda -> Talwandi Sabo."""
        result = forecast_service.generate_live_forecast("Punjab", "Bathinda", "Talwandi Sabo")
        self.assertIsNotNone(result)

        self.assertEqual(result["state"], "Punjab")
        self.assertEqual(result["district"], "Bathinda")
        self.assertEqual(result["block"], "Talwandi Sabo")
        self.assertTrue(result["eligible_for_ml"])
        self.assertEqual(result["model_tier"], "baseline")
        self.assertEqual(result["model_used"], "xgboost_primary_exp01")
        self.assertGreaterEqual(result["history_count"], 20)

        # Check latest observed data
        self.assertEqual(result["latest_observed_period"], "2026-01-01")
        self.assertIsInstance(result["latest_observed_dtwl"], float)
        self.assertTrue(math.isfinite(result["latest_observed_dtwl"]))

        # Check 4-quarter forecasts
        forecasts = result["forecasts"]
        self.assertEqual(len(forecasts), 4)

        horizons = [fc["horizon_step"] for fc in forecasts]
        self.assertEqual(horizons, [1, 2, 3, 4])

        # Verify H1 is non-recursive and H2-H4 are recursive
        self.assertFalse(forecasts[0]["is_recursive"])
        for fc in forecasts[1:]:
            self.assertTrue(fc["is_recursive"])

        # Verify numerical properties of predictions
        for fc in forecasts:
            pred = fc["pred_dtwl"]
            self.assertIsInstance(pred, float)
            self.assertTrue(math.isfinite(pred))
            self.assertGreater(pred, 0.0)
            self.assertLess(pred, 60.0)  # Physically plausible depth in mbgl
            self.assertIn("target_period", fc)
            self.assertIn("season", fc)
            self.assertEqual(fc["model_used"], "xgboost_primary_exp01")

        # Check chronological sequence of targets
        target_periods = [fc["target_period"] for fc in forecasts]
        self.assertEqual(target_periods, sorted(target_periods))
        self.assertEqual(target_periods[0], "2026-05-01")
        self.assertEqual(target_periods[1], "2026-08-01")
        self.assertEqual(target_periods[2], "2026-11-01")
        self.assertEqual(target_periods[3], "2027-01-01")

    def test_04_robust_tier_live_prediction(self):
        """Run real prediction on block with 3-19 records: Andhra Pradesh -> Anakapalli -> K.Kotapadu."""
        result = forecast_service.generate_live_forecast("Andhra Pradesh", "Anakapalli", "K.Kotapadu")
        self.assertIsNotNone(result)

        self.assertTrue(result["eligible_for_ml"])
        self.assertEqual(result["model_tier"], "robust")
        self.assertEqual(result["model_used"], "xgboost_fallback_robust_exp02")
        self.assertGreaterEqual(result["history_count"], 3)
        self.assertLess(result["history_count"], 20)

        forecasts = result["forecasts"]
        self.assertEqual(len(forecasts), 4)
        for fc in forecasts:
            pred = fc["pred_dtwl"]
            self.assertIsInstance(pred, float)
            self.assertTrue(math.isfinite(pred))
            self.assertGreater(pred, 0.0)
            self.assertEqual(fc["model_used"], "xgboost_fallback_robust_exp02")

    def test_05_ineligible_block_rejected(self):
        """Verify that blocks with <3 historical records are rejected by guardrails."""
        result = forecast_service.generate_live_forecast("Assam", "Kokrajhar", "Mahamaya-Btc")
        self.assertIsNotNone(result)

        self.assertFalse(result["eligible_for_ml"])
        self.assertEqual(result["model_tier"], "ineligible")
        self.assertIsNone(result["model_used"])
        self.assertLess(result["history_count"], 3)
        self.assertEqual(len(result["forecasts"]), 0)
        self.assertIn("guardrails", result["message"].lower())

    def test_06_nonexistent_block_returns_none(self):
        """Verify that an unknown block returns None."""
        result = forecast_service.generate_live_forecast("Punjab", "Bathinda", "NonExistentBlockXYZ")
        self.assertIsNone(result)


if __name__ == "__main__":
    unittest.main()
