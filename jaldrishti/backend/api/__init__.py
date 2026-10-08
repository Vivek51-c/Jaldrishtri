"""
api/
====
FastAPI router definitions for all JalDrishti endpoints.

Contains routers for:
- states: Listing states and districts
- blocks: Administrative blocks lookup
- history: Historical groundwater observation records (1994-2026)
- forecast: 4-quarter forward groundwater predictions
- risk: Criticality classification and vulnerability indexes
- wells: Observation well coordinates and village metadata
- summary: National summary KPIs
- simulate: Scenario impact simulations (placeholder for future phase)
- advisor: Actionable policy and farming advisories (placeholder for future phase)
"""

from .states import router as states_router
from .blocks import router as blocks_router
from .history import router as history_router
from .forecast import router as forecast_router
from .risk import router as risk_router
from .wells import router as wells_router
from .summary import router as summary_router
from .simulate import router as simulate_router
from .advisor import router as advisor_router
from .crops import router as crops_router
from .canals import router as canals_router

__all__ = [
    "states_router",
    "blocks_router",
    "history_router",
    "forecast_router",
    "risk_router",
    "wells_router",
    "summary_router",
    "simulate_router",
    "advisor_router",
    "crops_router",
    "canals_router",
]

