#!/usr/bin/env python3
"""
Forest Risk ML Microservice
============================
Flask server exposing the GradientBoosting risk model.
Node.js backend calls this on port 5001.
"""

from flask import Flask, request, jsonify
from forest_risk_model import predict_risk, predict_8_days, train_model, MODEL_PATH
import os

app = Flask(__name__)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model_exists": MODEL_PATH.exists()})


@app.route("/predict", methods=["POST"])
def predict():
    """Single-point risk prediction."""
    data = request.get_json(force=True)
    if not data:
        return jsonify({"error": "No JSON body"}), 400
    try:
        result = predict_risk(data.get("features", data))
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/predict/8day", methods=["POST"])
def predict_8day():
    """8-day forecast risk prediction."""
    data = request.get_json(force=True)
    if not data:
        return jsonify({"error": "No JSON body"}), 400
    try:
        base = data.get("base_features", {})
        forecast = data.get("forecast", [])
        predictions = predict_8_days(base, forecast)
        return jsonify({
            "predictions": predictions,
            "model": "GradientBoosting",
            "source": "ml"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/train", methods=["POST"])
def retrain():
    """Retrain the model (admin use)."""
    try:
        train_model()
        return jsonify({"status": "trained", "model": str(MODEL_PATH)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    # Ensure model is trained on startup
    if not MODEL_PATH.exists():
        print("Training model on first start...", flush=True)
        train_model()
    port = int(os.environ.get("ML_PORT", 5001))
    print(f"ML server running on port {port}", flush=True)
    app.run(host="0.0.0.0", port=port, debug=False)
