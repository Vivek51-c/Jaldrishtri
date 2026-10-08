"""
tests/test_advisor_service.py
=============================
Unit and integration tests for the rule-based Groundwater Advisor Service.

Verifies:
1. SAFE block maps to LOW_RISK advisory.
2. WATCH block maps to MODERATE_RISK advisory.
3. CRITICAL block maps to CRITICAL_RISK advisory.
4. Insufficient-data block (<3 observations) maps to INSUFFICIENT_DATA.
5. Trend interpretation accurately describes depth change (deeper/shallower water table).
6. Forecast interpretation accurately compares current depth with forward horizons.
7. No fabricated crop or canal information in the response.
8. Required response structure and fields are complete.
9. Nonexistent block returns None.
"""

import sys
from pathlib import Path
import unittest

# Ensure backend directory is in sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from services.data_service import data_service
from services.advisor_service import advisor_service


class TestAdvisorService(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        data_service.initialize()

    def test_01_safe_block_maps_to_low_risk(self):
        """1. SAFE block generates a LOW_RISK advisory with stable recommendations."""
        res = advisor_service.generate_advisory(
            "Andaman And Nicobar Islands", "North And Middle Andaman", "Diglipur"
        )
        self.assertIsNotNone(res)
        self.assertEqual(res["advisory_level"], "LOW_RISK")
        self.assertEqual(res["risk_level"], "SAFE")
        self.assertIsInstance(res["current_groundwater_depth_m"], float)
        self.assertGreater(len(res["recommendations"]), 0)
        # Verify recommendation wording aligns with low risk
        combined_recs = " ".join(res["recommendations"]).lower()
        self.assertIn("stable", combined_recs)

    def test_02_watch_block_maps_to_moderate_risk(self):
        """2. WATCH block (Talwandi Sabo) generates a MODERATE_RISK advisory."""
        res = advisor_service.generate_advisory("Punjab", "Bathinda", "Talwandi Sabo")
        self.assertIsNotNone(res)
        self.assertEqual(res["advisory_level"], "MODERATE_RISK")
        self.assertEqual(res["risk_level"], "WATCH")
        self.assertEqual(res["risk_score"], 4)
        self.assertAlmostEqual(res["current_groundwater_depth_m"], 9.32, delta=0.1)

        combined_recs = " ".join(res["recommendations"]).lower()
        self.assertIn("monitoring", combined_recs)
        self.assertIn("irrigation", combined_recs)

    def test_03_critical_block_maps_to_critical_risk(self):
        """3. CRITICAL block generates a CRITICAL_RISK advisory."""
        res = advisor_service.generate_advisory("Andhra Pradesh", "Anakapalli", "Paravada")
        self.assertIsNotNone(res)
        self.assertEqual(res["advisory_level"], "CRITICAL_RISK")
        self.assertEqual(res["risk_level"], "CRITICAL")
        self.assertGreaterEqual(res["risk_score"], 6)

        combined_recs = " ".join(res["recommendations"]).lower()
        self.assertIn("severe", combined_recs)
        self.assertIn("micro-irrigation", combined_recs)

    def test_04_insufficient_data_block(self):
        """4. Insufficient-data block (<3 historical records) returns INSUFFICIENT_DATA."""
        res = advisor_service.generate_advisory("Assam", "Kokrajhar", "Mahamaya-Btc")
        self.assertIsNotNone(res)
        self.assertEqual(res["advisory_level"], "INSUFFICIENT_DATA")
        self.assertIsNone(res["risk_score"])
        self.assertIsNone(res["trend"])
        self.assertIsNone(res["forecast"])
        self.assertIn("insufficient", res["summary"].lower())

    def test_05_trend_interpretation(self):
        """5. Trend interpretation clearly indicates depth increase/decrease."""
        res = advisor_service.generate_advisory("Punjab", "Bathinda", "Talwandi Sabo")
        self.assertIsNotNone(res)
        trend = res["trend"]
        self.assertIn("trend_m_per_year", trend)
        self.assertIn("recent_trend", trend)
        self.assertIn("interpretation", trend)
        # Must describe depth and water table movement
        self.assertIn("water table", trend["interpretation"].lower())
        self.assertIn("depth", trend["interpretation"].lower())

    def test_06_forecast_interpretation(self):
        """6. Forecast interpretation includes H1-H4 and forecast_change."""
        res = advisor_service.generate_advisory("Punjab", "Bathinda", "Talwandi Sabo")
        self.assertIsNotNone(res)
        fc = res["forecast"]
        self.assertIn("h1", fc)
        self.assertIn("h2", fc)
        self.assertIn("h3", fc)
        self.assertIn("h4", fc)
        self.assertIn("forecast_change", fc)
        self.assertIn("uncertainty", fc)
        self.assertIsInstance(fc["h1"], float)
        self.assertIsInstance(fc["forecast_change"], float)

    def test_07_no_fabricated_crop_or_canal_data(self):
        """7. Verify that no crop or canal data is fabricated in the response."""
        res = advisor_service.generate_advisory("Punjab", "Bathinda", "Talwandi Sabo")
        self.assertIsNotNone(res)
        # Ensure response contains only groundwater-based advisory data
        self.assertNotIn("crop_recommendation", res)
        self.assertNotIn("canal_schedule", res)
        self.assertNotIn("crop_duty", res)
        self.assertNotIn("canal_discharge", res)

    def test_08_complete_response_structure(self):
        """8. Verify all required response fields are present and well-structured."""
        res = advisor_service.generate_advisory("Punjab", "Bathinda", "Talwandi Sabo")
        self.assertIsNotNone(res)
        required_keys = {
            "state",
            "district",
            "block",
            "advisory_level",
            "risk_level",
            "risk_score",
            "current_groundwater_depth_m",
            "trend",
            "forecast",
            "summary",
            "recommendations",
            "limitations",
        }
        self.assertTrue(required_keys.issubset(set(res.keys())))
        self.assertIsInstance(res["recommendations"], list)
        self.assertIsInstance(res["limitations"], list)
        self.assertGreater(len(res["limitations"]), 0)

    def test_09_nonexistent_block_returns_none(self):
        """9. Completely unknown block returns None."""
        res = advisor_service.generate_advisory("Punjab", "Bathinda", "NonExistentXYZBlock")
        self.assertIsNone(res)


if __name__ == "__main__":
    unittest.main()
