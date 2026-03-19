#!/usr/bin/env python3
"""
Forest Risk Prediction ML Model
================================
Gradient Boosted ensemble trained on scientifically-grounded synthetic data
covering Indian forest zones. Features match what our real APIs provide.

Features used:
  - temp_max        : max forecast temperature (°C)
  - temp_avg        : average forecast temperature (°C)
  - precip_7d       : total precipitation last 7 days (mm)
  - precip_14d      : total precipitation last 14 days (mm)
  - humidity        : relative humidity (%)
  - soil_moisture   : soil moisture (%)
  - soil_ph         : soil pH
  - ndvi            : vegetation index (0-1)
  - ndvi_trend      : NDVI change rate per period
  - tree_age        : age of plantation (years)
  - day_of_year     : seasonal factor

Target: risk_score (0-100), then classified HIGH/MEDIUM/LOW
"""

import json
import sys
import os
import pickle
import numpy as np
import pandas as pd
from pathlib import Path

from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import cross_val_score
from sklearn.metrics import mean_absolute_error, r2_score

MODEL_PATH = Path(__file__).parent / "risk_model.pkl"
FEATURE_COLS = [
    "temp_max", "temp_avg", "precip_7d", "precip_14d",
    "humidity", "soil_moisture", "soil_ph",
    "ndvi", "ndvi_trend", "tree_age", "day_of_year"
]


# ─── Data Generation ──────────────────────────────────────────────────────────

def generate_training_data(n: int = 4000) -> pd.DataFrame:
    """
    Generate scientifically-grounded synthetic training data.
    Risk score is computed from domain rules (same logic as riskAnalysisEngine.js
    but extended), so the ML model learns to generalise those rules + interactions.
    """
    rng = np.random.default_rng(42)

    # Simulate Indian climate zones
    temp_avg   = rng.uniform(15, 42, n)
    temp_max   = temp_avg + rng.uniform(2, 8, n)
    precip_14d = rng.exponential(80, n).clip(0, 500)
    precip_7d  = precip_14d * rng.uniform(0.3, 0.7, n)
    humidity   = rng.uniform(25, 95, n)
    soil_moist = rng.uniform(15, 90, n)
    soil_ph    = rng.uniform(4.5, 8.5, n)
    ndvi       = rng.uniform(0.1, 0.85, n)
    ndvi_trend = rng.uniform(-8, 4, n)
    tree_age   = rng.uniform(0.1, 10, n)
    doy        = rng.integers(1, 366, n).astype(float)

    # ── Rule-based risk score (domain knowledge) ──────────────────────────────
    risk = np.zeros(n)

    # Drought component (0-35)
    drought = np.zeros(n)
    drought += np.where(precip_7d < 5,  35, np.where(precip_7d < 10, 25,
               np.where(precip_7d < 20, 15, np.where(precip_7d < 35, 5, 0))))
    drought += np.where(temp_avg > 35, 20, np.where(temp_avg > 32, 12,
               np.where(temp_avg > 29, 6, 0)))
    drought += np.where(soil_moist < 25, 20, np.where(soil_moist < 35, 12,
               np.where(soil_moist < 45, 6, 0)))
    risk += drought.clip(0, 35) * 0.35

    # Heat stress component (0-30)
    heat = np.zeros(n)
    heat += np.where(temp_max > 42, 30, np.where(temp_max > 39, 22,
            np.where(temp_max > 36, 15, np.where(temp_max > 33, 8, 0))))
    heat += np.where(tree_age < 1, 15, np.where(tree_age < 2, 8,
            np.where(tree_age < 3, 4, 0)))
    heat += np.where(humidity < 30, 12, np.where(humidity < 40, 7,
            np.where(humidity < 50, 3, 0)))
    risk += heat.clip(0, 30) * 0.25

    # Water scarcity component (0-25)
    water = np.zeros(n)
    water += np.where(precip_14d < 10, 25, np.where(precip_14d < 25, 18,
             np.where(precip_14d < 50, 10, np.where(precip_14d < 80, 4, 0))))
    evap_idx = (temp_avg / 10) * (100 - humidity) / 100
    water += np.where(evap_idx > 4, 15, np.where(evap_idx > 3, 10,
             np.where(evap_idx > 2, 5, 0)))
    risk += water.clip(0, 25) * 0.25

    # Vegetation decline component (0-20)
    veg = np.zeros(n)
    veg += np.where(ndvi < 0.2, 20, np.where(ndvi < 0.3, 14,
           np.where(ndvi < 0.4, 8, np.where(ndvi < 0.5, 3, 0))))
    veg += np.where(ndvi_trend < -5, 15, np.where(ndvi_trend < -3, 10,
           np.where(ndvi_trend < -1, 5, 0)))
    risk += veg.clip(0, 20) * 0.15

    # Seasonal modifier (monsoon = lower risk, pre-monsoon = higher)
    seasonal = np.where((doy > 150) & (doy < 270), -5,   # monsoon
               np.where((doy > 60)  & (doy < 150), +8,   # pre-monsoon
               np.where(doy > 300,                  +4,   # post-monsoon dry
               0)))
    risk += seasonal

    # Soil pH penalty
    ph_penalty = np.where((soil_ph < 5.0) | (soil_ph > 8.5), 8,
                 np.where((soil_ph < 5.5) | (soil_ph > 8.0), 4, 0))
    risk += ph_penalty

    # Add realistic noise
    risk += rng.normal(0, 3, n)
    risk = risk.clip(0, 100)

    df = pd.DataFrame({
        "temp_max":    temp_max,
        "temp_avg":    temp_avg,
        "precip_7d":   precip_7d,
        "precip_14d":  precip_14d,
        "humidity":    humidity,
        "soil_moisture": soil_moist,
        "soil_ph":     soil_ph,
        "ndvi":        ndvi,
        "ndvi_trend":  ndvi_trend,
        "tree_age":    tree_age,
        "day_of_year": doy,
        "risk_score":  risk,
    })
    return df


# ─── Train ────────────────────────────────────────────────────────────────────

def train_model():
    print("Generating training data...", flush=True)
    df = generate_training_data(8000)

    X = df[FEATURE_COLS]
    y = df["risk_score"]

    model = Pipeline([
        ("scaler", StandardScaler()),
        ("gbr", GradientBoostingRegressor(
            n_estimators=150,
            max_depth=4,
            learning_rate=0.08,
            subsample=0.8,
            min_samples_leaf=15,
            random_state=42,
        ))
    ])

    # Cross-validate
    cv_scores = cross_val_score(model, X, y, cv=3, scoring="r2", n_jobs=1)
    print(f"CV R² scores: {cv_scores.round(3)} | mean={cv_scores.mean():.3f}", flush=True)

    model.fit(X, y)

    # Final metrics on training set
    y_pred = model.predict(X)
    print(f"Train MAE: {mean_absolute_error(y, y_pred):.2f}", flush=True)
    print(f"Train R²:  {r2_score(y, y_pred):.3f}", flush=True)

    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    print(f"Model saved → {MODEL_PATH}", flush=True)
    return model


def load_model():
    if not MODEL_PATH.exists():
        print("Model not found, training now...", flush=True)
        return train_model()
    with open(MODEL_PATH, "rb") as f:
        return pickle.load(f)


# ─── Predict ──────────────────────────────────────────────────────────────────

def classify_risk(score: float) -> str:
    if score >= 65:
        return "HIGH"
    if score >= 38:
        return "MEDIUM"
    return "LOW"


def predict_risk(features: dict) -> dict:
    """
    features dict keys: same as FEATURE_COLS
    Returns: risk_score, risk_level, breakdown, confidence
    """
    model = load_model()

    row = pd.DataFrame([{col: features.get(col, 0.0) for col in FEATURE_COLS}])
    score = float(model.predict(row)[0])
    score = max(0.0, min(100.0, score))

    # Partial breakdown (approximate contribution per group)
    gbr = model.named_steps["gbr"]
    imps = gbr.feature_importances_
    feat_imp = dict(zip(FEATURE_COLS, imps))

    breakdown = {
        "drought":           round((feat_imp["precip_7d"] + feat_imp["precip_14d"] + feat_imp["soil_moisture"]) * score, 1),
        "heatStress":        round((feat_imp["temp_max"] + feat_imp["temp_avg"]) * score, 1),
        "waterScarcity":     round((feat_imp["humidity"] + feat_imp["precip_14d"]) * score * 0.5, 1),
        "vegetationDecline": round((feat_imp["ndvi"] + feat_imp["ndvi_trend"]) * score, 1),
    }

    # Normalise breakdown to sum to score
    total = sum(breakdown.values()) or 1
    breakdown = {k: round(v / total * score, 1) for k, v in breakdown.items()}

    primary = max(breakdown, key=breakdown.get)
    primary_labels = {
        "drought": "Drought",
        "heatStress": "Heat Stress",
        "waterScarcity": "Water Scarcity",
        "vegetationDecline": "Vegetation Decline",
    }

    return {
        "riskScore":   round(score, 1),
        "riskLevel":   classify_risk(score),
        "primaryCause": primary_labels[primary],
        "breakdown":   breakdown,
        "confidence":  90,
        "model":       "GradientBoosting",
    }


def predict_8_days(base_features: dict, forecast: list) -> list:
    """
    forecast: list of {temp, precipitation, humidity} per day (from OpenWeatherMap)
    Returns list of 8 daily predictions.
    """
    results = []
    for i, day in enumerate(forecast[:8]):
        feats = dict(base_features)
        feats["temp_avg"]    = float(day.get("temp", base_features.get("temp_avg", 28)))
        feats["temp_max"]    = feats["temp_avg"] + 4.0
        feats["humidity"]    = float(day.get("humidity", base_features.get("humidity", 65)))
        # Soil moisture degrades over time without rain
        rain = float(day.get("precipitation", 0))
        feats["precip_7d"]   = rain * 7
        feats["precip_14d"]  = rain * 14
        feats["soil_moisture"] = max(15, base_features.get("soil_moisture", 60) - i * 2.5 + rain * 3)
        feats["ndvi"]        = max(0.1, base_features.get("ndvi", 0.5) - i * 0.015)
        feats["ndvi_trend"]  = -i * 0.5

        pred = predict_risk(feats)
        from datetime import datetime, timedelta
        date = (datetime.utcnow() + timedelta(days=i + 1)).isoformat()

        results.append({
            "day":          i + 1,
            "date":         date,
            "riskScore":    pred["riskScore"],
            "riskLevel":    pred["riskLevel"],
            "primaryCause": pred["primaryCause"],
            "breakdown":    pred["breakdown"],
            "confidence":   pred["confidence"],
            "weather": {
                "temp":          feats["temp_avg"],
                "precipitation": rain,
                "humidity":      feats["humidity"],
            },
            "actions": get_actions(pred["riskLevel"], pred["primaryCause"]),
        })
    return results


def get_actions(level: str, cause: str) -> list:
    table = {
        "HIGH": {
            "Drought":            ["Emergency irrigation within 48h", "Apply 10cm mulch", "Prioritise young saplings"],
            "Heat Stress":        ["Irrigate twice daily", "Install shade cloth", "Monitor for leaf scorch"],
            "Water Scarcity":     ["Activate water conservation protocol", "Install drip irrigation", "Harvest rainwater"],
            "Vegetation Decline": ["Immediate field inspection", "Test soil nutrients", "Check for pests/disease"],
        },
        "MEDIUM": {
            "Drought":            ["Increase irrigation 30-50%", "Apply mulch", "Monitor soil moisture daily"],
            "Heat Stress":        ["Irrigate early morning/evening", "Apply organic mulch", "Monitor stress indicators"],
            "Water Scarcity":     ["Optimise irrigation schedule", "Reduce runoff", "Prepare contingency water"],
            "Vegetation Decline": ["Field inspection within 7 days", "Review maintenance", "Monitor NDVI weekly"],
        },
        "LOW": {
            "Drought":            ["Continue regular monitoring", "Maintain irrigation schedule"],
            "Heat Stress":        ["Monitor forecasts", "Maintain soil moisture"],
            "Water Scarcity":     ["Monitor rainfall patterns", "Maintain infrastructure"],
            "Vegetation Decline": ["Continue routine monitoring", "Document health"],
        },
    }
    return table.get(level, {}).get(cause, ["Continue monitoring"])


# ─── CLI / stdin interface ─────────────────────────────────────────────────────

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "train":
        train_model()
        sys.exit(0)

    raw = sys.stdin.read().strip()
    if not raw:
        print(json.dumps({"error": "No input"}))
        sys.exit(1)

    try:
        payload = json.loads(raw)
    except Exception as e:
        print(json.dumps({"error": f"JSON parse error: {e}"}))
        sys.exit(1)

    mode = payload.get("mode", "single")

    if mode == "8day":
        base = payload.get("base_features", {})
        forecast = payload.get("forecast", [])
        result = predict_8_days(base, forecast)
        print(json.dumps({"predictions": result, "model": "GradientBoosting"}))
    else:
        features = payload.get("features", payload)
        result = predict_risk(features)
        print(json.dumps(result))
