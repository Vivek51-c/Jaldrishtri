"""
api/forecast.py
===============
API endpoints for approved groundwater level forecasts (H1-H4 quarters ahead).
"""

from fastapi import APIRouter
from services.data_service import data_service
from services.forecast_service import forecast_service
from utils.responses import success_response, error_response

router = APIRouter()


@router.get("/{state}/{district}/{block}/live")
def get_live_forecast(state: str, district: str, block: str):
    """
    Executes real-time XGBoost inference on the block's historical groundwater series
    and returns a recursive 4-quarter forward projection (H1 through H4).
    Uses the Baseline model for history_count >= 20, or Robust model for 3 <= history_count <= 19.
    Returns HTTP 404 if the block has no groundwater history.
    """
    live_result = forecast_service.generate_live_forecast(state, district, block)
    if live_result is None:
        return error_response(
            message=f"No groundwater monitoring records found for block '{block}' in '{district}', '{state}'.",
            error="Block Not Found",
            status_code=404,
        )
    return success_response(live_result)


@router.get("/{state}/{district}/{block}")
def get_approved_forecasts(state: str, district: str, block: str):
    """
    Returns the four approved forecast horizons (H1-H4) from forecasts_approved.csv.
    Each forecast horizon includes:
    - horizon_step: 1, 2, 3, or 4
    - target_period: Target observation date
    - season: Target seasonal quarter
    - pred_dtwl: Predicted depth to water level (meters below ground level)
    - lower: Calibrated lower confidence bound
    - upper: Calibrated upper confidence bound
    - model_used: Primary baseline or robust regularized XGBoost model
    - is_recursive: True if step uses autoregressive recursive feedback
    - low_data: True if historical observation series is sparse (<10 quarters)

    Returns HTTP 404 if no approved forecasts exist for the block.
    """
    forecasts = data_service.get_block_forecast(state, district, block)
    if forecasts is None:
        return error_response(
            message=f"No approved forecasts available for block '{block}' in '{district}', '{state}'.",
            error="Forecast Not Found",
            status_code=404
        )
    return success_response(forecasts)
