"""
tests/test_simulator_service.py
===============================
Unit and integration tests for the transparent Scenario Simulation Service.

Verifies:
1. BASELINE scenario preserves forecast trajectory without modification.
2. CONSERVATION scenario produces shallower/less deep trajectory.
3. HIGH_EXTRACTION scenario produces deeper/more severe trajectory.
4. Conservation produces directionally improved trajectory compared with baseline.
5. High extraction produces directionally worse trajectory compared with baseline.
6. Deterministic output: repeated simulations yield identical outputs.
7. Bounded inputs: valid extreme bounds (-100% to +100%) execute and remain bounded.
8. Invalid inputs: out-of-range, non-numeric, or illegal scenario names raise SimulationValidationError.
9. Nonexistent block raises LocationNotFoundError.
10. Insufficient-data block (<3 historical records) raises InsufficientDataError.
11. Output structure conforms strictly to specified contract.
12. Scientific limitations are prominently included.
13. Official risk level remains distinct from estimated scenario risk.
"""

import sys
from pathlib import Path
import unittest

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from services.data_service import data_service
from services.simulator_service import (
    simulator_service,
    SimulationValidationError,
    LocationNotFoundError,
    InsufficientDataError,
)


class TestSimulatorService(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        data_service.initialize()

    def test_01_baseline_scenario(self):
        """1. BASELINE scenario uses existing forecast without scenario adjustment."""
        res = simulator_service.run_simulation(
            "Punjab", "Bathinda", "Talwandi Sabo", scenario="BASELINE"
        )
        self.assertEqual(res["scenario"], "BASELINE")
        self.assertEqual(res["state"], "Punjab")
        self.assertEqual(res["district"], "Bathinda")
        self.assertEqual(res["block"], "Talwandi Sabo")

        # Baseline and simulated horizons must match exactly
        self.assertEqual(res["simulated"]["h1"], res["baseline"]["h1"])
        self.assertEqual(res["simulated"]["h2"], res["baseline"]["h2"])
        self.assertEqual(res["simulated"]["h3"], res["baseline"]["h3"])
        self.assertEqual(res["simulated"]["h4"], res["baseline"]["h4"])
        self.assertEqual(res["simulated"]["forecast_change_m"], res["baseline"]["forecast_change_m"])
        self.assertEqual(res["simulated"]["estimated_risk_level"], res["baseline"]["risk_level"])

        # Impact must indicate zero change
        self.assertEqual(res["impact"]["overall_change_m"], 0.0)
        self.assertEqual(res["impact"]["direction"], "UNCHANGED")

    def test_02_conservation_scenario(self):
        """2. CONSERVATION scenario represents reduced demand & improved efficiency."""
        res = simulator_service.run_simulation(
            "Punjab", "Bathinda", "Talwandi Sabo", scenario="CONSERVATION"
        )
        self.assertEqual(res["scenario"], "CONSERVATION")
        self.assertEqual(res["inputs"]["water_use_change_percent"], -20.0)
        self.assertEqual(res["inputs"]["irrigation_efficiency_change_percent"], 20.0)
        self.assertEqual(res["inputs"]["extraction_change_percent"], -20.0)

        # Simulated trajectory should be shallower / less deep
        self.assertLess(res["simulated"]["h4"], res["baseline"]["h4"])
        self.assertLess(res["impact"]["overall_change_m"], 0.0)
        self.assertEqual(res["impact"]["direction"], "IMPROVED")

    def test_03_high_extraction_scenario(self):
        """3. HIGH_EXTRACTION scenario represents increased groundwater demand."""
        res = simulator_service.run_simulation(
            "Punjab", "Bathinda", "Talwandi Sabo", scenario="HIGH_EXTRACTION"
        )
        self.assertEqual(res["scenario"], "HIGH_EXTRACTION")
        self.assertEqual(res["inputs"]["water_use_change_percent"], 20.0)
        self.assertEqual(res["inputs"]["irrigation_efficiency_change_percent"], -10.0)
        self.assertEqual(res["inputs"]["extraction_change_percent"], 20.0)

        # Simulated trajectory should be deeper / more severe
        self.assertGreater(res["simulated"]["h4"], res["baseline"]["h4"])
        self.assertGreater(res["impact"]["overall_change_m"], 0.0)
        self.assertEqual(res["impact"]["direction"], "DEGRADED")

    def test_04_directional_improvement_conservation(self):
        """4. Conservation produces a directionally improved trajectory compared with baseline."""
        base = simulator_service.run_simulation("Punjab", "Bathinda", "Talwandi Sabo", scenario="BASELINE")
        cons = simulator_service.run_simulation("Punjab", "Bathinda", "Talwandi Sabo", scenario="CONSERVATION")

        self.assertLess(cons["simulated"]["h1"], base["simulated"]["h1"])
        self.assertLess(cons["simulated"]["h2"], base["simulated"]["h2"])
        self.assertLess(cons["simulated"]["h3"], base["simulated"]["h3"])
        self.assertLess(cons["simulated"]["h4"], base["simulated"]["h4"])
        self.assertLess(cons["simulated"]["forecast_change_m"], base["simulated"]["forecast_change_m"])
        self.assertEqual(cons["impact"]["direction"], "IMPROVED")

    def test_05_directional_worsening_high_extraction(self):
        """5. High extraction produces a directionally worse trajectory compared with baseline."""
        base = simulator_service.run_simulation("Punjab", "Bathinda", "Talwandi Sabo", scenario="BASELINE")
        high = simulator_service.run_simulation("Punjab", "Bathinda", "Talwandi Sabo", scenario="HIGH_EXTRACTION")

        self.assertGreater(high["simulated"]["h1"], base["simulated"]["h1"])
        self.assertGreater(high["simulated"]["h2"], base["simulated"]["h2"])
        self.assertGreater(high["simulated"]["h3"], base["simulated"]["h3"])
        self.assertGreater(high["simulated"]["h4"], base["simulated"]["h4"])
        self.assertGreater(high["simulated"]["forecast_change_m"], base["simulated"]["forecast_change_m"])
        self.assertEqual(high["impact"]["direction"], "DEGRADED")

    def test_06_deterministic_output(self):
        """6. Simulation results must be strictly deterministic and reproducible."""
        run1 = simulator_service.run_simulation("Punjab", "Bathinda", "Talwandi Sabo", scenario="CONSERVATION")
        run2 = simulator_service.run_simulation("Punjab", "Bathinda", "Talwandi Sabo", scenario="CONSERVATION")

        self.assertEqual(run1["simulated"], run2["simulated"])
        self.assertEqual(run1["impact"], run2["impact"])
        self.assertEqual(run1["interpretation"], run2["interpretation"])

    def test_07_bounded_inputs(self):
        """7. Parameter values at valid limits [-100, 100] are accepted and output remains bounded."""
        res_min = simulator_service.run_simulation(
            "Punjab", "Bathinda", "Talwandi Sabo",
            scenario="CONSERVATION",
            water_use_change_percent=-100.0,
            irrigation_efficiency_change_percent=100.0,
            extraction_change_percent=-100.0,
        )
        self.assertGreaterEqual(res_min["simulated"]["h1"], 0.1)
        self.assertGreaterEqual(res_min["simulated"]["h4"], 0.1)
        # Bounded by MAX_SENSITIVITY_COEFFICIENT_METERS = 1.50m
        self.assertGreaterEqual(res_min["impact"]["overall_change_m"], -1.50)

        res_max = simulator_service.run_simulation(
            "Punjab", "Bathinda", "Talwandi Sabo",
            scenario="HIGH_EXTRACTION",
            water_use_change_percent=100.0,
            irrigation_efficiency_change_percent=-100.0,
            extraction_change_percent=100.0,
        )
        self.assertLessEqual(res_max["impact"]["overall_change_m"], 1.50)

    def test_08_invalid_inputs(self):
        """8. Invalid scenario names, out-of-range, and non-numeric inputs raise SimulationValidationError."""
        # Illegal scenario name
        with self.assertRaises(SimulationValidationError):
            simulator_service.run_simulation("Punjab", "Bathinda", "Talwandi Sabo", scenario="UNKNOWN_SCENARIO")

        # Out-of-range (> 100%)
        with self.assertRaises(SimulationValidationError):
            simulator_service.run_simulation(
                "Punjab", "Bathinda", "Talwandi Sabo",
                scenario="CONSERVATION",
                water_use_change_percent=120.0
            )

        # Out-of-range (< -100%)
        with self.assertRaises(SimulationValidationError):
            simulator_service.run_simulation(
                "Punjab", "Bathinda", "Talwandi Sabo",
                scenario="CONSERVATION",
                extraction_change_percent=-105.0
            )

        # Non-numeric input
        with self.assertRaises(SimulationValidationError):
            simulator_service.run_simulation(
                "Punjab", "Bathinda", "Talwandi Sabo",
                scenario="CONSERVATION",
                water_use_change_percent="invalid_val"  # type: ignore
            )

    def test_09_nonexistent_block(self):
        """9. Querying an unmapped block raises LocationNotFoundError."""
        with self.assertRaises(LocationNotFoundError):
            simulator_service.run_simulation("Punjab", "Bathinda", "NonExistentBlockXYZ")

    def test_10_insufficient_data_block(self):
        """10. Querying a block with <3 observations raises InsufficientDataError."""
        with self.assertRaises(InsufficientDataError):
            simulator_service.run_simulation("Assam", "Kokrajhar", "Mahamaya-Btc")

    def test_11_output_structure(self):
        """11. Output contains all specified keys and datatypes."""
        res = simulator_service.run_simulation("Punjab", "Bathinda", "Talwandi Sabo", scenario="CONSERVATION")

        expected_top_keys = {
            "state", "district", "block", "scenario", "inputs",
            "baseline", "simulated", "impact", "interpretation", "limitations"
        }
        self.assertTrue(expected_top_keys.issubset(set(res.keys())))

        # Inputs
        self.assertIn("water_use_change_percent", res["inputs"])
        self.assertIn("irrigation_efficiency_change_percent", res["inputs"])
        self.assertIn("extraction_change_percent", res["inputs"])

        # Baseline
        for k in ["current_dtwl_m", "h1", "h2", "h3", "h4", "forecast_change_m", "risk_level"]:
            self.assertIn(k, res["baseline"])

        # Simulated
        for k in ["h1", "h2", "h3", "h4", "forecast_change_m", "estimated_risk_level"]:
            self.assertIn(k, res["simulated"])

        # Impact
        for k in ["h1_change_m", "h4_change_m", "overall_change_m", "direction"]:
            self.assertIn(k, res["impact"])

    def test_12_limitations_included(self):
        """12. Scientific limitations list is included and prominent."""
        res = simulator_service.run_simulation("Punjab", "Bathinda", "Talwandi Sabo")
        limitations = res["limitations"]
        self.assertIsInstance(limitations, list)
        self.assertGreaterEqual(len(limitations), 2)
        joined = " ".join(limitations).lower()
        self.assertIn("scenario-based sensitivity estimate", joined)
        self.assertIn("not a physical groundwater-flow simulation", joined)
        self.assertIn("aquifer properties", joined)

    def test_13_official_risk_distinct_from_estimated_risk(self):
        """13. Official risk remains distinct and authoritative; scenario risk is labeled estimated_risk_level."""
        res = simulator_service.run_simulation(
            "Punjab", "Bathinda", "Talwandi Sabo",
            scenario="CONSERVATION",
            water_use_change_percent=-40.0,
            irrigation_efficiency_change_percent=40.0,
            extraction_change_percent=-40.0,
        )
        # Official risk is unmodified
        self.assertEqual(res["baseline"]["risk_level"], "WATCH")
        # Scenario risk moderates to SAFE
        self.assertEqual(res["simulated"]["estimated_risk_level"], "SAFE")
        # Baseline risk level is untouched in official record
        official_rec = data_service.get_block_risk("Punjab", "Bathinda", "Talwandi Sabo")
        self.assertEqual(official_rec["risk_level"].upper(), "WATCH")


if __name__ == "__main__":
    unittest.main()
