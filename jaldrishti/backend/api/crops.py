from typing import Optional
from pathlib import Path

import pandas as pd
from fastapi import APIRouter, HTTPException, Query

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "processed" / "block_crop_advisory_features.csv"
REFERENCE_PATH = BASE_DIR / "data" / "processed" / "crop_reference.csv"


_crop_df = None
_ref_df = None


def load_crop_data():
    global _crop_df
    if _crop_df is None and DATA_PATH.exists():
        _crop_df = pd.read_csv(DATA_PATH)
    return _crop_df


def load_ref_data():
    global _ref_df
    if _ref_df is None and REFERENCE_PATH.exists():
        _ref_df = pd.read_csv(REFERENCE_PATH)
    return _ref_df


@router.get("/supported")
def get_supported_crops():
    df = load_ref_data()
    if df is None:
        return {"success": True, "supported_crops": ["Rice", "Wheat", "Maize", "Cotton", "Millet"], "total": 5}
    crops = df["crop_name"].dropna().unique().tolist()
    return {
        "success": True,
        "supported_crops": crops,
        "total": len(crops)
    }


@router.get("/status")
def get_crop_dataset_status():
    return {
        "success": True,
        "is_dataset_loaded": DATA_PATH.exists(),
        "status": "LOADED" if DATA_PATH.exists() else "UNAVAILABLE"
    }


@router.get("/{state}/{district}/{block}")
def get_block_crops(
    state: str,
    district: str,
    block: str,
    crop: Optional[str] = Query(None)
):
    df = load_crop_data()
    if df is None:
        return {
            "success": True,
            "state": state,
            "district": district,
            "block": block,
            "total": 0,
            "data": []
        }

    s_norm = state.strip().upper()
    d_norm = district.strip().upper()
    b_norm = block.strip().upper()

    # Exact match on state, district, block
    result = df[
        (df["state"].astype(str).str.strip().str.upper() == s_norm) &
        (df["district"].astype(str).str.strip().str.upper() == d_norm) &
        (df["block"].astype(str).str.strip().str.upper() == b_norm)
    ]

    # If no block-level match, fallback to district level
    if result.empty:
        result = df[
            (df["state"].astype(str).str.strip().str.upper() == s_norm) &
            (df["district"].astype(str).str.strip().str.upper() == d_norm)
        ]

    if crop and not result.empty:
        c_norm = crop.strip().upper()
        result = result[
            result["crop_name"].astype(str).str.strip().str.upper() == c_norm
        ]

    return {
        "success": True,
        "state": state,
        "district": district,
        "block": block,
        "total": len(result),
        "data": result.fillna("").to_dict(orient="records")
    }