"""
api/states.py
=============
API endpoints for administrative state and district navigation.
"""

from fastapi import APIRouter
from services.data_service import data_service
from utils.responses import success_response, error_response

router = APIRouter()


@router.get("/states/comparison")
def get_states_comparison():
    """
    Returns comparative telemetry, risk distribution, and aquifer statistics for all 35 States & UTs.
    """
    return success_response(data_service.get_states_detailed())


@router.get("/states")
def get_states(detailed: bool = False):
    """
    Returns all 35 available Indian States and Union Territories.
    If detailed=True, returns comprehensive telemetry & risk statistics per state.
    """
    if detailed:
        return success_response(data_service.get_states_detailed())
    states = data_service.get_states()
    return success_response(states)


@router.get("/districts/{state}")
def get_districts_by_state(state: str):
    """
    Returns all standardized districts for the given state.
    Returns HTTP 404 if state is not found.
    """
    districts = data_service.get_districts(state)
    if districts is None:
        return error_response(
            message=f"State '{state}' was not found in the groundwater registry.",
            error="State Not Found",
            status_code=404
        )
    return success_response(districts)
