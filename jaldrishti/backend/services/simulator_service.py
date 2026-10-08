"""
services/simulator_service.py
=============================
Transparent Scenario-Analysis Simulation Engine for JalDrishti.

Simulates how user-defined adjustments in agricultural groundwater extraction,
irrigation efficiency, and overall water use alter the forward 4-quarter groundwater
depth trajectory (H1 through H4) relative to the approved ML baseline.

Methodological Principles:
1. Scenario Sensitivity Layer: This is a transparent sensitivity tool, NOT a
   physically calibrated groundwater flow model.
2. Bounded & Monotonic: Adjustments are bounded within physically realistic envelopes
   and behave monotonically.
3. Anchored to Baseline: Computations originate from the authoritative XGBoost
   forecast and Central Ground Water Board (CGWB) risk classifications.
4. Separate Risk Levels: Official risk_level remains untouched; scenario outcomes
   are clearly designated as estimated_risk_level.
"""

import sys
import logging
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple

# Ensure backend directory is in sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from services.data_service import data_service

logger = logging.getLogger("jaldrishti.simulator_service")

# Supported scenario classifications
VALID_SCENARIOS = {"BASELINE", "CONSERVATION", "HIGH_EXTRACTION"}

# Default parameter configurations per scenario (in percent)
SCENARIO_DEFAULTS = {
    "BASELINE": {
        "water_use_change_percent": 0.0,
        "irrigation_efficiency_change_percent": 0.0,
        "extraction_change_percent": 0.0,
    },
    "CONSERVATION": {
        "water_use_change_percent": -20.0,
        "irrigation_efficiency_change_percent": 20.0,
        "extraction_change_percent": -20.0,
    },
    "HIGH_EXTRACTION": {
        "water_use_change_percent": 20.0,
        "irrigation_efficiency_change_percent": -10.0,
        "extraction_change_percent": 20.0,
    },
}

# Maximum 1-year trajectory adjustment under 100% net pressure swing (meters)
MAX_SENSITIVITY_COEFFICIENT_METERS = 1.50


class SimulationValidationError(ValueError):
    """Raised when scenario parameters or names violate validation constraints."""
    pass


class LocationNotFoundError(KeyError):
    """Raised when the specified administrative unit is not found in the dataset."""
    pass


class InsufficientDataError(ValueError):
    """Raised when a block has insufficient historical records (<3 quarters) for simulation."""
    pass


class SimulatorService:
    """
    Service executing transparent scenario sensitivity modeling on groundwater forecasts.
    """

    def run_simulation(
        self,
        state: str,
        district: str,
        block: str,
        scenario: str = "BASELINE",
        water_use_change_percent: Optional[float] = None,
        irrigation_efficiency_change_percent: Optional[float] = None,
        extraction_change_percent: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Executes a bounded scenario simulation for the specified block.

        Parameters:
            state: State or Union Territory name
            district: District name
            block: Administrative Block name
            scenario: 'BASELINE', 'CONSERVATION', or 'HIGH_EXTRACTION'
            water_use_change_percent: Optional adjustment in water demand (-100 to +100%)
            irrigation_efficiency_change_percent: Optional efficiency shift (-100 to +100%)
            extraction_change_percent: Optional pumping adjustment (-100 to +100%)

        Returns:
            Structured dictionary containing baseline, simulated trajectory, impact,
            interpretation, and scientific limitations.
        """
        # 1. Validate scenario name
        scenario_clean = str(scenario or "").strip().upper()
        if scenario_clean not in VALID_SCENARIOS:
            raise SimulationValidationError(
                f"Invalid scenario '{scenario}'. Allowed scenario types are: {', '.join(sorted(VALID_SCENARIOS))}."
            )

        # 2. Validate and resolve parameter percentages
        params = self._resolve_and_validate_parameters(
            scenario=scenario_clean,
            water_use_change_percent=water_use_change_percent,
            irrigation_efficiency_change_percent=irrigation_efficiency_change_percent,
            extraction_change_percent=extraction_change_percent,
        )

        # 3. Retrieve baseline groundwater data
        risk_record = data_service.get_block_risk(state, district, block)
        block_history = data_service.get_block_history(state, district, block)

        if risk_record is None and block_history is None:
            raise LocationNotFoundError(
                f"No groundwater records found for block '{block}' in '{district}', '{state}'."
            )

        history_count = (
            len(block_history["history"])
            if block_history and "history" in block_history
            else (risk_record.get("history_count", 0) if risk_record else 0)
        )

        if risk_record is None or history_count < 3:
            raise InsufficientDataError(
                f"Block '{block}' in '{district}', '{state}' has insufficient historical data "
                f"({history_count} quarters available, minimum 3 required). "
                "Scenario simulation requires an audited baseline forecast."
            )

        canonical_state = risk_record["state"]
        canonical_district = risk_record["district"]
        canonical_block = risk_record["block"]

        # Baseline metrics from authoritative record
        current_dtwl_m = round(float(risk_record["current_dtwl"]), 2)
        base_h1 = round(float(risk_record["forecast_h1"]), 2)
        base_h2 = round(float(risk_record["forecast_h2"]), 2)
        base_h3 = round(float(risk_record["forecast_h3"]), 2)
        base_h4 = round(float(risk_record["forecast_h4"]), 2)
        base_change_m = round(float(risk_record["forecast_change"]), 2)
        official_risk_level = risk_record["risk_level"].upper()

        # 4. Compute Net Pressure Factor (P)
        # Higher pumping/water use increases depth (+); higher efficiency reduces draft (-)
        p_extraction = params["extraction_change_percent"]
        p_water_use = params["water_use_change_percent"]
        p_efficiency = params["irrigation_efficiency_change_percent"]

        net_pressure_index = (
            0.50 * p_extraction + 0.30 * p_water_use - 0.20 * p_efficiency
        )
        # Net pressure clamped within [-100, 100]
        net_pressure_clamped = max(-100.0, min(100.0, net_pressure_index))

        # 5. Apply Bounded Sensitivity Shift across Horizons H1 to H4
        # Delta scales linearly across the 4 quarterly steps (t / 4)
        max_h4_shift = (net_pressure_clamped / 100.0) * MAX_SENSITIVITY_COEFFICIENT_METERS

        delta_h1 = round(max_h4_shift * 0.25, 2)
        delta_h2 = round(max_h4_shift * 0.50, 2)
        delta_h3 = round(max_h4_shift * 0.75, 2)
        delta_h4 = round(max_h4_shift * 1.00, 2)

        # Simulated depths (bounded to non-negative depth >= 0.1 mbgl)
        sim_h1 = round(max(0.1, base_h1 + delta_h1), 2)
        sim_h2 = round(max(0.1, base_h2 + delta_h2), 2)
        sim_h3 = round(max(0.1, base_h3 + delta_h3), 2)
        sim_h4 = round(max(0.1, base_h4 + delta_h4), 2)

        sim_forecast_change_m = round(base_change_m + (sim_h4 - base_h4), 2)

        # 6. Evaluate Direction and Impact
        h1_change_m = round(sim_h1 - base_h1, 2)
        h4_change_m = round(sim_h4 - base_h4, 2)
        overall_change_m = h4_change_m

        if overall_change_m < -0.01:
            direction = "IMPROVED"
        elif overall_change_m > 0.01:
            direction = "DEGRADED"
        else:
            direction = "UNCHANGED"

        # 7. Evaluate Estimated Scenario Risk Level (Transparent threshold shift)
        estimated_risk_level = self._estimate_scenario_risk(
            official_risk=official_risk_level,
            overall_change_m=overall_change_m,
            sim_forecast_change_m=sim_forecast_change_m,
        )

        # 8. Build Plain-Language Scientific Interpretation
        interpretation = self._build_interpretation(
            scenario=scenario_clean,
            direction=direction,
            overall_change_m=overall_change_m,
            sim_forecast_change_m=sim_forecast_change_m,
            base_change_m=base_change_m,
            official_risk=official_risk_level,
            estimated_risk=estimated_risk_level,
        )

        # 9. Assemble Output Structure
        return {
            "state": canonical_state,
            "district": canonical_district,
            "block": canonical_block,
            "scenario": scenario_clean,
            "inputs": {
                "water_use_change_percent": params["water_use_change_percent"],
                "irrigation_efficiency_change_percent": params["irrigation_efficiency_change_percent"],
                "extraction_change_percent": params["extraction_change_percent"],
            },
            "baseline": {
                "current_dtwl_m": current_dtwl_m,
                "h1": base_h1,
                "h2": base_h2,
                "h3": base_h3,
                "h4": base_h4,
                "forecast_change_m": base_change_m,
                "risk_level": official_risk_level,
            },
            "simulated": {
                "h1": sim_h1,
                "h2": sim_h2,
                "h3": sim_h3,
                "h4": sim_h4,
                "forecast_change_m": sim_forecast_change_m,
                "estimated_risk_level": estimated_risk_level,
            },
            "impact": {
                "h1_change_m": h1_change_m,
                "h4_change_m": h4_change_m,
                "overall_change_m": overall_change_m,
                "direction": direction,
            },
            "interpretation": interpretation,
            "limitations": [
                "This is a scenario-based sensitivity estimate, not a physical groundwater-flow simulation.",
                "Actual groundwater conditions depend on rainfall, recharge, pumping, aquifer properties and local hydrogeology.",
            ],
        }

    def _resolve_and_validate_parameters(
        self,
        scenario: str,
        water_use_change_percent: Optional[float],
        irrigation_efficiency_change_percent: Optional[float],
        extraction_change_percent: Optional[float],
    ) -> Dict[str, float]:
        """Validates parameter ranges and populates defaults for the scenario."""
        defaults = SCENARIO_DEFAULTS.get(scenario, SCENARIO_DEFAULTS["BASELINE"])

        def check_val(val: Optional[float], name: str, default: float) -> float:
            if val is None:
                return float(default)
            try:
                f_val = float(val)
            except (ValueError, TypeError) as exc:
                raise SimulationValidationError(
                    f"Parameter '{name}' must be a numeric value. Received: {val}"
                ) from exc

            if f_val < -100.0 or f_val > 100.0:
                raise SimulationValidationError(
                    f"Parameter '{name}' must be within [-100.0, 100.0] percent. Received: {f_val}"
                )
            return round(f_val, 2)

        return {
            "water_use_change_percent": check_val(
                water_use_change_percent, "water_use_change_percent", defaults["water_use_change_percent"]
            ),
            "irrigation_efficiency_change_percent": check_val(
                irrigation_efficiency_change_percent,
                "irrigation_efficiency_change_percent",
                defaults["irrigation_efficiency_change_percent"],
            ),
            "extraction_change_percent": check_val(
                extraction_change_percent, "extraction_change_percent", defaults["extraction_change_percent"]
            ),
        }

    def _estimate_scenario_risk(
        self, official_risk: str, overall_change_m: float, sim_forecast_change_m: float
    ) -> str:
        """
        Calculates the estimated scenario risk tier relative to the authoritative classification.
        Does NOT alter official risk records.
        """
        if overall_change_m <= -0.20:
            # Trajectory improved (less deep)
            if official_risk == "WATCH" and sim_forecast_change_m <= 0.35:
                return "SAFE"
            elif official_risk == "CRITICAL" and overall_change_m <= -0.40:
                return "WATCH"
            return official_risk

        elif overall_change_m >= 0.20:
            # Trajectory degraded (deeper)
            if official_risk == "SAFE" and sim_forecast_change_m >= 0.50:
                return "WATCH"
            elif official_risk == "WATCH" and overall_change_m >= 0.25:
                return "CRITICAL"
            return official_risk

        return official_risk

    def _build_interpretation(
        self,
        scenario: str,
        direction: str,
        overall_change_m: float,
        sim_forecast_change_m: float,
        base_change_m: float,
        official_risk: str,
        estimated_risk: str,
    ) -> str:
        """Constructs transparent, scientifically grounded plain-text interpretation."""
        if scenario == "BASELINE" or direction == "UNCHANGED":
            return (
                f"Under the {scenario} scenario, the forecast trajectory continues without intervention adjustments. "
                f"Projected 1-year groundwater depth change remains at {base_change_m:+.2f} m mbgl "
                f"with an authoritative classification of {official_risk}."
            )
        elif direction == "IMPROVED":
            risk_shift = (
                f" The estimated scenario risk moderates from {official_risk} to {estimated_risk}."
                if estimated_risk != official_risk
                else f" Official risk remains {official_risk}."
            )
            return (
                f"Under this {scenario} scenario, the estimated forecast trajectory is less deep than the baseline "
                f"(net projected 1-year depth adjustment of {overall_change_m:+.2f} m). "
                "Improved irrigation efficiency and reduced groundwater extraction moderate seasonal aquifer drawdown."
                f"{risk_shift}"
            )
        else:  # DEGRADED
            risk_shift = (
                f" The estimated scenario risk escalates from {official_risk} to {estimated_risk}."
                if estimated_risk != official_risk
                else f" Official risk remains {official_risk}."
            )
            return (
                f"Under this {scenario} scenario, the estimated forecast trajectory is deeper than the baseline "
                f"(net projected 1-year depth adjustment of {overall_change_m:+.2f} m). "
                "Increased extraction pressure and higher crop water demand intensify aquifer depletion."
                f"{risk_shift}"
            )


# Singleton instance
simulator_service = SimulatorService()
