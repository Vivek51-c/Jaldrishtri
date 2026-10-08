"""
api/wells.py
============
API endpoints for monitored groundwater observation wells.
"""

from fastapi import APIRouter
from services.data_service import data_service
from utils.responses import success_response, error_response

router = APIRouter()


@router.get("/{state}/{district}/{block}")
def get_monitored_wells(state: str, district: str, block: str):
    """
    Returns the monitoring observation wells located in the block from wells.csv.
    Each well includes:
    - well_id: Unique station identifier
    - village: Village or locality name
    - latitude: Decimal degrees latitude
    - longitude: Decimal degrees longitude

    Returns HTTP 404 if the block is unknown.
    """
    wells = data_service.get_block_wells(state, district, block)
    if wells is None:
        return error_response(
            message=f"Block '{block}' in '{district}', '{state}' was not found in the well registry.",
            error="Block Not Found",
            status_code=404
        )
    return success_response(wells)
