"""
tests/test_data_service.py
==========================
Unit and integration tests for DataService using the actual processed datasets.
"""

import sys
from pathlib import Path
import unittest

# Ensure the backend directory is on the Python module search path
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from services.data_service import data_service


class TestDataService(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        data_service.initialize()

    def test_service_initialization(self):
        """Verify that datasets are loaded and metrics are positive."""
        self.assertTrue(data_service.is_initialized)
        self.assertGreater(data_service.total_wells_loaded, 30000)
        self.assertGreater(data_service.total_history_loaded, 500000)
        self.assertGreater(data_service.total_forecasts_loaded, 20000)
        self.assertGreater(data_service.total_risk_loaded, 5000)

    def test_get_states(self):
        """Verify that get_states returns actual Indian states/UTs."""
        states = data_service.get_states()
        self.assertIsInstance(states, list)
        self.assertGreaterEqual(len(states), 30)
        self.assertIn("Punjab", states)
        self.assertIn("Andaman And Nicobar Islands", states)

    def test_get_districts(self):
        """Verify district lookup for a valid state."""
        districts = data_service.get_districts("Punjab")
        self.assertIsInstance(districts, list)
        self.assertIn("Bathinda", districts)

        # Invalid state should return None
        self.assertIsNone(data_service.get_districts("NonExistentStateXYZ"))

    def test_get_blocks(self):
        """Verify block lookup for a valid district."""
        blocks = data_service.get_blocks("Punjab", "Bathinda")
        self.assertIsInstance(blocks, list)
        self.assertIn("Talwandi Sabo", blocks)

        # Invalid district should return None
        self.assertIsNone(data_service.get_blocks("Punjab", "InvalidDistrictXYZ"))

    def test_get_block_history(self):
        """Verify historical series retrieval for Talwandi Sabo."""
        data = data_service.get_block_history("Punjab", "Bathinda", "Talwandi Sabo")
        self.assertIsNotNone(data)
        self.assertIn("history", data)
        history = data["history"]
        self.assertGreater(len(history), 0)
        first_record = history[0]
        self.assertIn("period", first_record)
        self.assertIn("season", first_record)
        self.assertIn("avg_dtwl", first_record)
        self.assertIn("n_wells", first_record)
        self.assertIsInstance(first_record["avg_dtwl"], float)

        # Check chronological order
        periods = [h["period"] for h in history]
        self.assertEqual(periods, sorted(periods))

    def test_get_block_forecast(self):
        """Verify 4-quarter forecast retrieval for Talwandi Sabo."""
        forecasts = data_service.get_block_forecast("Punjab", "Bathinda", "Talwandi Sabo")
        self.assertIsNotNone(forecasts)
        self.assertEqual(len(forecasts), 4)

        horizons = [f["horizon_step"] for f in forecasts]
        self.assertEqual(horizons, [1, 2, 3, 4])

        for fc in forecasts:
            self.assertIn("target_period", fc)
            self.assertIn("season", fc)
            self.assertIn("pred_dtwl", fc)
            self.assertIn("lower", fc)
            self.assertIn("upper", fc)
            self.assertIn("model_used", fc)
            self.assertIsInstance(fc["pred_dtwl"], float)
            self.assertLessEqual(fc["lower"], fc["upper"])

    def test_get_block_risk(self):
        """Verify risk record retrieval for Talwandi Sabo."""
        risk = data_service.get_block_risk("Punjab", "Bathinda", "Talwandi Sabo")
        self.assertIsNotNone(risk)
        self.assertIn(risk["risk_level"], ["SAFE", "WATCH", "CRITICAL"])
        self.assertIsInstance(risk["risk_score"], int)
        self.assertIsInstance(risk["current_dtwl"], float)
        self.assertIsInstance(risk["trend_m_per_year"], float)
        self.assertIn("risk_reason", risk)
        self.assertGreater(len(risk["risk_reason"]), 0)

    def test_get_block_wells(self):
        """Verify well coordinates for Talwandi Sabo."""
        wells = data_service.get_block_wells("Punjab", "Bathinda", "Talwandi Sabo")
        self.assertIsNotNone(wells)
        self.assertGreater(len(wells), 0)
        well = wells[0]
        self.assertIn("well_id", well)
        self.assertIn("village", well)
        self.assertIsInstance(well["latitude"], float)
        self.assertIsInstance(well["longitude"], float)
        # Lat/Long bounds check for India
        self.assertGreaterEqual(well["latitude"], 6.0)
        self.assertLessEqual(well["latitude"], 38.0)
        self.assertGreaterEqual(well["longitude"], 68.0)
        self.assertLessEqual(well["longitude"], 98.0)

    def test_get_national_summary(self):
        """Verify national summary computation."""
        summary = data_service.get_national_summary()
        self.assertIsNotNone(summary)
        self.assertGreaterEqual(summary["total_states"], 30)
        self.assertGreaterEqual(summary["total_districts"], 700)
        self.assertGreaterEqual(summary["total_blocks"], 5000)
        self.assertGreaterEqual(summary["total_monitored_wells"], 30000)
        self.assertEqual(summary["total_blocks_with_approved_forecasts"], 5405)
        self.assertEqual(summary["safe_count"] + summary["watch_count"] + summary["critical_count"], 5405)
        self.assertTrue(summary["latest_available_observation_period"].startswith("202"))

    def test_invalid_block_returns_none(self):
        """Verify that an unknown block returns None."""
        self.assertIsNone(data_service.get_block_history("Punjab", "Bathinda", "FakeBlockXYZ"))
        self.assertIsNone(data_service.get_block_forecast("Punjab", "Bathinda", "FakeBlockXYZ"))
        self.assertIsNone(data_service.get_block_risk("Punjab", "Bathinda", "FakeBlockXYZ"))
        self.assertIsNone(data_service.get_block_wells("Punjab", "Bathinda", "FakeBlockXYZ"))


if __name__ == "__main__":
    unittest.main()
