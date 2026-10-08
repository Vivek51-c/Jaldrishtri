"""
schemas/prediction.py
=====================
Pydantic schemas for JalDrishti groundwater forecasting and depth to water level (DTWL)
predictions.

Dataset structure supported:
- STATE_UT: State or Union Territory
- DISTRICT: District name
- BLOCK: Administrative block / Tehsil
- VILLAGE: Village or monitoring station name
- LATITUDE: Geo latitude coordinate
- LONGITUDE: Geo longitude coordinate
- DATE: Date of observation / prediction horizon
- DTWL: Depth to Water Level (in meters below ground level - mbgl)
"""

from typing import Optional, List
from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    """
    Schema for groundwater prediction request.
    Will be consumed by the XGBoost model inference service.
    """
    state_ut: str = Field(..., description="State or Union Territory name", example="PUNJAB")
    district: Optional[str] = Field(None, description="District name", example="LUDHIANA")
    block: Optional[str] = Field(None, description="Block name", example="LUDHIANA-1")
    village: Optional[str] = Field(None, description="Village or station name", example="CENTRAL")
    latitude: Optional[float] = Field(None, description="Latitude coordinate", example=30.9010)
    longitude: Optional[float] = Field(None, description="Longitude coordinate", example=75.8573)
    target_date: Optional[str] = Field(None, description="Target prediction date (YYYY-MM-DD)", example="2026-06-01")
    season: Optional[str] = Field(None, description="Season (Pre-monsoon, Monsoon, Post-monsoon)", example="Pre-monsoon")


class PredictionResponse(BaseModel):
    """
    Schema for groundwater prediction response returned to the frontend.
    """
    state_ut: str
    district: Optional[str] = None
    block: Optional[str] = None
    predicted_dtwl: float = Field(..., description="Predicted Depth to Water Level in mbgl (meters below ground level)")
    water_level_unit: str = "mbgl"
    risk_level: str = Field(..., description="Safe, Semi-Critical, Critical, or Over-Exploited")
    confidence: Optional[float] = Field(None, description="Model prediction confidence score")
    prediction_horizon: Optional[str] = None
    notes: Optional[str] = None


class HistoricalRecordSchema(BaseModel):
    """
    Schema for a single historical observation record matching the dataset columns.
    """
    state_ut: str
    district: str
    block: str
    village: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    date: str
    dtwl: float = Field(..., description="Observed Depth to Water Level in meters")
