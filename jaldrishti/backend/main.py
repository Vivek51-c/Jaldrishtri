"""
main.py
=======
FastAPI application entry point for the JalDrishti Groundwater Intelligence Platform.

Responsibilities:
- Initializes the FastAPI app with lifespan event to load and validate production datasets.
- Configures Cross-Origin Resource Sharing (CORS) for seamless local React frontend development.
- Exposes health monitoring endpoint (/api/health).
- Mounts production API routers (states, districts, blocks, history, forecast, risk, wells, summary).
- Enforces standardized JSON error formatting without leaking stack traces.
"""

import os
import sys
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from dotenv import load_dotenv

from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

# Ensure the backend directory is on the Python module search path
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# Load environment configuration from .env file
load_dotenv(dotenv_path=BASE_DIR / ".env")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

# Import the data and model services
from services.data_service import data_service
from services.model_service import model_service

# Import modular API routers
from api.states import router as states_router
from api.blocks import router as blocks_router
from api.history import router as history_router
from api.forecast import router as forecast_router
from api.risk import router as risk_router
from api.wells import router as wells_router
from api.summary import router as summary_router
from api.simulate import router as simulate_router
from api.advisor import router as advisor_router
from api.crops import router as crops_router
from api.canals import router as canals_router

logger = logging.getLogger("jaldrishti.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager:
    Initializes and validates all production datasets into memory at server startup.
    Loads and validates production XGBoost baseline and robust forecasting models.
    Fails startup clearly if validation fails.
    """
    try:
        data_service.initialize()
        model_service.load_models()
    except Exception as exc:
        print(f"\n[FATAL ERROR] Startup validation failed: {exc}\n")
        raise exc
    yield


# Initialize the FastAPI application
app = FastAPI(
    title="JalDrishti Groundwater Intelligence API",
    description="Backend API serving groundwater predictions, historical analysis, risk scoring, and geospatial telemetry for India.",
    version="1.0.0",
    lifespan=lifespan,
)

# -----------------------------------------------------------------------------
# CORS Middleware Configuration
# -----------------------------------------------------------------------------
cors_origins_env = os.getenv("CORS_ORIGINS", "*")
origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
if not origins or "*" in origins:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True if "*" not in origins else False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------------------------------------------------------
# Global Error Handling (Standardized JSON without Stack Traces)
# -----------------------------------------------------------------------------
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handles standard HTTPExceptions cleanly."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail if isinstance(exc.detail, str) else "HTTP Error",
            "message": str(exc.detail)
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handles request validation errors cleanly with HTTP 400."""
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "success": False,
            "error": "Bad Request",
            "message": "Invalid request parameter format."
        }
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Catches unhandled errors and returns HTTP 500 without stack trace."""
    logger.error("Unhandled server exception: %s", exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "Internal Server Error",
            "message": "An unexpected server error occurred."
        }
    )


# -----------------------------------------------------------------------------
# Health Check Endpoint
# -----------------------------------------------------------------------------
@app.get("/api/health", tags=["Health"])
def health_check():
    """
    Standard health check endpoint to verify backend service operational status.
    """
    return {
        "status": "ok",
        "service": "JalDrishti Backend"
    }


@app.get("/", tags=["Root"])
def root():
    """
    Root endpoint providing API information and documentation link.
    """
    return {
        "service": "JalDrishti Groundwater Intelligence API",
        "status": "operational",
        "docs_url": "/docs",
        "health_endpoint": "/api/health"
    }


# -----------------------------------------------------------------------------
# Router Registrations (Production Endpoints)
# -----------------------------------------------------------------------------
# Administrative Hierarchy: /api/states, /api/districts/{state}
app.include_router(states_router, prefix="/api", tags=["Administrative"])

# Blocks Lookup: /api/blocks/{state}/{district}
app.include_router(blocks_router, prefix="/api/blocks", tags=["Blocks"])

# Historical Series: /api/history/{state}/{district}/{block}
app.include_router(history_router, prefix="/api/history", tags=["History"])

# Forecast Projections: /api/forecast/{state}/{district}/{block}
app.include_router(forecast_router, prefix="/api/forecast", tags=["Forecast"])

# Risk Categorization: /api/risk/{state}/{district}/{block}
app.include_router(risk_router, prefix="/api/risk", tags=["Risk"])

# Monitored Well Pins: /api/wells/{state}/{district}/{block}
app.include_router(wells_router, prefix="/api/wells", tags=["Wells"])

# National Summary KPIs: /api/summary
app.include_router(summary_router, prefix="/api", tags=["Summary"])

# Simulation & Advisory Placeholders (preserved for future workstream)
app.include_router(simulate_router, prefix="/api/simulate", tags=["Simulate"])
app.include_router(advisor_router, prefix="/api/advisor", tags=["Advisor"])

# Agriculture Extension Placeholders (Awaiting official datasets)
app.include_router(crops_router, prefix="/api/crops", tags=["Crops"])
app.include_router(canals_router, prefix="/api/canals", tags=["Canals"])


if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host=host, port=port, reload=True)
