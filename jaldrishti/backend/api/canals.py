from pathlib import Path

import pandas as pd
from fastapi import APIRouter, HTTPException

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "processed" / "block_canal_features.csv"


_canal_df = None


def load_canal_data():
    global _canal_df
    if _canal_df is None and DATA_PATH.exists():
        _canal_df = pd.read_csv(DATA_PATH)
    return _canal_df


@router.get("/status")
def get_canal_dataset_status():
    return {
        "success": True,
        "is_dataset_loaded": DATA_PATH.exists(),
        "status": "LOADED" if DATA_PATH.exists() else "UNAVAILABLE"
    }


@router.get("/{state}/{district}/{block}")
def get_block_canals(
    state: str,
    district: str,
    block: str,
):
    df = load_canal_data()
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

    records = []
    for _, row in result.iterrows():
        rec = row.fillna("").to_dict()
        b_name = str(row["block"]).strip().title()
        d_name = str(row["district"]).strip().title()
        s_name = str(row["state"]).strip().title()

        canals = []
        try:
            main_len = float(row.get("main_canal_length_km") or 0.0)
            if main_len > 0:
                canals.append({
                    "canal_name": "Main Canal",
                    "canal_type": "Main Canal",
                    "length_km": round(main_len, 2),
                    "block": b_name,
                    "district": d_name,
                    "state": s_name,
                })
        except (ValueError, TypeError):
            pass

        try:
            dist_len = float(row.get("distributary_length_km") or 0.0)
            if dist_len > 0:
                canals.append({
                    "canal_name": "Distributary Canal",
                    "canal_type": "Distributary Canal",
                    "length_km": round(dist_len, 2),
                    "block": b_name,
                    "district": d_name,
                    "state": s_name,
                })
        except (ValueError, TypeError):
            pass

        try:
            minor_len = float(row.get("minor_canal_length_km") or 0.0)
            if minor_len > 0:
                canals.append({
                    "canal_name": "Minor Canal",
                    "canal_type": "Minor Canal",
                    "length_km": round(minor_len, 2),
                    "block": b_name,
                    "district": d_name,
                    "state": s_name,
                })
        except (ValueError, TypeError):
            pass

        try:
            total_len = float(row.get("canal_length_km") or 0.0)
            if not canals and total_len > 0:
                canals.append({
                    "canal_name": "Irrigation Canal",
                    "canal_type": "Irrigation Canal",
                    "length_km": round(total_len, 2),
                    "block": b_name,
                    "district": d_name,
                    "state": s_name,
                })
        except (ValueError, TypeError):
            pass

        rec["canals"] = canals
        records.append(rec)

    return {
        "success": True,
        "state": state,
        "district": district,
        "block": block,
        "total": len(records),
        "data": records
    }