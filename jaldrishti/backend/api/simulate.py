"""
api/simulate.py
===============
API endpoints for groundwater 'What-If' scenario simulations.

Supports both POST (with JSON payload) and GET (with query parameters) for:
/api/simulate/{state}/{district}/{block}
"""

from typing import Optional
from fastapi import APIRouter, Body, Query, Request
from pydantic import BaseModel, Field

from services.simulator_service import (
    simulator_service,
    SimulationValidationError,
    LocationNotFoundError,
    InsufficientDataError,
)
from utils.responses import success_response, error_response

router = APIRouter()


class SimulationPayload(BaseModel):
    """Schema for simulation request body."""
    scenario: Optional[str] = Field("BASELINE", description="BASELINE, CONSERVATION, or HIGH_EXTRACTION")
    water_use_change_percent: Optional[float] = Field(None, description="Water use change (-100 to +100%)")
    irrigation_efficiency_change_percent: Optional[float] = Field(None, description="Efficiency change (-100 to +100%)")
    extraction_change_percent: Optional[float] = Field(None, description="Extraction change (-100 to +100%)")


@router.post("/{state}/{district}/{block}")
def simulate_post(
    state: str,
    district: str,
    block: str,
    payload: Optional[SimulationPayload] = Body(default_factory=SimulationPayload),
):
    """
    Executes a scenario simulation for the specified block via POST request.
    Payload specifies scenario name and optional parameter adjustments (-100% to +100%).
    """
    req_payload = payload or SimulationPayload()
    try:
        result = simulator_service.run_simulation(
            state=state,
            district=district,
            block=block,
            scenario=req_payload.scenario or "BASELINE",
            water_use_change_percent=req_payload.water_use_change_percent,
            irrigation_efficiency_change_percent=req_payload.irrigation_efficiency_change_percent,
            extraction_change_percent=req_payload.extraction_change_percent,
        )
        return success_response(result)
    except SimulationValidationError as exc:
        return error_response(message=str(exc), error="Bad Request", status_code=400)
    except InsufficientDataError as exc:
        return error_response(message=str(exc), error="Insufficient Data", status_code=400)
    except LocationNotFoundError as exc:
        return error_response(message=str(exc), error="Block Not Found", status_code=404)


@router.get("/{state}/{district}/{block}")
def simulate_get(
    state: str,
    district: str,
    block: str,
    scenario: Optional[str] = Query("BASELINE", description="BASELINE, CONSERVATION, or HIGH_EXTRACTION"),
    water_use_change_percent: Optional[float] = Query(None, description="Water use change (-100 to +100%)"),
    irrigation_efficiency_change_percent: Optional[float] = Query(None, description="Efficiency change (-100 to +100%)"),
    extraction_change_percent: Optional[float] = Query(None, description="Extraction change (-100 to +100%)"),
):
    """
    Executes a scenario simulation for the specified block via GET request with query parameters.
    """
    try:
        result = simulator_service.run_simulation(
            state=state,
            district=district,
            block=block,
            scenario=scenario or "BASELINE",
            water_use_change_percent=water_use_change_percent,
            irrigation_efficiency_change_percent=irrigation_efficiency_change_percent,
            extraction_change_percent=extraction_change_percent,
        )
        return success_response(result)
    except SimulationValidationError as exc:
        return error_response(message=str(exc), error="Bad Request", status_code=400)
    except InsufficientDataError as exc:
        return error_response(message=str(exc), error="Insufficient Data", status_code=400)
    except LocationNotFoundError as exc:
        return error_response(message=str(exc), error="Block Not Found", status_code=404)
