"""
api/risk.py
===========
API endpoints for groundwater vulnerability and CGWB risk classifications.
"""

from fastapi import APIRouter
from services.data_service import data_service
from utils.responses import success_response, error_response

router = APIRouter()


@router.get("/{state}/{district}/{block}")
def get_risk_assessment(state: str, district: str, block: str):
    """
    Returns the audited risk classification and metrics for a block from risk_candidates.csv:
    - risk_level: SAFE, WATCH, or CRITICAL
    - risk_score: Multi-criteria evidence score (-3 to 13)
    - risk_reason: Plain-text explanation of risk drivers
    - current_dtwl: Current depth to water level (mbgl)
    - trend_m_per_year: Decadal secular linear trend (m/year)
    - recent_trend: Recent 4-year acceleration trend (m/year)
    - forecast_h1..h4: 4-quarter forward projected water table depths
    - forecast_change: Net 1-year change (H4 - current)
    - forecast_uncertainty: Width of prediction bounds at H4
    - history_count: Total historical quarters available
    - low_data: True if data baseline is sparse

    Returns HTTP 404 if no risk record exists for the block.
    """
    risk_record = data_service.get_block_risk(state, district, block)
    if risk_record is None:
        return error_response(
            message=f"No risk classification record found for block '{block}' in '{district}', '{state}'.",
            error="Risk Record Not Found",
            status_code=404
        )
    return success_response(risk_record)
