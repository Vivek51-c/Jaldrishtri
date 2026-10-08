"""
utils/responses.py
==================
Standardized API response helpers for the JalDrishti backend.

Enforces uniform contract:
Success:
{
    "success": true,
    "data": ...
}

Error:
{
    "success": false,
    "error": "...",
    "message": "..."
}
"""

from typing import Any
from fastapi.responses import JSONResponse


def success_response(data: Any, status_code: int = 200) -> JSONResponse:
    """Returns a standardized JSON success response."""
    return JSONResponse(
        status_code=status_code,
        content={"success": True, "data": data}
    )


def error_response(
    message: str,
    error: str = "NOT_FOUND",
    status_code: int = 404
) -> JSONResponse:
    """Returns a standardized JSON error response with appropriate HTTP status."""
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "error": error,
            "message": message
        }
    )
