# JalDrishti — AI-Based Groundwater Forecasting & Irrigation Advisory for India

> **ML & Data Pipeline Handoff Document**  
> *Audience: Backend & Frontend Engineering Teams*  
> *Status: ML & Data Engineering Complete — Production Database Populated*

---

## Executive Summary

This repository contains the verified machine learning and data engineering artifacts for **JalDrishti**, an AI-driven groundwater forecasting and risk assessment platform for India. 

The **ML and data pipeline work is 100% COMPLETE**. All cleansed historical observations, block-level aggregated time series, validated XGBoost forecasts, and audited groundwater risk classifications have been loaded and verified directly in the shared Supabase production database. 

Backend and frontend engineers can now consume these production tables via Supabase/PostgREST without needing to run, train, or rebuild any part of the ML pipeline.

---

## 1. Project Architecture

The high-level data and ML lifecycle implemented in JalDrishti flows as follows:

```
CGWB groundwater observations (1.6M raw records)
        ↓
Data cleaning + validation (deduplication, bounding box check)
        ↓
Canonical geographic/administrative correction (767 districts, 35 states/UTs)
        ↓
Well-level historical readings (37,866 wells, 1.599M readings)
        ↓
Block-level time-series aggregation (537,611 block-quarter periods)
        ↓
Feature engineering (lags, rolling stats, seasonal encodings, historical slopes)
        ↓
XGBoost groundwater forecasting (H1–H4 quarterly horizons)
        ↓
Forecast validation + hydrological guardrails (bounds, noise envelopes)
        ↓
Risk classification (multi-criteria evidence engine: SAFE / WATCH / CRITICAL)
        ↓
Risk sensitivity audit (10-scenario perturbation stress testing)
        ↓
Supabase production tables (public schema: wells, readings, block_series, forecasts, risk_zones)
        ↓
Backend API (FastAPI / Node.js — To be built by Backend Team)
        ↓
Frontend map & dashboard (Next.js / Mapbox / Leaflet — To be built by Frontend Team)
```

---

## 2. Dataset Summary

The historical dataset originates from the Central Ground Water Board (CGWB) of India:

| Metric | Verified Value | Description / Notes |
| :--- | :---: | :--- |
| **Raw Observations** | **1,600,437** | Initial raw observation records ingested |
| **Final Valid Readings** | **1,599,271** | Validated, clean water level readings |
| **Unique Monitored Wells** | **37,866** | Deduplicated observation wells across India |
| **Rejected Rows** | **1,166** | Filtered during initial data validation: |
| &nbsp;&nbsp;↳ *Exact Duplicates* | *1,157* | Redundant timestamp/well entries |
| &nbsp;&nbsp;↳ *Out of Bounding Box* | *9* | Coordinates falling outside India |
| **Acceptance Rate** | **99.93%** | High data yield retention rate |
| **Block-Level Series Records** | **537,611** | Quarterly aggregated time-series periods |
| **Administrative Blocks** | **6,232** | Total administrative blocks covered |
| **States / Union Territories** | **35** | Complete national coverage |
| **Districts** | **767** | Standardized canonical districts |

> [!IMPORTANT]
> **Preservation of Missing Periods**:  
> The block-series pipeline **deliberately preserves missing observations** rather than fabricating groundwater depth values through naive temporal interpolation. If a monitoring quarter had no observed well readings in a block, the record remains naturally sparse. The downstream feature engineering pipeline handles missingness via explicit missing-data indicators and duration counters (`periods_since_last_obs`).

---

## 3. Supabase Production Database

All processed datasets are loaded into the shared project database. **Do NOT create a new database.** The backend team should connect directly to this instance.

- **Supabase Project Reference**: `zkowsgnklqnulzyszzpy`
- **Host URL**: `https://zkowsgnklqnulzyszzpy.supabase.co`

### Existing Production Tables (`public` Schema)

| Table Name | Row Count | Primary Key | Description & Contents |
| :--- | :---: | :---: | :--- |
| `wells` | **37,866** | `well_id` | Well registry: `state`, `district`, `block`, `village`, `latitude`, `longitude`. **Geographic source of truth for well pins on the map.** |
| `readings` | **1,599,271** | `id` | Historical well readings: `well_id`, `reading_date`, `season`, `depth_mbgl` (meters below ground level). |
| `block_series` | **537,611** | `id` | Chronological block-level aggregates: `state`, `district`, `block`, `period`, `season`, `avg_dtwl`, `n_wells`, `rainfall_mm`. |
| `forecasts` | **21,620** | `id` | Approved 1-year groundwater forecasts (4 quarters ahead): `target_period`, `pred_dtwl`, `lower`, `upper`, `model_version`. |
| `risk_zones` | **5,405** | `id` | Approved groundwater risk classifications: `state`, `district`, `block`, `risk_level` (`safe`/`watch`/`critical`), `trend_m_per_year`, `current_dtwl`, `low_data`, `updated_at`. |

---

## 4. Geographic Data & Map Representation

1. **Well-Level Point Locations**:
   - The `wells` table contains exact `latitude` and `longitude` coordinates for all **37,866** wells.
   - The backend/frontend should query `wells` to render individual monitoring well markers on interactive maps.

2. **Block-Level Risk Heatmap / Choropleth**:
   - The `risk_zones` table contains block-level classifications. It does **not** store individual well coordinates.
   - Recommended administrative navigation hierarchy for dashboards:
     $$\text{India} \longrightarrow \text{State} \longrightarrow \text{District} \longrightarrow \text{Block} \longrightarrow \text{Risk Level}$$
   - Risk categories:
     - **`safe`** (Low risk / stable / recharging)
     - **`watch`** (Moderate stress / emerging overdraft / noisy baseline)
     - **`critical`** (Sustained depletion / chronic overdraft)
   - *Note on Polygons*: The database currently stores administrative names (`state`, `district`, `block`). GeoJSON polygon boundaries for administrative blocks are not stored in Supabase and should be loaded in the frontend or backend via standard Indian administrative GeoJSON/TopoJSON boundary files matching these names.

---

## 5. Machine Learning Forecasting Strategy

Groundwater table depth (Depth to Water Level, DTWL in meters below ground level) is projected across a 4-quarter forward horizon ($H_1, H_2, H_3, H_4$).

### Model Architecture
- **Primary Model**: `xgboost_groundwater_baseline.json` (Optimized Gradient Boosted Decision Trees)
- **Fallback / Robust Model**: `xgboost_groundwater_robust.json` (Trained with higher regularization for shorter time series)

### Dynamic Model Routing
Model selection is routed strictly by the block's historical observation depth:
- **$\ge 20$ historical periods available**: Primary model (`xgboost_groundwater_baseline.json`).
- **$3\text{–}19$ historical periods**: Fallback model (`xgboost_groundwater_robust.json`).
- **$\le 2$ historical periods**: Insufficient historical baseline; forecast is intentionally suppressed to prevent spurious outputs.

### Model Evaluation Metrics (Temporal Holdout)
Evaluated strictly on chronological out-of-time splits:

| Evaluation Split | Model & Benchmark | MAE (meters) | RMSE (meters) | $R^2$ Score | Baseline Improvement |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Validation Period** *(2022–2023)* | **Primary XGBoost** | **1.3349 m** | **2.6770 m** | **0.9037** | **18.46% lower MAE** vs matched seasonal persistence |
| **Final Test Period** *(2024–2026)* | **Primary XGBoost** | **1.8450 m** | **3.9433 m** | **0.8303** | **26.74% lower MAE** vs matched test baseline |

*(Results are from the project's defined temporal evaluation protocol).*

---

## 6. Temporal Split Protocol

To eliminate temporal lookahead bias and simulate real-world prospective deployment, all data splits adhere to a strict chronological boundary:

- **Training Set**: Chronological observations **$\le 2021$**
- **Validation Set**: Observations from **2022 to 2023** (hyperparameter tuning, model routing)
- **Final Holdout Test Set**: Observations from **2024 to 2026** (prospective performance validation)

No future observations or leakage contaminated earlier training cycles.

---

## 7. Feature Engineering Summary

Feature sets were generated from chronological `block_series` observations:

1. **Autoregressive Lags**: Lagged DTWL at $t-1, t-2, t-3, t-4$ quarters.
2. **Missingness & Continuity**: Boolean indicators for missing historical quarters and integer counters for `periods_since_last_obs`.
3. **Anchor Levels**: Latest observed DTWL and historical same-season water level (inter-annual seasonal baseline).
4. **Rolling Aggregations**: 4-quarter and 8-quarter backward rolling means and standard deviations.
5. **Empirical Trends**: Decadal linear trend slopes ($\text{m/year}$) and recent 4-year acceleration slopes.
6. **Period & Season Encodings**: Cyclical sine/cosine encodings of monitoring months and one-hot season vectors.
7. **Spatial & Density Context**: Well centroid coordinates (`latitude`, `longitude`) and active monitoring well count (`n_wells`).
8. **Data Confidence**: Cumulative observation counts per block (`history_count`).

The automated leak audit verified that all rolling and lag features use strictly backward-looking chronological windows.

---

## 8. Forecast Artifacts

- **Primary Production Dataset**: `data/processed/forecasts_approved.csv`  
  Contains the **21,620 approved forecast rows** (5,405 blocks $\times$ 4 forward horizons) that have been loaded into the Supabase `forecasts` table.
- **Development & Audit Files**: Files such as `forecast_candidates.csv`, `forecasts_excluded.csv`, `forecasts_to_insert.csv`, and `xgboost_validation_predictions.csv` are intermediate training and validation audit artifacts retained for documentation.

---

## 9. Groundwater Risk Engine Methodology

The risk engine classifies blocks into operational monitoring tiers using a multi-criteria evidence scoring framework:

### Scoring Dimensions
1. **Long-Term Decadal Trend ($S_{\text{LT}}$)**: Linear slope over available history.
2. **Recent 4-Year Trend Acceleration ($S_{\text{REC}}$)**: Velocity of water table movement over the past 16 quarters.
3. **Forecast Trajectory ($S_{\text{FC}}$)**: Projected 1-year net change from $H_4$ predictions.
4. **Peak Seasonal Drawdown ($S_{\text{peak}}$)**: Maximum projected intra-annual depression.
5. **Contextual Depth Vulnerability ($S_{\text{depth}}$)**: Absolute DTWL ($>20\text{ m}$ / $>40\text{ m}$) amplifying stress **only when active depletion is confirmed**.
6. **Data Baseline Confidence**: Gating applied when historical observations $<20$.

### Hydrological Sign Convention
- **Positive Trend ($> 0\text{ m/year}$)**: Deepening water table $\longrightarrow$ **Groundwater Depletion / Deterioration**.
- **Negative Trend ($< 0\text{ m/year}$)**: Rising / shallowing water table $\longrightarrow$ **Recharge / Recovery**.

### Baseline Risk Distribution (5,405 Eligible Blocks)
- **SAFE**: **3,267 blocks** ($60.44\%$)
- **WATCH**: **1,710 blocks** ($31.64\%$)
- **CRITICAL**: **428 blocks** ($7.92\%$)

*Note on Excluded Blocks*: 682 blocks with insufficient historical records and 145 blocks excluded by data quality audit rules were intentionally **not** assigned a production risk classification and were **not** inserted into `risk_zones`.

---

## 10. Risk Sensitivity & Robustness Audit

To evaluate classification stability against threshold perturbations, the engine underwent a rigorous sensitivity audit across a canonical suite of **10 stress-test scenarios**:

1. **Scenario B**: Aggressive Critical Boundary ($\text{SAFE} \le 2, \text{WATCH } 3\text{–}4, \text{CRITICAL} \ge 5$)
2. **Scenario C**: Lenient Safe Boundary ($\text{SAFE} \le 3, \text{WATCH } 4\text{–}5, \text{CRITICAL} \ge 6$)
3. **Scenario D**: Conservative Critical Boundary ($\text{SAFE} \le 2, \text{WATCH } 3\text{–}6, \text{CRITICAL} \ge 7$)
4. **Trend 0.20**: Long-term trend overdraft boundary relaxed from $0.25$ to $0.20\text{ m/yr}$ ($-0.05\text{ m/yr}$)
5. **Trend 0.30**: Long-term trend overdraft boundary tightened from $0.25$ to $0.30\text{ m/yr}$ ($+0.05\text{ m/yr}$)
6. **Trend 0.60**: Severe overdraft boundary tightened from $0.50$ to $0.60\text{ m/yr}$ ($+0.10\text{ m/yr}$)
7. **FC $+0.25\text{ m}$**: Forecast trajectory boundary tightened by $+0.25\text{ m}$
8. **FC $-0.25\text{ m}$**: Forecast trajectory boundary relaxed by $-0.25\text{ m}$
9. **Depth $15/35\text{ m}$**: Contextual depth thresholds relaxed by $-5\text{ m}$
10. **Depth $25/45\text{ m}$**: Contextual depth thresholds tightened by $+5\text{ m}$

### Audit Results

| Metric | Result Across All 10 Scenarios | Result Under Physical Perturbations (Trend, FC, Depth) |
| :--- | :---: | :---: |
| **ROBUST Blocks** (Zero classification change) | **3,970 (73.45%)** | **4,574 (84.63%)** |
| **BORDERLINE Blocks** (Changed in 1 scenario) | **993 (18.37%)** | **802 (14.84%)** |
| **HIGHLY SENSITIVE Blocks** (Changed in $\ge 2$ scenarios) | **442 (8.18%)** | **29 (0.54%)** |
| **CRITICAL Blocks Retained as CRITICAL** | **305 / 428 (71.26%)** *(123 score=6 dropped only in Scen D)* | **386 / 428 (90.19%)** |
| **CRITICAL Blocks Falling to SAFE** | **0 (0.00%)** | **0 (0.00%)** |
| **SAFE Blocks Jumping to CRITICAL** | **0 (0.00%)** | **0 (0.00%)** |

> [!IMPORTANT]
> **Project Standard Disclaimer on Risk Classifications**:  
> *"Robust enough to proceed to production integration, with thresholds treated as engineered decision rules rather than scientifically validated ground-truth labels."*

---

## 11. Production Risk Database Insertion Report

The approved risk classifications from `data/processed/risk_candidates.csv` were bulk-ingested into Supabase table `public.risk_zones`:

- **Source File**: `data/processed/risk_candidates.csv`
- **Target Table**: `public.risk_zones`
- **Rows Attempted**: **5,405**
- **Rows Successfully Inserted**: **5,405**
- **Batches Used**: 6 (5 batches $\times$ 1,000 rows + 1 batch $\times$ 405 rows)
- **Batch Failures / Retries**: **0**

### Final Verified Distribution in Supabase
- **`safe`**: **3,267 rows** (100% agreement with approved audit)
- **`watch`**: **1,710 rows** (100% agreement with approved audit)
- **`critical`**: **428 rows** (100% agreement with approved audit)
- **Total**: **5,405 rows**

### Post-Insertion Integrity Invariants
- Duplicate `(state, district, block)` tuples: **0**
- Null values across required fields: **0**
- Excluded / insufficient-data blocks inserted: **0**
- CSV $\leftrightarrow$ Database classification mismatches: **0**
- 1:1 administrative key correspondence: **5,405 / 5,405 (100%)**
- Upstream tables remained completely unmodified (`wells`: 37,866, `readings`: 1,599,271, `block_series`: 537,611, `forecasts`: 21,620).

---

## 12. Handoff File Structure

The validated assets available in this handoff package:

```
jaldrishti_ML/
│
├── data/
│   └── processed/
│       ├── wells.csv                               # Cleaned well registry with lat/long (37,866 rows)
│       ├── readings.csv                            # Historical groundwater level readings (1,599,271 rows)
│       ├── block_series.csv                        # Chronological quarterly block aggregates (537,611 rows)
│       ├── forecasts_approved.csv                  # Approved quarterly forecasts (21,620 rows)
│       └── risk_candidates.csv                     # Approved risk classifications (5,405 rows)
│
├── models/
│   ├── xgboost_groundwater_baseline.json           # Primary XGBoost model (for series >= 20 periods)
│   └── xgboost_groundwater_robust.json             # Robust fallback XGBoost model (for series 3-19 periods)
│
├── reports/
│   ├── forecast_generation_report.json             # Forecast model training & evaluation report
│   ├── forecast_production_insertion_report.json   # Database insertion audit for forecasts table
│   ├── forecast_production_insertion_report.csv    # Tabular forecast insertion run metrics
│   ├── guardrails_audit_report.json                # Scientific guardrail validation log
│   ├── risk_engine_audit.json                      # Comprehensive risk classification audit log
│   ├── risk_sensitivity_audit.json                 # 10-scenario perturbation & robustness analysis
│   ├── risk_sensitivity_summary.csv                # Scenario transition & sanity check matrix
│   ├── risk_zones_production_insertion_report.json # Database insertion audit for risk_zones table
│   ├── xgboost_experiment_01.json                  # Baseline experiment run log
│   └── xgboost_experiment_02.json                  # Regularized robust experiment run log
│
└── README.md                                       # This engineering handoff document
```

---

## 13. Excluded Assets

The following files are intentionally excluded from this handoff package:
- Raw CGWB source dumps (multi-gigabyte unstructured downloads).
- Python virtual environments (`.venv`, `env`).
- Version control internals (`.git`).
- Local environment files (`.env`).
- Temporary debugging scripts and intermediate prediction scratchpads.

The complete development repository and training pipeline are archived separately by the ML engineering team.

---

## 14. Security & Environment Configuration

> [!WARNING]
> **Zero Secrets in Code**:  
> No Supabase service-role keys or private administrative credentials are included in this codebase or documentation.

- Backend services must supply Supabase connection credentials via environment variables:
  ```env
  SUPABASE_URL=https://zkowsgnklqnulzyszzpy.supabase.co
  SUPABASE_ANON_KEY=<your-anon-key>
  SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key-kept-in-secure-vault>
  ```
- **Row Level Security (RLS) Notice**:  
  RLS is currently **disabled** on `wells`, `readings`, `block_series`, `forecasts`, and `risk_zones` to support high-throughput bulk loading during development.  
  **The backend team must review and enable RLS with appropriate access policies before making the API or database publicly accessible.**

---

## 15. Backend Integration Guidance

The backend team should build API services that query the existing Supabase instance directly.

### Recommended (Suggested) REST Endpoint Design

```http
# Wells & Spatial Points
GET /api/wells?district=Gurdaspur&limit=50
Response: Array of wells with well_id, village, latitude, longitude

# Block Time-Series History
GET /api/groundwater/history?state=Punjab&district=Patiala&block=Nabha
Response: Quarterly avg_dtwl, n_wells, period (chronological array)

# Block Forecasts (Next 4 Quarters)
GET /api/forecasts?state=Punjab&district=Patiala&block=Nabha
Response: 4 horizons with target_period, pred_dtwl, lower, upper, model_version

# Risk Classifications
GET /api/risk-zones?state=Punjab
Response: Blocks with risk_level (safe/watch/critical), trend_m_per_year, current_dtwl

GET /api/risk-zones?risk_level=critical
Response: Filtered list of all critical overdraft blocks across India
```

*(These endpoints represent a suggested API structure to consume existing database tables).*

---

## 16. Frontend Map Integration Guidance

1. **Well Layer (Scatterplot / Clustering)**:
   - Source: `public.wells` table (`latitude`, `longitude`).
   - Query points within the current map bounding box using PostgREST spatial filters or lat/long ranges.
   - Ideal for clustering libraries (Supercluster, Leaflet.markercluster, Mapbox GL cluster).

2. **Risk Layer (Choropleth / District Rollup)**:
   - Source: `public.risk_zones` table (`state`, `district`, `block`, `risk_level`).
   - Match `state`, `district`, and `block` names against standard GeoJSON boundaries.
   - Recommended palette:
     - **`safe`**: Emerald Green (`#10B981`)
     - **`watch`**: Amber Yellow (`#F59E0B`)
     - **`critical`**: Crimson Red (`#EF4444`)

---

## 17. Important Project Limitations

To maintain scientific and operational honesty, engineers must be aware of the following known limitations:

1. **Engineered Decision Rules**: Risk tiers (`safe`, `watch`, `critical`) are **engineered decision boundaries**, not scientifically validated ground-truth labels. They are designed for administrative prioritization, not legal determinations.
2. **Rainfall Feature**: The `rainfall_mm` field in `block_series` is currently **NULL** across historical periods. Do not fabricate or impute rainfall values. If IMD rainfall gridded data is integrated in future phases, this column can be populated.
3. **Irrigation Advisory**: Irrigation scheduling and crop water recommendations constitute a separate downstream application layer. They are not part of this core groundwater forecasting and risk engine pipeline.
4. **Backend & Frontend Separation**: API development and dashboard interfaces are handled independently by their respective engineering teams.

---

## 18. Final Engineering Status

| Workstream | Status | Responsible Team |
| :--- | :---: | :--- |
| **Data Ingestion & Cleaning** | **COMPLETE** | ML / Data Team |
| **Geographic Canonicalization** | **COMPLETE** | ML / Data Team |
| **Supabase Data Ingestion** | **COMPLETE** | ML / Data Team |
| **Block-Level Aggregation** | **COMPLETE** | ML / Data Team |
| **Feature Engineering** | **COMPLETE** | ML / Data Team |
| **ML Model Training & Selection** | **COMPLETE** | ML / Data Team |
| **Forecast Validation & Guardrails** | **COMPLETE** | ML / Data Team |
| **Risk Classification Engine** | **COMPLETE** | ML / Data Team |
| **Risk Sensitivity & Robustness Audit** | **COMPLETE** | ML / Data Team |
| **Risk-Zone Production Database Loading** | **COMPLETE** | ML / Data Team |
| **Backend REST / GraphQL API** | *NEXT WORKSTREAM* | Backend Engineering |
| **Frontend Map & Analytics Dashboard** | *NEXT WORKSTREAM* | Frontend Engineering |
| **Irrigation Advisory Application Layer** | *FUTURE PHASE* | Product / Agronomy Team |
| **Supabase RLS Policy Hardening** | *PENDING AUDIT* | Backend / Security Team |

---

*The ML/data pipeline for JalDrishti is complete and has been integrated into the existing Supabase production dataset. The backend and frontend teams can now consume the verified outputs without rebuilding the ML pipeline.*
