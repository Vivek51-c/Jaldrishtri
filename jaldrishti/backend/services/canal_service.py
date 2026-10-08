"""
services/canal_service.py
=========================
Canal Network and Irrigation Data Service Interface for JalDrishti.

RESPONSIBILITIES:
- Prepare structural integration for the eventual official canal irrigation GIS dataset.
- Support block-level surface water and canal telemetry once official spatial layers arrive.
- DO NOT assume or fabricate canal-to-block relationships until actual GIS shapefiles/polygons
  and verified block boundaries are delivered.
- DO NOT invent canal names, discharges, commands, or proximity metrics.
- Return controlled pending states and descriptive errors when queried prior to dataset delivery.

TODO: Once the official canal dataset and GIS layers are delivered by the data collection team:
1. Ingest canal geospatial geometry and command area intersections in `load_dataset()`.
2. Compute accurate block-level canal presence, distributaries, and design discharge.
3. Validate spatial alignment against official CGWB / Central Water Commission (CWC) boundaries.
"""

import logging
from typing import Dict, List, Optional, Any

logger = logging.getLogger("jaldrishti.canal_service")


class CanalDatasetNotAvailableError(RuntimeError):
    """
    Raised when canal queries are invoked before the official canal GIS dataset
    has been supplied to the backend.
    """
    pass


class CanalService:
    """
    Service interface for querying regional canal network infrastructure.
    Currently in pending-dataset state awaiting delivery of official spatial layers.
    """

    def __init__(self) -> None:
        self._is_loaded: bool = False
        self._canal_index: Dict[str, Any] = {}

    @property
    def is_dataset_loaded(self) -> bool:
        """Indicates whether the official canal dataset has been ingested."""
        return self._is_loaded

    def load_dataset(self, dataset_path: Optional[str] = None) -> bool:
        """
        Loads the official canal GIS dataset once provided.

        TODO: Implement GIS/tabular ingestion once official canal records are delivered
        by the data collection team. Currently no-ops and returns False.
        """
        # NO-OP: Official dataset pending delivery.
        # DO NOT fabricate spatial relationships or mock canal command areas.
        logger.info("Canal dataset not provided yet. Service initialized in pending state.")
        self._is_loaded = False
        return False

    def get_block_canal_info(
        self,
        state: str,
        district: str,
        block: str
    ) -> Dict[str, Any]:
        """
        Retrieves canal network presence and command area metrics for an administrative block.

        Raises CanalDatasetNotAvailableError because official canal GIS data is not yet available.
        Does NOT fabricate or mock canal-to-block linkages.
        """
        if not self._is_loaded:
            raise CanalDatasetNotAvailableError(
                "Official canal irrigation GIS dataset is currently being compiled by the "
                "data collection team and has not yet been integrated into JalDrishti. "
                "Canal-to-block relationships cannot be assumed until verified spatial "
                "layers are available. No mock canal data is served."
            )

        # TODO: Implement spatial intersection queries once official GIS layers are loaded.
        return {}


# Singleton instance
canal_service = CanalService()
