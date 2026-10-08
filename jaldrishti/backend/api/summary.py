"""
api/summary.py
==============
API endpoint for national summary metrics and overview statistics.
"""

from fastapi import APIRouter
from services.data_service import data_service
from utils.responses import success_response

router = APIRouter()


@router.get("/summary")
def get_national_summary():
    """
    Returns the real-time calculated national groundwater overview metrics:
    - total_states
    - total_districts
    - total_blocks
    - total_monitored_wells
    - total_blocks_with_approved_forecasts
    - safe_count
    - watch_count
    - critical_count
    - latest_available_observation_period
    """
    summary = data_service.get_national_summary()
    return success_response(summary)
