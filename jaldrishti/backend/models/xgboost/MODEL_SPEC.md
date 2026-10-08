# JalDrishti XGBoost Model Specification

This specification documents the architecture, input schema, feature ordering, and execution requirements for the trained XGBoost groundwater forecasting models discovered in `backend/models/xgboost/jaldrishti_ML.zip`.

---

## 1. Model Artifact Overview

| Property | Primary Baseline Model | Fallback Robust Model |
| :--- | :--- | :--- |
| **Filename** | `xgboost_groundwater_baseline.json` | `xgboost_groundwater_robust.json` |
| **Format** | Native XGBoost JSON (`format="json"`) | Native XGBoost JSON (`format="json"`) |
| **Serialization Schema Version** | `[3, 4, 1]` | `[3, 4, 1]` |
| **Model Class** | `XGBRegressor` (`regressor`) | `XGBRegressor` (`regressor`) |
| **Objective Function** | `reg:squarederror` | `reg:absoluteerror` (MAE loss) |
| **Tree Method** | `hist` | `hist` |
| **Trees (`n_estimators`)** | 500 (best iteration: 499) | 500 (best iteration: 499) |
| **Max Depth** | 6 | 6 |
| **Learning Rate** | 0.03 | 0.03 |
| **Feature Count** | 30 | 30 |
| **Target Count** | 1 (`num_target: 1`) | 1 (`num_target: 1`) |
| **Base Score** | 7.033973 m | 6.039666 m |
| **Target Application Tier** | Blocks with $\ge 20$ historical periods | Blocks with $3\text{–}19$ historical periods |

---

## 2. Target Variable & Prediction Mode

* **Target Variable**: Continuous **Depth to Water Level (DTWL)** in meters below ground level (`mbgl`).
* **Direct Prediction**: The model predicts future water table depth (`avg_dtwl` / `pred_dtwl`) directly for the target forward quarter.
* **Multi-Horizon Strategy**:
  * Forward projections cover 4 quarters ($H_1, H_2, H_3, H_4$).
  * $H_1$ (Horizon step 1) is a direct 1-quarter-ahead prediction from observed historical features (`is_recursive = False`).
  * $H_2, H_3, H_4$ are generated via **recursive multi-step forecasting** (`is_recursive = True`), feeding predicted $t+1$ DTWL back into `lag_1`, updating rolling statistics, and adjusting seasonal features for subsequent target dates.
* **Risk Categorization**:
  * The model does **not** directly output categorical risk or classification probabilities.
  * Groundwater risk levels (`SAFE`, `WATCH`, `CRITICAL`) are derived downstream by the rule-based **Groundwater Risk Engine**, combining current DTWL, multi-year trend slopes, projected 1-year change ($H_4 - \text{current}$), and uncertainty bounds.

---

## 3. Preprocessing, Scalers & Encoders

* **No external transformer or scaler artifacts**: No `.pkl`, `.joblib`, `StandardScaler`, or `OneHotEncoder` files are present or required.
* **Native representation**: XGBoost was trained directly on raw physical values (meters, degrees, integer counts) and binary numerical indicators ($0.0$ / $1.0$ or $0$ / $1$).
* **Missing Value Handling**: Native XGBoost default directional tree splitting handles missing values in lag features (`missing=np.nan`), coupled with explicit missingness indicator features (`is_missing_lag_x`).

---

## 4. Required Feature Schema and Exact Order

The model expects exactly **30 features** in the following strict order:

| Index | Feature Name | Data Type | Feature Category | Description & Semantic Value |
| :---: | :--- | :---: | :--- | :--- |
| **0** | `lag_1` | `float` | Autoregressive Lag | DTWL observed at quarter $t-1$ (mbgl) |
| **1** | `lag_2` | `float` | Autoregressive Lag | DTWL observed at quarter $t-2$ (mbgl) |
| **2** | `lag_4` | `float` | Autoregressive Lag | DTWL observed at quarter $t-4$ (1 year prior, mbgl) |
| **3** | `lag_8` | `float` | Autoregressive Lag | DTWL observed at quarter $t-8$ (2 years prior, mbgl) |
| **4** | `is_missing_lag_1` | `int` | Missingness Flag | `1` if $t-1$ observation was missing; `0` otherwise |
| **5** | `is_missing_lag_2` | `int` | Missingness Flag | `1` if $t-2$ observation was missing; `0` otherwise |
| **6** | `is_missing_lag_4` | `int` | Missingness Flag | `1` if $t-4$ observation was missing; `0` otherwise |
| **7** | `is_missing_lag_8` | `int` | Missingness Flag | `1` if $t-8$ observation was missing; `0` otherwise |
| **8** | `last_observed_dtwl` | `float` | Anchor Level | Most recent valid DTWL observation in the series (mbgl) |
| **9** | `periods_since_last_observation` | `float` | Missingness Counter | Number of quarters elapsed since the last observation |
| **10** | `last_same_season_dtwl` | `float` | Seasonal Anchor | Most recent observed DTWL for the same seasonal quarter |
| **11** | `rolling_mean_4` | `float` | Rolling Aggregation | Backward 4-quarter moving average of DTWL |
| **12** | `rolling_mean_8` | `float` | Rolling Aggregation | Backward 8-quarter moving average of DTWL |
| **13** | `rolling_mean_12` | `float` | Rolling Aggregation | Backward 12-quarter moving average of DTWL |
| **14** | `rolling_std_4` | `float` | Rolling Dispersion | Backward 4-quarter standard deviation of DTWL |
| **15** | `rolling_std_8` | `float` | Rolling Dispersion | Backward 8-quarter standard deviation of DTWL |
| **16** | `rolling_std_12` | `float` | Rolling Dispersion | Backward 12-quarter standard deviation of DTWL |
| **17** | `slope_8` | `float` | Empirical Trend | Linear trajectory slope over prior 8 quarters (m/quarter) |
| **18** | `slope_12` | `float` | Empirical Trend | Linear trajectory slope over prior 12 quarters (m/quarter) |
| **19** | `sin_season` | `float` | Cyclical Season | Trigonometric sine encoding of target seasonal period |
| **20** | `cos_season` | `float` | Cyclical Season | Trigonometric cosine encoding of target seasonal period |
| **21** | `season_august` | `float` | One-Hot Season | `1.0` if target season is August (Monsoon); else `0.0` |
| **22** | `season_january` | `float` | One-Hot Season | `1.0` if target season is January (Winter); else `0.0` |
| **23** | `season_post_monsoon` | `float` | One-Hot Season | `1.0` if target season is Post-monsoon (Nov); else `0.0` |
| **24** | `season_pre_monsoon` | `float` | One-Hot Season | `1.0` if target season is Pre-monsoon (May); else `0.0` |
| **25** | `latitude` | `float` | Spatial Coordinate | Centroid latitude coordinate of the block / wells |
| **26** | `longitude` | `float` | Spatial Coordinate | Centroid longitude coordinate of the block / wells |
| **27** | `n_wells` | `int` | Monitoring Density | Number of active monitoring observation wells in block |
| **28** | `history_count` | `int` | Sample Reliability | Total historical quarterly periods recorded for block |
| **29** | `eligible_for_ml` | `int` | Eligibility Flag | `1` if block meets minimum data threshold ($\ge 3$); else `0` |

---

## 5. Input Data Required for a Single Prediction

To compute a forward groundwater forecast for any administrative block, the inference pipeline requires:

1. **Block Historical Groundwater Observation Series**:
   * Minimum 3 historical quarterly observations (`avg_dtwl` series).
   * Lags at $t-1, t-2, t-4, t-8$ (or imputation indicators if missing).
   * Moving statistics (4, 8, 12 quarter means and standard deviations).
   * Linear slope over past 8 and 12 quarters.
2. **Target Period & Season**:
   * Target quarter (`target_period`, e.g., `2026-06-01` or `2026-08-01`).
   * Season indicator (`january`, `pre_monsoon`, `august`, `post_monsoon`).
   * Cyclical sine/cosine values for the target season.
3. **Spatial & Administrative Context**:
   * Centroid `latitude` and `longitude`.
   * Number of active wells (`n_wells`).
   * Total history depth (`history_count`).

---

## 6. Dynamic Model Routing Strategy

* **Primary Baseline Model (`xgboost_groundwater_baseline.json`)**:
  * Activated when `history_count >= 20`.
  * Optimizes mean squared error (`reg:squarederror`).
  * Validation MAE: **1.33 m**, RMSE: **2.68 m**, $R^2$: **0.90**.
* **Robust Fallback Model (`xgboost_groundwater_robust.json`)**:
  * Activated when `3 <= history_count < 20`.
  * Optimizes median absolute error (`reg:absoluteerror`) to resist outlier distortion on sparse series.
  * Validation MAE: **1.33 m**, RMSE: **2.75 m**, $R^2$: **0.90**.
* **Data Insufficient (`history_count < 3`)**:
  * Prediction suppressed to prevent spurious extrapolations.
