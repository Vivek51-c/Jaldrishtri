"""
tests/test_api.py
=================
Integration tests verifying all FastAPI endpoints against the real datasets.

Verifies:
1. /api/health works.
2. /api/states returns actual states.
3. District lookup works.
4. Block lookup works.
5. History endpoint returns actual data.
6. Forecast endpoint returns 4 horizons.
7. Risk endpoint returns a real risk record.
8. Wells endpoint returns actual coordinates.
9. /api/summary returns actual counts.
10. Invalid block returns HTTP 404.
"""

import sys
from pathlib import Path
import unittest

# Ensure the backend directory is on the Python module search path
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from fastapi.testclient import TestClient
from main import app
from services.data_service import data_service


class TestJalDrishtiAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        data_service.initialize()
        cls.client = TestClient(app)

    def test_01_health_endpoint(self):
        """1. /api/health works and returns status ok."""
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("status"), "ok")
        self.assertEqual(data.get("service"), "JalDrishti Backend")

    def test_02_states_endpoint(self):
        """2. /api/states returns actual states."""
        response = self.client.get("/api/states")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertTrue(body.get("success"))
        states = body.get("data")
        self.assertIsInstance(states, list)
        self.assertGreaterEqual(len(states), 30)
        self.assertIn("Punjab", states)

    def test_03_district_lookup(self):
        """3. District lookup works for a valid state."""
        response = self.client.get("/api/districts/Punjab")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertTrue(body.get("success"))
        districts = body.get("data")
        self.assertIsInstance(districts, list)
        self.assertIn("Bathinda", districts)

        # Invalid state returns 404
        err_resp = self.client.get("/api/districts/NonExistentState123")
        self.assertEqual(err_resp.status_code, 404)
        err_body = err_resp.json()
        self.assertFalse(err_body.get("success"))

    def test_04_block_lookup(self):
        """4. Block lookup works for a valid district."""
        response = self.client.get("/api/blocks/Punjab/Bathinda")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertTrue(body.get("success"))
        blocks = body.get("data")
        self.assertIsInstance(blocks, list)
        self.assertIn("Talwandi Sabo", blocks)

        # Invalid district returns 404
        err_resp = self.client.get("/api/blocks/Punjab/NonExistentDistrict123")
        self.assertEqual(err_resp.status_code, 404)
        self.assertFalse(err_resp.json().get("success"))

    def test_05_history_endpoint(self):
        """5. History endpoint returns actual chronological data."""
        response = self.client.get("/api/history/Punjab/Bathinda/Talwandi%20Sabo")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertTrue(body.get("success"))
        data = body.get("data")
        self.assertEqual(data.get("state"), "Punjab")
        self.assertEqual(data.get("district"), "Bathinda")
        self.assertEqual(data.get("block"), "Talwandi Sabo")
        history = data.get("history")
        self.assertIsInstance(history, list)
        self.assertGreater(len(history), 0)
        first_item = history[0]
        self.assertIn("period", first_item)
        self.assertIn("season", first_item)
        self.assertIn("avg_dtwl", first_item)
        self.assertIn("n_wells", first_item)

    def test_06_forecast_endpoint(self):
        """6. Forecast endpoint returns 4 horizons."""
        response = self.client.get("/api/forecast/Punjab/Bathinda/Talwandi%20Sabo")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertTrue(body.get("success"))
        forecasts = body.get("data")
        self.assertIsInstance(forecasts, list)
        self.assertEqual(len(forecasts), 4)

        horizons = [f["horizon_step"] for f in forecasts]
        self.assertEqual(horizons, [1, 2, 3, 4])

        for fc in forecasts:
            self.assertIn("pred_dtwl", fc)
            self.assertIn("lower", fc)
            self.assertIn("upper", fc)
            self.assertIn("model_used", fc)
            self.assertIn("target_period", fc)
            self.assertIn("season", fc)

    def test_06b_live_forecast_endpoint(self):
        """6b. Live XGBoost forecast endpoint returns 4 recursive horizons."""
        response = self.client.get("/api/forecast/Punjab/Bathinda/Talwandi%20Sabo/live")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertTrue(body.get("success"))
        data = body.get("data")
        self.assertEqual(data.get("state"), "Punjab")
        self.assertEqual(data.get("district"), "Bathinda")
        self.assertEqual(data.get("block"), "Talwandi Sabo")
        self.assertTrue(data.get("eligible_for_ml"))
        self.assertEqual(data.get("model_tier"), "baseline")
        self.assertEqual(data.get("model_used"), "xgboost_primary_exp01")

        forecasts = data.get("forecasts")
        self.assertIsInstance(forecasts, list)
        self.assertEqual(len(forecasts), 4)
        horizons = [f["horizon_step"] for f in forecasts]
        self.assertEqual(horizons, [1, 2, 3, 4])
        self.assertFalse(forecasts[0]["is_recursive"])
        self.assertTrue(forecasts[1]["is_recursive"])
        for fc in forecasts:
            self.assertIsInstance(fc["pred_dtwl"], float)
            self.assertGreater(fc["pred_dtwl"], 0.0)

        # 404 on invalid block
        err_resp = self.client.get("/api/forecast/Punjab/Bathinda/InvalidBlock999/live")
        self.assertEqual(err_resp.status_code, 404)
        self.assertFalse(err_resp.json().get("success"))

    def test_07_risk_endpoint(self):
        """7. Risk endpoint returns a real risk record."""
        response = self.client.get("/api/risk/Punjab/Bathinda/Talwandi%20Sabo")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertTrue(body.get("success"))
        risk = body.get("data")
        self.assertIn(risk.get("risk_level"), ["SAFE", "WATCH", "CRITICAL"])
        self.assertIn("risk_score", risk)
        self.assertIn("risk_reason", risk)
        self.assertIn("current_dtwl", risk)
        self.assertIn("trend_m_per_year", risk)
        self.assertIn("forecast_change", risk)

    def test_08_wells_endpoint(self):
        """8. Wells endpoint returns actual coordinates."""
        response = self.client.get("/api/wells/Punjab/Bathinda/Talwandi%20Sabo")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertTrue(body.get("success"))
        wells = body.get("data")
        self.assertIsInstance(wells, list)
        self.assertGreater(len(wells), 0)
        well = wells[0]
        self.assertIn("well_id", well)
        self.assertIn("village", well)
        self.assertIn("latitude", well)
        self.assertIn("longitude", well)
        self.assertIsInstance(well["latitude"], float)
        self.assertIsInstance(well["longitude"], float)

    def test_09_summary_endpoint(self):
        """9. /api/summary returns actual counts."""
        response = self.client.get("/api/summary")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertTrue(body.get("success"))
        summary = body.get("data")
        self.assertGreaterEqual(summary.get("total_states"), 30)
        self.assertGreaterEqual(summary.get("total_districts"), 700)
        self.assertGreaterEqual(summary.get("total_blocks"), 5000)
        self.assertGreaterEqual(summary.get("total_monitored_wells"), 30000)
        self.assertEqual(summary.get("total_blocks_with_approved_forecasts"), 5405)
        self.assertGreater(summary.get("safe_count"), 0)
        self.assertGreater(summary.get("watch_count"), 0)
        self.assertGreater(summary.get("critical_count"), 0)

    def test_10_invalid_block_returns_404(self):
        """10. Invalid block returns HTTP 404."""
        response = self.client.get("/api/history/Punjab/Bathinda/InvalidBlock999")
        self.assertEqual(response.status_code, 404)
        body = response.json()
        self.assertFalse(body.get("success"))
        self.assertIn("error", body)

        resp2 = self.client.get("/api/forecast/Punjab/Bathinda/InvalidBlock999")
        self.assertEqual(resp2.status_code, 404)

        resp3 = self.client.get("/api/risk/Punjab/Bathinda/InvalidBlock999")
        self.assertEqual(resp3.status_code, 404)

        resp4 = self.client.get("/api/wells/Punjab/Bathinda/InvalidBlock999")
        self.assertEqual(resp4.status_code, 404)

    def test_11_invalid_state_and_district_returns_404(self):
        """11. Requests with invalid state or district return HTTP 404."""
        resp_state = self.client.get("/api/history/InvalidState999/Bathinda/Talwandi%20Sabo")
        self.assertEqual(resp_state.status_code, 404)
        self.assertFalse(resp_state.json().get("success"))

        resp_dist = self.client.get("/api/forecast/Punjab/InvalidDistrict999/Talwandi%20Sabo")
        self.assertEqual(resp_dist.status_code, 404)
        self.assertFalse(resp_dist.json().get("success"))

        resp_risk = self.client.get("/api/risk/InvalidState999/InvalidDistrict999/Talwandi%20Sabo")
        self.assertEqual(resp_risk.status_code, 404)
        self.assertFalse(resp_risk.json().get("success"))

        resp_wells = self.client.get("/api/wells/InvalidState999/Bathinda/Talwandi%20Sabo")
        self.assertEqual(resp_wells.status_code, 404)
        self.assertFalse(resp_wells.json().get("success"))

    def test_12_advisor_endpoint(self):
        """12. Advisor endpoint returns explainable advisories for all tiers and 404 for invalid."""
        # SAFE -> LOW_RISK
        resp_safe = self.client.get(
            "/api/advisor/Andaman%20And%20Nicobar%20Islands/North%20And%20Middle%20Andaman/Diglipur"
        )
        self.assertEqual(resp_safe.status_code, 200)
        body_safe = resp_safe.json()
        self.assertTrue(body_safe.get("success"))
        self.assertEqual(body_safe["data"]["advisory_level"], "LOW_RISK")
        self.assertEqual(body_safe["data"]["risk_level"], "SAFE")

        # WATCH -> MODERATE_RISK (Talwandi Sabo)
        resp_watch = self.client.get("/api/advisor/Punjab/Bathinda/Talwandi%20Sabo")
        self.assertEqual(resp_watch.status_code, 200)
        body_watch = resp_watch.json()
        self.assertTrue(body_watch.get("success"))
        data_watch = body_watch["data"]
        self.assertEqual(data_watch["advisory_level"], "MODERATE_RISK")
        self.assertEqual(data_watch["risk_level"], "WATCH")
        self.assertIn("current_groundwater_depth_m", data_watch)
        self.assertIn("trend", data_watch)
        self.assertIn("forecast", data_watch)
        self.assertIn("recommendations", data_watch)
        self.assertIn("limitations", data_watch)

        # CRITICAL -> CRITICAL_RISK
        resp_crit = self.client.get("/api/advisor/Andhra%20Pradesh/Anakapalli/Paravada")
        self.assertEqual(resp_crit.status_code, 200)
        body_crit = resp_crit.json()
        self.assertTrue(body_crit.get("success"))
        self.assertEqual(body_crit["data"]["advisory_level"], "CRITICAL_RISK")
        self.assertEqual(body_crit["data"]["risk_level"], "CRITICAL")

        # Insufficient data (<3 quarters) -> INSUFFICIENT_DATA with HTTP 200
        resp_inelig = self.client.get("/api/advisor/Assam/Kokrajhar/Mahamaya-Btc")
        self.assertEqual(resp_inelig.status_code, 200)
        body_inelig = resp_inelig.json()
        self.assertTrue(body_inelig.get("success"))
        self.assertEqual(body_inelig["data"]["advisory_level"], "INSUFFICIENT_DATA")

        # Unknown block -> 404
        resp_404 = self.client.get("/api/advisor/Punjab/Bathinda/InvalidBlock999")
        self.assertEqual(resp_404.status_code, 404)
        self.assertFalse(resp_404.json().get("success"))

    def test_13_simulator_endpoint(self):
        """13. Simulator endpoint supports POST and GET scenarios, with validation and 404 handling."""
        # 1. Valid BASELINE (POST)
        post_base = self.client.post(
            "/api/simulate/Punjab/Bathinda/Talwandi%20Sabo",
            json={"scenario": "BASELINE"},
        )
        self.assertEqual(post_base.status_code, 200)
        base_body = post_base.json()
        self.assertTrue(base_body.get("success"))
        self.assertEqual(base_body["data"]["scenario"], "BASELINE")
        self.assertEqual(base_body["data"]["impact"]["direction"], "UNCHANGED")
        self.assertIn("limitations", base_body["data"])

        # 2. Valid CONSERVATION (POST)
        post_cons = self.client.post(
            "/api/simulate/Punjab/Bathinda/Talwandi%20Sabo",
            json={
                "scenario": "CONSERVATION",
                "water_use_change_percent": -20.0,
                "irrigation_efficiency_change_percent": 20.0,
                "extraction_change_percent": -20.0,
            },
        )
        self.assertEqual(post_cons.status_code, 200)
        cons_body = post_cons.json()
        self.assertTrue(cons_body.get("success"))
        self.assertEqual(cons_body["data"]["scenario"], "CONSERVATION")
        self.assertEqual(cons_body["data"]["impact"]["direction"], "IMPROVED")
        self.assertLess(cons_body["data"]["simulated"]["h4"], cons_body["data"]["baseline"]["h4"])

        # 3. Valid HIGH_EXTRACTION (GET)
        get_high = self.client.get(
            "/api/simulate/Punjab/Bathinda/Talwandi%20Sabo?scenario=HIGH_EXTRACTION"
        )
        self.assertEqual(get_high.status_code, 200)
        high_body = get_high.json()
        self.assertTrue(high_body.get("success"))
        self.assertEqual(high_body["data"]["scenario"], "HIGH_EXTRACTION")
        self.assertEqual(high_body["data"]["impact"]["direction"], "DEGRADED")
        self.assertGreater(high_body["data"]["simulated"]["h4"], high_body["data"]["baseline"]["h4"])

        # 4. Invalid scenario name -> HTTP 400
        bad_scen = self.client.post(
            "/api/simulate/Punjab/Bathinda/Talwandi%20Sabo",
            json={"scenario": "EXTREME_FLOOD"},
        )
        self.assertEqual(bad_scen.status_code, 400)
        self.assertFalse(bad_scen.json().get("success"))

        # 5. Invalid parameter out of range (> 100%) -> HTTP 400
        bad_param = self.client.post(
            "/api/simulate/Punjab/Bathinda/Talwandi%20Sabo",
            json={"scenario": "CONSERVATION", "water_use_change_percent": 150.0},
        )
        self.assertEqual(bad_param.status_code, 400)
        self.assertFalse(bad_param.json().get("success"))

        # 6. Unknown location -> HTTP 404
        bad_loc = self.client.post(
            "/api/simulate/Punjab/Bathinda/UnknownBlock123",
            json={"scenario": "BASELINE"},
        )
        self.assertEqual(bad_loc.status_code, 404)
        self.assertFalse(bad_loc.json().get("success"))

        # 7. Insufficient data block -> HTTP 400
        bad_data = self.client.post(
            "/api/simulate/Assam/Kokrajhar/Mahamaya-Btc",
            json={"scenario": "BASELINE"},
        )
        self.assertEqual(bad_data.status_code, 400)
        self.assertFalse(bad_data.json().get("success"))


if __name__ == "__main__":
    unittest.main()
