"""
schemas/
========
Pydantic data models for request validation and response serialization.
Ensures strong typing and data contract enforcement between the frontend
and JalDrishti backend APIs.
"""

from .prediction import (
    PredictionRequest,
    PredictionResponse,
    HistoricalRecordSchema,
)

__all__ = [
    "PredictionRequest",
    "PredictionResponse",
    "HistoricalRecordSchema",
]
