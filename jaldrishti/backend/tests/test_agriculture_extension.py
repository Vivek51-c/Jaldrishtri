"""
tests/test_agriculture_extension.py
===================================
Unit and integration tests for future agricultural data service integration scaffolding.

Verifies:
1. Module imports for crop_service, canal_service, and agriculture_service succeed.
2. Supported crops whitelist strictly permits ONLY Rice, Wheat, Maize, Cotton, and Millet.
3. Unsupported crop queries raise InvalidCropError.
4. Services initialize safely without datasets in controlled pending states.
5. Invoking crop, canal, or integrated agricultural queries produces controlled errors/states
   (CropDatasetNotAvailableError, CanalDatasetNotAvailableError, AgricultureDataPendingError)
   rather than crashing the backend.
6. API status and lookup endpoints return controlled HTTP 200 / 503 responses without fabricating data.
"""

import sys
from pathlib import Path
import unittest

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from fastapi.testclient import TestClient
from main import app
from services.crop_service import (
    crop_service,
    CropService,
    SUPPORTED_CROPS,
    CropDatasetNotAvailableError,
    InvalidCropError,
)
from services.canal_service import (
    canal_service,
    CanalService,
    CanalDatasetNotAvailableError,
)
from services.agriculture_service import (
    agriculture_service,
    AgricultureService,
    AgricultureDataPendingError,
)
from services.data_service import data_service


class TestAgricultureExtension(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        data_service.initialize()
        cls.client = TestClient(app)

    def test_01_module_imports(self):
        """1. All agriculture extension modules and error types import successfully."""
        self.assertIsInstance(crop_service, CropService)
        self.assertIsInstance(canal_service, CanalService)
        self.assertIsInstance(agriculture_service, AgricultureService)

    def test_02_supported_crops_whitelist(self):
        """2. Supported crops strictly matches the specified 5 crops."""
        expected_crops = ["Rice", "Wheat", "Maize", "Cotton", "Millet"]
        self.assertEqual(crop_service.get_supported_crops(), expected_crops)
        self.assertEqual(list(SUPPORTED_CROPS), expected_crops)

        # Test case-insensitive validation
        self.assertEqual(crop_service.validate_crop("rice"), "Rice")
        self.assertEqual(crop_service.validate_crop("WHEAT"), "Wheat")
        self.assertEqual(crop_service.validate_crop("maize"), "Maize")
        self.assertEqual(crop_service.validate_crop("cotton"), "Cotton")
        self.assertEqual(crop_service.validate_crop("Millet"), "Millet")

    def test_03_invalid_crop_rejection(self):
        """3. Crops outside the 5 supported crops are rejected with InvalidCropError."""
        for invalid in ["Sugarcane", "Barley", "Soybean", "Paddy", "", "UnknownCrop"]:
            with self.assertRaises(InvalidCropError):
                crop_service.validate_crop(invalid)

    def test_04_initialization_without_datasets(self):
        """4. Services initialize safely without datasets and report pending status."""
        self.assertFalse(crop_service.is_dataset_loaded)
        self.assertFalse(canal_service.is_dataset_loaded)

        # Loading attempt without actual files gracefully returns False without crashing
        self.assertFalse(crop_service.load_dataset())
        self.assertFalse(canal_service.load_dataset())

        status = agriculture_service.get_integration_status()
        self.assertFalse(status["crop_dataset_loaded"])
        self.assertFalse(status["canal_dataset_loaded"])
        self.assertEqual(status["status"], "AWAITING_EXTERNAL_DATASETS")
        self.assertIn("Non-ML", status["engine_type"])

    def test_05_crop_service_dataset_pending_error(self):
        """5. Querying crop data prior to dataset arrival raises CropDatasetNotAvailableError."""
        with self.assertRaises(CropDatasetNotAvailableError) as ctx:
            crop_service.get_crop_data("Punjab", "Bathinda", "Talwandi Sabo", crop="Rice")
        self.assertIn("being compiled", str(ctx.exception).lower())
        self.assertIn("no mock", str(ctx.exception).lower())

    def test_06_canal_service_dataset_pending_error(self):
        """6. Querying canal data prior to GIS arrival raises CanalDatasetNotAvailableError."""
        with self.assertRaises(CanalDatasetNotAvailableError) as ctx:
            canal_service.get_block_canal_info("Punjab", "Bathinda", "Talwandi Sabo")
        self.assertIn("being compiled", str(ctx.exception).lower())
        self.assertIn("cannot be assumed", str(ctx.exception).lower())

    def test_07_agriculture_service_pending_error(self):
        """7. Querying combined agriculture recommendations raises AgricultureDataPendingError."""
        with self.assertRaises(AgricultureDataPendingError) as ctx:
            agriculture_service.generate_agricultural_plan(
                "Punjab", "Bathinda", "Talwandi Sabo", crop="Wheat"
            )
        self.assertIn("pending official datasets", str(ctx.exception).lower())
        self.assertIn("does not serve fabricated", str(ctx.exception).lower())

    def test_08_crops_api_endpoints(self):
        """8. Crops API endpoints return supported crops and controlled pending status."""
        # /api/crops/supported
        resp_supp = self.client.get("/api/crops/supported")
        self.assertEqual(resp_supp.status_code, 200)
        body_supp = resp_supp.json()
        self.assertTrue(body_supp.get("success"))
        self.assertEqual(body_supp["data"]["supported_crops"], ["Rice", "Wheat", "Maize", "Cotton", "Millet"])

        # /api/crops/status
        resp_stat = self.client.get("/api/crops/status")
        self.assertEqual(resp_stat.status_code, 200)
        body_stat = resp_stat.json()
        self.assertEqual(body_stat["data"]["status"], "PENDING_COLLECTION")

        # Block lookup -> 503 Service Unavailable with DATASET_PENDING
        resp_block = self.client.get("/api/crops/Punjab/Bathinda/Talwandi%20Sabo")
        self.assertEqual(resp_block.status_code, 503)
        body_block = resp_block.json()
        self.assertFalse(body_block.get("success"))
        self.assertEqual(body_block.get("error"), "DATASET_PENDING")

        # Invalid crop query parameter -> 400 Bad Request
        resp_bad = self.client.get("/api/crops/Punjab/Bathinda/Talwandi%20Sabo?crop=Barley")
        self.assertEqual(resp_bad.status_code, 400)
        self.assertFalse(resp_bad.json().get("success"))
        self.assertEqual(resp_bad.json().get("error"), "INVALID_CROP")

    def test_09_canals_api_endpoints(self):
        """9. Canals API endpoints return status and controlled pending status."""
        # /api/canals/status
        resp_stat = self.client.get("/api/canals/status")
        self.assertEqual(resp_stat.status_code, 200)
        body_stat = resp_stat.json()
        self.assertEqual(body_stat["data"]["status"], "PENDING_COLLECTION")

        # Block lookup -> 503 Service Unavailable with DATASET_PENDING
        resp_block = self.client.get("/api/canals/Punjab/Bathinda/Talwandi%20Sabo")
        self.assertEqual(resp_block.status_code, 503)
        body_block = resp_block.json()
        self.assertFalse(body_block.get("success"))
        self.assertEqual(body_block.get("error"), "DATASET_PENDING")


if __name__ == "__main__":
    unittest.main()
