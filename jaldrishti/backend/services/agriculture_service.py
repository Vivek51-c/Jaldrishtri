"""
services/agriculture_service.py
===============================
Agricultural Decision and Cross-Domain Recommendation Service for JalDrishti.

RESPONSIBILITIES:
- Architected to eventually combine:
    1. Authoritative Groundwater Risk & Forecast Trajectory (CGWB + XGBoost)
    2. Regional Agricultural Cropping Patterns (Rice, Wheat, Maize, Cotton, Millet)
    3. Canal Command Area & Surface Water Availability (GIS Telemetry)
- STRICT DESIGN CONSTRAINT: Must be a transparent, rule-based decision engine,
  NOT an opaque ML model. No ML models may be trained for agriculture scoring.
- NO GLOBAL HARDCODING: Cropping guidance must reflect local aquifer stress,
  soil moisture indicators, and canal conjunctive use rules once data arrives.
- PENDING DATASETS: Crop and canal datasets are actively being collected.
  Until both datasets are integrated and verified, this service operates in a
  controlled pending state and will NOT invent or fabricate agricultural guidance.

TODO: Once crop and canal datasets are loaded:
1. Formulate transparent agro-climatic water budgeting matrices.
2. Establish conjunctive water use rules (balancing canal release with tubewell draft).
3. Generate localized crop diversification and irrigation scheduling advisories.
"""

import logging
from typing import Dict, List, Optional, Any

from services.crop_service import crop_service, SUPPORTED_CROPS, CropDatasetNotAvailableError, InvalidCropError
from services.canal_service import canal_service, CanalDatasetNotAvailableError
from services.data_service import data_service

logger = logging.getLogger("jaldrishti.agriculture_service")


class AgricultureDataPendingError(RuntimeError):
    """
    Raised when combined agricultural recommendations are requested before
    both crop and canal datasets are loaded into the backend.
    """
    pass


class AgricultureService:
    """
    Transparent rule-based service for cross-domain agricultural water management.
    Awaits delivery of official crop records and canal GIS layers.
    """

    def __init__(self) -> None:
        pass

    def get_integration_status(self) -> Dict[str, Any]:
        """
        Reports operational readiness of cross-domain agricultural modules.
        Provides transparent tracking of which datasets are live versus pending.
        """
        return {
            "groundwater_telemetry_live": data_service.is_initialized,
            "crop_dataset_loaded": crop_service.is_dataset_loaded,
            "canal_dataset_loaded": canal_service.is_dataset_loaded,
            "supported_crops": list(SUPPORTED_CROPS),
            "engine_type": "Transparent Rule-Based Decision Matrix (Non-ML)",
            "status": (
                "OPERATIONAL"
                if crop_service.is_dataset_loaded and canal_service.is_dataset_loaded
                else "AWAITING_EXTERNAL_DATASETS"
            ),
            "message": (
                "Groundwater intelligence and forecasting are active. Integrated "
                "agricultural recommendations await official crop records and "
                "canal GIS layers currently being collected."
            ),
        }

    def generate_agricultural_plan(
        self,
        state: str,
        district: str,
        block: str,
        crop: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generates integrated agricultural water-use recommendations for a block.

        Currently raises AgricultureDataPendingError to strictly prevent serving
        mock or fabricated recommendations before official datasets arrive.
        """
        # Validate crop whitelist if crop was requested
        if crop is not None:
            crop_service.validate_crop(crop)

        # Check if prerequisite datasets are available
        if not crop_service.is_dataset_loaded or not canal_service.is_dataset_loaded:
            missing = []
            if not crop_service.is_dataset_loaded:
                missing.append("Crop Pattern Dataset")
            if not canal_service.is_dataset_loaded:
                missing.append("Canal Network GIS Dataset")

            raise AgricultureDataPendingError(
                f"Integrated agricultural advisory for block '{block}' cannot be generated. "
                f"Pending official datasets: {', '.join(missing)}. "
                "JalDrishti does not serve fabricated agricultural or canal data. "
                "Groundwater risk and forecast remain accessible via /api/forecast and /api/risk."
            )

        # TODO: Implement transparent rule-based conjunctive water use calculation
        # combining groundwater forecast + crop water requirement + canal supply.
        return {}


# Singleton instance
agriculture_service = AgricultureService()
