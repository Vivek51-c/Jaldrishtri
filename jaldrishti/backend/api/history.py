"""
api/history.py
==============
API endpoints for historical groundwater monitoring time series.
"""

from fastapi import APIRouter
from services.data_service import data_service
from utils.responses import success_response, error_response

router = APIRouter()


@router.get("/{state}/{district}/{block}")
def get_historical_groundwater(state: str, district: str, block: str):
    """
    Returns the chronological historical groundwater time series for a block
    from the validated block_series.csv dataset (1994-2026).
    Returns HTTP 404 if the block has no historical records.
    """
    data = data_service.get_block_history(state, district, block)
    if data is None:
        return error_response(
            message=f"No historical groundwater records found for block '{block}' in '{district}', '{state}'.",
            error="Historical Records Not Found",
            status_code=404
        )
    return success_response(data)
