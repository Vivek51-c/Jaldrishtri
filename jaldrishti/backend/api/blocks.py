"""
api/blocks.py
=============
API endpoints for administrative blocks lookup.
"""

from typing import Optional
from fastapi import APIRouter, Query
from services.data_service import data_service
from utils.responses import success_response, error_response

router = APIRouter()


@router.get("/map")
def get_national_map_blocks(
    state: Optional[str] = Query(None, description="Optional filter by state name"),
    risk_level: Optional[str] = Query(None, description="Optional filter by risk level (SAFE, WATCH, CRITICAL)")
):
    """
    Returns real geospatially-referenced block telemetry records for the national map:
    - id: Unique block identifier (State__District__Block)
    - state: State / UT name
    - district: District name
    - block: Block name
    - latitude: Centroid latitude derived from monitored wells
    - longitude: Centroid longitude derived from monitored wells
    - current_dtwl: Current depth to water level (mbgl)
    - trend_m_per_year: Groundwater depth trend (m/year)
    - risk_level: SAFE, WATCH, or CRITICAL
    - risk_score: CGWB multi-criteria risk score
    - stage_of_extraction: Estimated extraction stage percentage
    - wells_count: Count of monitored observation wells
    """
    blocks = data_service.get_map_blocks(state=state, risk_level=risk_level)
    return success_response(blocks)


@router.get("/{state}/{district}")
def get_blocks_for_district(state: str, district: str):
    """
    Returns all administrative blocks for a given state and district.
    Returns HTTP 404 if the state or district is not found.
    """
    blocks = data_service.get_blocks(state, district)
    if blocks is None:
        return error_response(
            message=f"No administrative blocks found for district '{district}' in state '{state}'.",
            error="District or State Not Found",
            status_code=404
        )
    return success_response(blocks)
