"""
services/
=========
Business logic, analytics, and data services for JalDrishti.

Contains:
- data_service: In-memory indexed access to production datasets
- model_service: XGBoost model orchestration (for future live prediction)
- forecast_service: Groundwater forecasting business logic
- risk_service: CGWB-aligned risk assessment
- simulator_service: Scenario & rainfall impact simulation
- advisor_service: Actionable conservation & farming advisories
"""

from .data_service import data_service, DataService, DataValidationError
from .model_service import ModelService, model_service
from .forecast_service import ForecastService, forecast_service
from .risk_service import RiskService, risk_service
from .simulator_service import SimulatorService, simulator_service
from .advisor_service import AdvisorService, advisor_service
from .crop_service import (
    CropService,
    crop_service,
    SUPPORTED_CROPS,
    CropDatasetNotAvailableError,
    InvalidCropError,
)
from .canal_service import (
    CanalService,
    canal_service,
    CanalDatasetNotAvailableError,
)
from .agriculture_service import (
    AgricultureService,
    agriculture_service,
    AgricultureDataPendingError,
)

__all__ = [
    "data_service",
    "DataService",
    "DataValidationError",
    "model_service",
    "ModelService",
    "forecast_service",
    "ForecastService",
    "risk_service",
    "RiskService",
    "simulator_service",
    "SimulatorService",
    "advisor_service",
    "AdvisorService",
    "crop_service",
    "CropService",
    "SUPPORTED_CROPS",
    "CropDatasetNotAvailableError",
    "InvalidCropError",
    "canal_service",
    "CanalService",
    "CanalDatasetNotAvailableError",
    "agriculture_service",
    "AgricultureService",
    "AgricultureDataPendingError",
]

