"""
services/crop_service.py
========================
Crop Data Service Interface for JalDrishti.

RESPONSIBILITIES:
- Prepare structural integration for the eventual official agricultural crop dataset.
- Enforce strict constraint: Support ONLY these five crops:
    1. Rice
    2. Wheat
    3. Maize
    4. Cotton
    5. Millet
- DO NOT invent, mock, fabricate, or assume any crop data or suitability scores.
- Return controlled pending states and descriptive errors when accessed prior
  to dataset delivery.

TODO: Once the official crop dataset is compiled and audited by the data collection
team, implement:
1. CSV/Parquet loading in `load_dataset()`.
2. Block-level crop acreage, water demand, and seasonal cropping pattern lookups.
3. Strict validation against official CGWB and Ministry of Agriculture classifications.
"""

import logging
from typing import Dict, List, Optional, Any

logger = logging.getLogger("jaldrishti.crop_service")

# Supported agricultural crops (strictly constrained to the five specified crops)
SUPPORTED_CROPS: tuple[str, ...] = (
    "Rice",
    "Wheat",
    "Maize",
    "Cotton",
    "Millet",
)

# Canonical lowercase mapping for case-insensitive validation
_CROP_CANONICAL_MAP: Dict[str, str] = {
    c.lower(): c for c in SUPPORTED_CROPS
}


class CropDatasetNotAvailableError(RuntimeError):
    """
    Raised when crop queries are invoked before the official crop dataset
    has been supplied to the backend.
    """
    pass


class InvalidCropError(ValueError):
    """
    Raised when an unsupported crop is requested.
    """
    pass


class CropService:
    """
    Service interface for querying regional crop water requirements and patterns.
    Currently in pending-dataset state awaiting delivery of official records.
    """

    def __init__(self) -> None:
        self._is_loaded: bool = False
        self._crop_data_index: Dict[str, Any] = {}

    @property
    def is_dataset_loaded(self) -> bool:
        """Indicates whether the official crop dataset has been ingested."""
        return self._is_loaded

    def get_supported_crops(self) -> List[str]:
        """Returns the immutable list of the five supported crops."""
        return list(SUPPORTED_CROPS)

    def validate_crop(self, crop_name: str) -> str:
        """
        Validates that the crop is one of the five supported crops.
        Returns the canonical capitalized name or raises InvalidCropError.
        """
        if not crop_name or not isinstance(crop_name, str):
            raise InvalidCropError(
                f"Crop name must be a non-empty string. Supported crops: {list(SUPPORTED_CROPS)}"
            )
        normalized = crop_name.strip().lower()
        if normalized not in _CROP_CANONICAL_MAP:
            raise InvalidCropError(
                f"Unsupported crop '{crop_name}'. JalDrishti strictly supports: {list(SUPPORTED_CROPS)}"
            )
        return _CROP_CANONICAL_MAP[normalized]

    def load_dataset(self, dataset_path: Optional[str] = None) -> bool:
        """
        Loads the official crop dataset once provided.

        TODO: Implement data ingestion once official crop records are delivered
        by the data collection team. Currently no-ops and returns False.
        """
        # NO-OP: Official dataset pending delivery.
        # DO NOT fabricate or load mock data.
        logger.info("Crop dataset not provided yet. Service initialized in pending state.")
        self._is_loaded = False
        return False

    def get_crop_data(
        self,
        state: str,
        district: str,
        block: str,
        crop: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Retrieves crop information for a specific administrative block.

        Raises CropDatasetNotAvailableError because official crop data is not yet available.
        Does NOT fabricate or mock crop suitability values.
        """
        if crop is not None:
            # Validate crop name even in pending state to fail fast on invalid crops
            self.validate_crop(crop)

        if not self._is_loaded:
            raise CropDatasetNotAvailableError(
                "Official agricultural crop dataset is currently being compiled by the "
                "data collection team and has not yet been integrated into JalDrishti. "
                "No mock or fabricated crop suitability data is served."
            )

        # TODO: Implement retrieval logic once official dataset is loaded.
        return {}


# Singleton instance
crop_service = CropService()
