# JalDrishti Backend Integration Specification
**ML Package Inspection & Architecture Handoff Guide**

---

## 1. Executive Summary

This document provides the verified technical specification for integrating the **JalDrishti Machine Learning Package** (`ml_package/`) into the **FastAPI Backend**.

The ML and data engineering pipeline is **100% complete**. All raw Central Ground Water Board (CGWB) observations (1.6M raw rows across 1994–2026) have been cleansed, validated, aggregated into block-level time series, modeled via regularized XGBoost regressors, audited against hydrological guardrails, scored through a multi-criteria risk engine, and exported as verified production artifacts.

---

## 2. Dataset Inventory (`ml_package/data/processed/`)

| File Name | File Size | Row Count | Primary Key / Unit | Null / Missing Fields | Unique Coverage | Description & Primary Use Case |
| :--- | :---: | :---: | :--- | :--- | :--- | :--- |
| **`wells.csv`** | 2.67 MB | **37,866** | `well_id` | **0** missing across all columns | **35** States/UTs<br>**764** Districts<br>**5,939** Blocks | Deduplicated geospatial well registry (`latitude`, `longitude`, `village`). **Source of truth for interactive map pins and station telemetry.** |
| **`readings.csv`** | 116.13 MB | **1,599,271** | Synthetic (`well_id` + `reading_date`) | **0** missing across all columns | **37,866** Wells<br>Date range: `1994-01-01` to `2026-01-10` | Historical point observations of groundwater table depth (`depth_mbgl`). Used for granular well-level historical time series. |
| **`block_series.csv`** | 32.49 MB | **537,611** | Composite (`state`, `district`, `block`, `period`) | `rainfall_mm`: **537,611 (100% NULL)**<br>All other columns: **0** missing | **35** States/UTs<br>**764** Districts<br>**5,939** Blocks<br>Period range: `1994-01-01` to `2026-01-01` | Quarterly block-level aggregate series (`avg_dtwl`, `n_wells`, `season`). **Primary source for block historical charts and live feature extraction.** |
| **`forecasts_approved.csv`** | 5.44 MB | **21,620** | Composite (`state`, `district`, `block`, `horizon_step`) | `seasonal_persistence_ref`: 187<br>All other columns: **0** missing | **5,405** Blocks<br>4 Horizons ($H_1\text{–}H_4$)<br>20 unique target periods (`2022-05-01` to `2027-01-01`) | Approved 4-quarter forward groundwater predictions (`pred_dtwl`, `lower`, `upper`, `model_used`). **Directly powers frontend forecast charts.** |
| **`risk_candidates.csv`** | 1.07 MB | **5,405** | Composite (`state`, `district`, `block`) | **0** missing across all columns | **33** States/UTs<br>**5,174** unique block names (5,405 unique tuples)<br>SAFE: 3,267 (60.4%)<br>WATCH: 1,710 (31.6%)<br>CRITICAL: 428 (7.9%) | CGWB-aligned risk assessment classifications, evidence scores (-3 to 13), trend metrics, and audit explanations. **Directly powers risk dashboards and heatmaps.** |

---

## 3. Model Inventory (`ml_package/models/`)

Two trained, production-validated XGBoost models are provided in native JSON format:

| Property | Primary Baseline Model | Fallback Robust Model |
| :--- | :--- | :--- |
| **Artifact Path** | `ml_package/models/xgboost_groundwater_baseline.json` | `ml_package/models/xgboost_groundwater_robust.json` |
| **File Size** | 2.81 MB | 3.56 MB |
| **Format** | Native XGBoost JSON (`format="json"`) | Native XGBoost JSON (`format="json"`) |
| **Serialization Version** | `[3, 4, 1]` | `[3, 4, 1]` |
| **Estimator Type** | `XGBRegressor` (`regressor`, `num_target: 1`) | `XGBRegressor` (`regressor`, `num_target: 1`) |
| **Loss Objective** | `reg:squarederror` | `reg:absoluteerror` (MAE loss) |
| **Tree Method** | `hist` | `hist` |
| **Tree Count** | 500 trees (`num_trees: 500`, `best_iteration: 499`) | 500 trees (`num_trees: 500`, `best_iteration: 499`) |
| **Max Tree Depth** | 6 | 6 |
| **Learning Rate** | 0.03 | 0.03 |
| **Subsample / Colsample** | `0.8` / `0.8` | `0.8` / `0.8` |
| **Regularization** | `reg_alpha: 0.1`, `reg_lambda: 1.0` | `reg_alpha: 0.1`, `reg_lambda: 1.0` |
| **Feature Count** | 30 | 30 |
| **Base Score** | 7.033973 m | 6.039666 m |
| **Evaluation Performance** | Validation MAE: 1.33 m, RMSE: 2.68 m, $R^2$: 0.90<br>Holdout Test MAE: 1.85 m, RMSE: 3.94 m, $R^2$: 0.83 | Validation MAE: 1.33 m, RMSE: 2.75 m, $R^2$: 0.90<br>Better resistance to outliers on sparse series |
| **Routing Criteria** | Blocks with **$\ge 20$ historical quarters** | Blocks with **$3\text{–}19$ historical quarters** |

> **Note on Blocks with $< 3$ observations**: Forecasts are strictly suppressed to avoid spurious predictions.

---

## 4. Exact Model Feature Specification

Both models require an identical **30-feature numerical matrix of shape `(N, 30)`** in this exact order:

| Index | Feature Name | Dtype | Category | Description & Range |
| :---: | :--- | :---: | :--- | :--- |
| **0** | `lag_1` | `float` | Autoregressive Lag | Groundwater depth (DTWL) at quarter $t-1$ (mbgl) |
| **1** | `lag_2` | `float` | Autoregressive Lag | Groundwater depth (DTWL) at quarter $t-2$ (mbgl) |
| **2** | `lag_4` | `float` | Autoregressive Lag | Groundwater depth (DTWL) at quarter $t-4$ (1 year prior, mbgl) |
| **3** | `lag_8` | `float` | Autoregressive Lag | Groundwater depth (DTWL) at quarter $t-8$ (2 years prior, mbgl) |
| **4** | `is_missing_lag_1` | `int` | Missingness Flag | `1` if $t-1$ reading is missing; else `0` |
| **5** | `is_missing_lag_2` | `int` | Missingness Flag | `1` if $t-2$ reading is missing; else `0` |
| **6** | `is_missing_lag_4` | `int` | Missingness Flag | `1` if $t-4$ reading is missing; else `0` |
| **7** | `is_missing_lag_8` | `int` | Missingness Flag | `1` if $t-8$ reading is missing; else `0` |
| **8** | `last_observed_dtwl` | `float` | Anchor Level | Most recent valid DTWL observation in the series (mbgl) |
| **9** | `periods_since_last_observation` | `float` | Missingness Counter | Number of quarters elapsed since the last observation |
| **10** | `last_same_season_dtwl` | `float` | Seasonal Anchor | Most recent observed DTWL for the same seasonal quarter |
| **11** | `rolling_mean_4` | `float` | Rolling Stat | Backward 4-quarter moving average of DTWL |
| **12** | `rolling_mean_8` | `float` | Rolling Stat | Backward 8-quarter moving average of DTWL |
| **13** | `rolling_mean_12` | `float` | Rolling Stat | Backward 12-quarter moving average of DTWL |
| **14** | `rolling_std_4` | `float` | Rolling Stat | Backward 4-quarter standard deviation of DTWL |
| **15** | `rolling_std_8` | `float` | Rolling Stat | Backward 8-quarter standard deviation of DTWL |
| **16** | `rolling_std_12` | `float` | Rolling Stat | Backward 12-quarter standard deviation of DTWL |
| **17** | `slope_8` | `float` | Empirical Trend | Linear trajectory slope over prior 8 quarters (m/quarter) |
| **18** | `slope_12` | `float` | Empirical Trend | Linear trajectory slope over prior 12 quarters (m/quarter) |
| **19** | `sin_season` | `float` | Cyclical Season | Trigonometric sine encoding of target seasonal period |
| **20** | `cos_season` | `float` | Cyclical Season | Trigonometric cosine encoding of target seasonal period |
| **21** | `season_august` | `float` | One-Hot Season | `1.0` if target season is August (Monsoon); else `0.0` |
| **22** | `season_january` | `float` | One-Hot Season | `1.0` if target season is January (Winter); else `0.0` |
| **23** | `season_post_monsoon` | `float` | One-Hot Season | `1.0` if target season is Post-monsoon (Nov); else `0.0` |
| **24** | `season_pre_monsoon` | `float` | One-Hot Season | `1.0` if target season is Pre-monsoon (May); else `0.0` |
| **25** | `latitude` | `float` | Spatial Coordinate | Centroid latitude of block observation wells |
| **26** | `longitude` | `float` | Spatial Coordinate | Centroid longitude of block observation wells |
| **27** | `n_wells` | `int` | Monitoring Density | Number of active monitoring observation wells in block |
| **28** | `history_count` | `int` | Sample Reliability | Total historical quarterly observations available for block |
| **29** | `eligible_for_ml` | `int` | Eligibility Flag | `1` if block meets minimum threshold ($\ge 3$); else `0` |

### Preprocessing & Scaling Rules
* **No Scalers**: Features are fed in unscaled physical units.
* **Missing Value Routing**: Missing values in continuous lag features can be left as `np.nan`—XGBoost automatically routes them via learned default branch directions.

---

## 5. Forecast Artifact Specification (`forecasts_approved.csv`)

* **Coverage**: Exactly 5,405 blocks $\times$ 4 horizons = **21,620 rows**.
* **Key Columns**:
  * `state`, `district`, `block`: Composite administrative key.
  * `target_period`: Target quarter date (e.g. `2025-08-01`, `2025-11-01`, `2026-01-01`, `2026-05-01`).
  * `season`: `august`, `post_monsoon`, `january`, `pre_monsoon`.
  * `horizon_step`: Integer `1`, `2`, `3`, `4`.
  * `is_recursive`: `False` for $H_1$, `True` for $H_2, H_3, H_4$.
  * `pred_dtwl`: Projected depth to water level (meters below ground level).
  * `lower`: Lower bound of the calibrated prediction interval (mbgl).
  * `upper`: Upper bound of the calibrated prediction interval (mbgl).
  * `model_used`: `xgboost_primary_exp01` (20,036 rows) or `xgboost_fallback_robust_exp02` (1,584 rows).
  * `history_count`, `low_data`, `latest_observed_dtwl`, `historical_mean_dtwl`: Historical context.
* **Frontend Readiness**: **100% Ready**. Can directly power quarterly and 12-month projection charts without runtime model inference.

---

## 6. Risk Artifact Specification (`risk_candidates.csv`)

* **Coverage**: Exactly **5,405 blocks**.
* **Key Columns**:
  * `state`, `district`, `block`: Administrative key.
  * `current_dtwl`: Latest observed water table depth (mbgl).
  * `trend_m_per_year`: Decadal linear trend rate ($\text{m/year}$, negative denotes deepening/depletion).
  * `recent_trend`: Recent 4-year acceleration rate ($\text{m/year}$).
  * `forecast_h1`, `forecast_h2`, `forecast_h3`, `forecast_h4`: Summary quarterly forecasted levels.
  * `forecast_change`: Net projected 1-year change ($H_4 - \text{current_dtwl}$).
  * `forecast_uncertainty`: Uncertainty spread at $H_4$ (`upper - lower`).
  * `history_count`: Number of historical quarters observed.
  * `low_data`: Flag indicating sparse historical data.
  * `risk_level`: Final categorical classification:
    * **`SAFE`** (3,267 blocks / 60.4%): Stable or recharging aquifer head.
    * **`WATCH`** (1,710 blocks / 31.6%): Moderate stress or emerging overdraft.
    * **`CRITICAL`** (428 blocks / 7.9%): Chronic overdraft, deep water table, or rapid depletion.
  * `risk_score`: Quantitative evidence score (range: -3 to 13).
  * `risk_reason`: Human-readable justification string explaining the classification drivers.
* **Frontend Readiness**: **100% Ready**. Powers national risk statistics, choropleth heatmaps, and block risk badges directly.

---

## 7. Recommended Backend Data Flow & Serving Architecture

```
                    ┌──────────────────────────────────────────────┐
                    │               Client Frontend                │
                    │        (React / Mapbox / Chart.js)           │
                    └──────┬──────────────┬──────────────┬─────────┘
                           │              │              │
                   /api/states    /api/forecasts   /api/simulate
                           │              │              │
                    ┌──────▼──────────────▼──────────────▼─────────┐
                    │            FastAPI Backend Layer             │
                    │  (services/ model_service, risk_service, ..) │
                    └──────┬──────────────┬──────────────┬─────────┘
                           │              │              │
             ┌─────────────▼──────┐       │       ┌──────▼─────────────┐
             │ Pre-computed Cache │       │       │ Runtime Engine     │
             │   (Data Service)   │       │       │ (XGBoost / Rules)  │
             └─────────────┬──────┘       │       └──────┬─────────────┘
                           │              │              │
        ┌──────────────────┴──────────────┼──────────────┴──────────────────┐
        │                                 │                                 │
┌───────▼───────────┐           ┌─────────▼─────────┐             ┌─────────▼─────────┐
│ wells.csv         │           │ forecasts_        │             │ baseline & robust │
│ block_series.csv  │           │   approved.csv    │             │   models (.json)  │
│ risk_candidates   │           │ readings.csv      │             │                   │
└───────────────────┘           └───────────────────┘             └───────────────────┘
```

---

## 8. Endpoint Allocation: Direct Serving vs. Computed Data

### A. Data to Serve DIRECTLY (Fast Lookup from Processed CSVs / DB)

| Frontend View / Need | Recommended Source File | Query Mechanism | Performance Target |
| :--- | :--- | :--- | :--- |
| **State / District / Block Hierarchy** | `wells.csv` / `risk_candidates.csv` | In-memory nested dictionary of `{State: {District: [Blocks]}}` | $< 5\text{ ms}$ |
| **National Summary KPIs** | `risk_candidates.csv` | Pre-aggregated totals: Total blocks (5,405), Safe (3,267), Watch (1,710), Critical (428) | $< 2\text{ ms}$ |
| **Well Points on Map** | `wells.csv` | Filtered by `state`, `district`, or bounding box (`lat_min`, `lat_max`, `lon_min`, `lon_max`) | $< 50\text{ ms}$ |
| **Historical Groundwater Chart** | `block_series.csv` | Filtered by `state`, `district`, `block`; chronological sorted array of `(period, season, avg_dtwl)` | $< 20\text{ ms}$ |
| **Approved Forecast Chart (H1–H4)** | `forecasts_approved.csv` | Filtered by `(state, district, block)`; returns 4 quarterly predictions with `lower`/`upper` | $< 10\text{ ms}$ |
| **Risk Status & Explanation** | `risk_candidates.csv` | Filtered by `(state, district, block)`; returns `risk_level`, `risk_score`, `risk_reason`, trends | $< 5\text{ ms}$ |

### B. Data Requiring RUNTIME COMPUTATION

| Feature / Scenario | Required Computation | Engine / Service |
| :--- | :--- | :--- |
| **Custom / What-If Groundwater Prediction** | Feature vector construction (30 features from `block_series.csv`) $\rightarrow$ Model selection ($\ge 20$ vs $3\text{–}19$) $\rightarrow$ `booster.predict(dmatrix)` | `model_service.py` / `forecast_service.py` |
| **Scenario / Rainfall / Extraction Simulation** | Perturbation calculation: Given $\Delta\text{Rainfall}\%$ and $\Delta\text{Pumping}\%$, compute delta DTWL shift against the baseline forecast | `simulator_service.py` |
| **Agronomic & Policy Advisory Generation** | Rule engine evaluating `risk_level` + `current_dtwl` + `trend_m_per_year` $\rightarrow$ targeted crop substitution, micro-irrigation, and recharge structures | `advisor_service.py` |

---

## 9. Recommended REST API Endpoints

```http
# 1. Administrative Hierarchy & Search
GET /api/states
GET /api/districts?state={state}
GET /api/blocks?state={state}&district={district}

# 2. National & Regional Summary KPIs
GET /api/stats/national
Response: { totalBlocks: 5405, safe: 3267, watch: 1710, critical: 428, avgDepth: 12.4 }

# 3. Geospatial Well Markers
GET /api/wells?state={state}&district={district}&block={block}
GET /api/wells/bbox?min_lat={min}&max_lat={max}&min_lon={min}&max_lon={max}

# 4. Historical Depth Series
GET /api/history?state={state}&district={district}&block={block}
Response: [ { period: "2020-05-01", season: "pre_monsoon", avg_dtwl: 14.2, n_wells: 4 } ... ]

# 5. Groundwater Forecasts
GET /api/forecast?state={state}&district={district}&block={block}
Response: [ { horizon: 1, period: "2025-08-01", season: "august", pred_dtwl: 12.1, lower: 10.4, upper: 13.8 } ... ]

# 6. Risk Scoring & Vulnerability
GET /api/risk?state={state}&district={district}&block={block}
Response: { risk_level: "CRITICAL", risk_score: 8, current_dtwl: 28.4, trend_m_per_year: -0.85, reason: "..." }

# 7. Scenario Simulation Engine
GET /api/simulate?state={state}&district={district}&block={block}&rainfall_pct=0&extraction_pct=-20
Response: { baseline_dtwl: 28.4, simulated_dtwl: 26.9, change_m: +1.5, outcome: "Water table recovery" }

# 8. Actionable Advisory
GET /api/advisor?state={state}&district={district}&block={block}
Response: { recommendations: [ ... ], priority_crops: [ ... ], recharge_interventions: [ ... ] }
```

---

## 10. Unresolved Issues & Critical Hydrological Facts

1. **`rainfall_mm` is 100% NULL**:
   * The column `rainfall_mm` in `block_series.csv` has zero historical entries across all 537,611 rows.
   * **Guidance**: Do NOT impute fake rainfall into `block_series.csv`. Simulations involving rainfall must treat rainfall adjustments as delta modifiers against long-term baseline behavior.
2. **Administrative Boundary Polygons**:
   * The ML package provides point centroids (`latitude`, `longitude`) in `wells.csv`. Block GeoJSON boundary polygons are not in this package and should be loaded via standard Indian administrative GeoJSON boundary layers.
3. **Difference between Well Count and Block Count**:
   * `wells.csv` covers 5,939 blocks; `risk_candidates.csv` and `forecasts_approved.csv` cover **5,405 approved blocks**. The remaining 534 blocks had $<3$ historical periods and were intentionally excluded from forecasts by the ML guardrails audit.
4. **Sign Convention of Depth to Water Level (DTWL)**:
   * DTWL measures **depth below surface** in meters (`mbgl`).
   * A **larger positive number** means a **deeper, more depleted water table**.
   * A **negative trend** ($\text{m/year} < 0$) in `trend_m_per_year` indicates water table drop (depletion).

---

## 11. Assumptions That Must NOT Be Made

1. **Do NOT assume the models require real-time execution for standard dashboard views**:
   * All 5,405 blocks already have pre-computed 4-quarter forecasts in `forecasts_approved.csv` and pre-scored risk levels in `risk_candidates.csv`.
2. **Do NOT assume standard Scikit-Learn pipelines or Scalers are needed**:
   * There are no `.pkl` transformers. XGBoost runs directly on the 30 raw numerical features.
3. **Do NOT fabricate missing historical quarters**:
   * The ML pipeline deliberately preserved sparse data and handled missing periods via boolean indicators (`is_missing_lag_x`) and `periods_since_last_observation`.
4. **Do NOT retrain or re-serialize the models**:
   * The XGBoost JSON models are complete and calibrated with optimal hyperparameters.
5. **Do NOT invent arbitrary risk thresholds**:
   * Risk categories must strictly follow the audited classifications in `risk_candidates.csv`.
