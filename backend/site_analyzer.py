#!/usr/bin/env python3
"""
Adaptive Reforestation Site Analyzer
=====================================
A rule-based system for analyzing site suitability for reforestation projects.
Uses satellite and environmental data to compute explainable scores and recommendations.

Author: Habitat Canopy Team
Version: 1.0.0
"""

import json
import sys
from typing import Dict, Any, Optional


def parse_input_data(json_str: str) -> Dict[str, Any]:
    """
    Safely parse JSON input data with default values for missing fields.
    
    Args:
        json_str: JSON string containing site data
        
    Returns:
        Dictionary with parsed data and defaults for missing fields
    """
    try:
        data = json.loads(json_str)
    except json.JSONDecodeError as e:
        return {
            "error": f"Invalid JSON format: {str(e)}",
            "ndvi": 0.0,
            "soil_ph": 6.5,
            "soil_moisture": 50.0,
            "temperature": 25.0,
            "rainfall": 100.0
        }
    
    # Extract values with defaults
    return {
        "ndvi": float(data.get("ndvi", 0.0)),
        "soil_ph": float(data.get("soil_ph", 6.5)),
        "soil_moisture": float(data.get("soil_moisture", 50.0)),
        "temperature": float(data.get("temperature", 25.0)),
        "rainfall": float(data.get("rainfall", 100.0))
    }


def calculate_vegetation_health_score(ndvi: float) -> Dict[str, Any]:
    """
    Calculate vegetation health score based on NDVI value.
    
    NDVI Ranges:
    - > 0.6: Healthy vegetation (dense forest)
    - 0.3-0.6: Moderate vegetation (grassland, sparse forest)
    - < 0.3: Poor vegetation (bare soil, degraded land)
    
    Args:
        ndvi: Normalized Difference Vegetation Index (0 to 1)
        
    Returns:
        Dictionary with score (0-100) and classification
    """
    # Clamp NDVI to valid range
    ndvi = max(0.0, min(1.0, ndvi))
    
    if ndvi > 0.6:
        score = 80 + (ndvi - 0.6) * 50  # 80-100 for healthy
        classification = "HEALTHY"
        description = "Dense, healthy vegetation present"
    elif ndvi >= 0.3:
        score = 40 + (ndvi - 0.3) * 133.33  # 40-80 for moderate
        classification = "MODERATE"
        description = "Moderate vegetation cover"
    else:
        score = ndvi * 133.33  # 0-40 for poor
        classification = "POOR"
        description = "Sparse or degraded vegetation"
    
    return {
        "score": round(score, 2),
        "classification": classification,
        "description": description,
        "ndvi_value": ndvi
    }


def calculate_soil_suitability_score(ph: float, moisture: float) -> Dict[str, Any]:
    """
    Calculate soil suitability score based on pH and moisture.
    
    Optimal Ranges:
    - pH: 6.0-7.5 (slightly acidic to neutral)
    - Moisture: 50-70% (adequate but not waterlogged)
    
    Args:
        ph: Soil pH value (typically 4.0-9.0)
        moisture: Soil moisture percentage (0-100)
        
    Returns:
        Dictionary with score (0-100) and details
    """
    # pH Score (0-50 points)
    if 6.0 <= ph <= 7.5:
        ph_score = 50  # Optimal range
        ph_status = "OPTIMAL"
    elif 5.5 <= ph < 6.0 or 7.5 < ph <= 8.0:
        ph_score = 35  # Acceptable range
        ph_status = "ACCEPTABLE"
    elif 5.0 <= ph < 5.5 or 8.0 < ph <= 8.5:
        ph_score = 20  # Marginal range
        ph_status = "MARGINAL"
    else:
        ph_score = 10  # Poor range
        ph_status = "POOR"
    
    # Moisture Score (0-50 points)
    if 50 <= moisture <= 70:
        moisture_score = 50  # Optimal range
        moisture_status = "OPTIMAL"
    elif 40 <= moisture < 50 or 70 < moisture <= 80:
        moisture_score = 35  # Acceptable range
        moisture_status = "ACCEPTABLE"
    elif 30 <= moisture < 40 or 80 < moisture <= 90:
        moisture_score = 20  # Marginal range
        moisture_status = "MARGINAL"
    else:
        moisture_score = 10  # Poor range
        moisture_status = "POOR"
    
    total_score = ph_score + moisture_score
    
    return {
        "score": round(total_score, 2),
        "ph_score": ph_score,
        "ph_status": ph_status,
        "moisture_score": moisture_score,
        "moisture_status": moisture_status,
        "ph_value": ph,
        "moisture_value": moisture
    }


def calculate_climate_stress_score(temperature: float, rainfall: float) -> Dict[str, Any]:
    """
    Calculate climate stress score based on temperature and rainfall.
    Lower stress = better conditions for reforestation.
    
    Optimal Ranges:
    - Temperature: 20-30°C (tropical/subtropical)
    - Rainfall: 100-200mm per 14 days (adequate moisture)
    
    Args:
        temperature: Average temperature in Celsius
        rainfall: Total rainfall in mm over last 14 days
        
    Returns:
        Dictionary with stress score (0-100, lower is better) and risk level
    """
    stress_score = 0
    risk_factors = []
    
    # Temperature Stress (0-50 points)
    if 20 <= temperature <= 30:
        temp_stress = 0  # Optimal
        temp_status = "OPTIMAL"
    elif 15 <= temperature < 20 or 30 < temperature <= 35:
        temp_stress = 15  # Mild stress
        temp_status = "MILD_STRESS"
    elif 10 <= temperature < 15 or 35 < temperature <= 40:
        temp_stress = 30  # Moderate stress
        temp_status = "MODERATE_STRESS"
        risk_factors.append("Temperature outside optimal range")
    else:
        temp_stress = 50  # High stress
        temp_status = "HIGH_STRESS"
        risk_factors.append("Extreme temperature conditions")
    
    # Rainfall Stress (0-50 points)
    if 100 <= rainfall <= 200:
        rain_stress = 0  # Optimal
        rain_status = "OPTIMAL"
    elif 50 <= rainfall < 100 or 200 < rainfall <= 300:
        rain_stress = 15  # Mild stress
        rain_status = "MILD_STRESS"
    elif 20 <= rainfall < 50 or 300 < rainfall <= 400:
        rain_stress = 30  # Moderate stress
        rain_status = "MODERATE_STRESS"
        risk_factors.append("Rainfall outside optimal range")
    else:
        rain_stress = 50  # High stress
        rain_status = "HIGH_STRESS"
        if rainfall < 20:
            risk_factors.append("Severe drought conditions")
        else:
            risk_factors.append("Excessive rainfall/flooding risk")
    
    # Drought Risk (combined temperature + rainfall)
    if temperature > 35 and rainfall < 50:
        stress_score += 20  # Additional drought penalty
        risk_factors.append("High drought risk detected")
    
    total_stress = temp_stress + rain_stress + (20 if len(risk_factors) > 2 else 0)
    total_stress = min(100, total_stress)  # Cap at 100
    
    return {
        "stress_score": round(total_stress, 2),
        "temp_stress": temp_stress,
        "temp_status": temp_status,
        "rain_stress": rain_stress,
        "rain_status": rain_status,
        "risk_factors": risk_factors,
        "temperature_value": temperature,
        "rainfall_value": rainfall
    }


def calculate_site_suitability(
    vegetation_health: Dict[str, Any],
    soil_suitability: Dict[str, Any],
    climate_stress: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Calculate final site suitability score by combining all component scores.
    
    Weighting:
    - Vegetation Health: 30% (indicates current state)
    - Soil Suitability: 40% (critical for tree growth)
    - Climate Stress: 30% (inverted - lower stress = higher score)
    
    Args:
        vegetation_health: Vegetation health score dict
        soil_suitability: Soil suitability score dict
        climate_stress: Climate stress score dict
        
    Returns:
        Dictionary with final suitability score (0-100) and risk level
    """
    # Calculate weighted score
    veg_score = vegetation_health["score"] * 0.30
    soil_score = soil_suitability["score"] * 0.40
    # Invert climate stress (100 - stress = suitability)
    climate_score = (100 - climate_stress["stress_score"]) * 0.30
    
    final_score = veg_score + soil_score + climate_score
    final_score = round(final_score, 2)
    
    # Determine risk level
    if final_score >= 70:
        risk_level = "LOW"
        priority = "HIGH"  # High priority for restoration (good conditions)
        recommendation = "Excellent site for reforestation. Proceed with planting."
    elif final_score >= 50:
        risk_level = "MEDIUM"
        priority = "MEDIUM"
        recommendation = "Good site with some challenges. Consider soil amendments and species selection."
    else:
        risk_level = "HIGH"
        priority = "LOW"
        recommendation = "Challenging site. Requires significant preparation and hardy species."
    
    return {
        "final_score": final_score,
        "risk_level": risk_level,
        "priority": priority,
        "recommendation": recommendation,
        "component_scores": {
            "vegetation_contribution": round(veg_score, 2),
            "soil_contribution": round(soil_score, 2),
            "climate_contribution": round(climate_score, 2)
        }
    }


def analyze_site(json_input: str) -> str:
    """
    Main function to analyze site suitability from JSON input.
    
    Args:
        json_input: JSON string with site data
        
    Returns:
        JSON string with analysis results
    """
    # Parse input data
    data = parse_input_data(json_input)
    
    # Check for parsing errors
    if "error" in data:
        return json.dumps({
            "success": False,
            "error": data["error"]
        }, indent=2)
    
    # Calculate component scores
    vegetation_health = calculate_vegetation_health_score(data["ndvi"])
    soil_suitability = calculate_soil_suitability_score(
        data["soil_ph"],
        data["soil_moisture"]
    )
    climate_stress = calculate_climate_stress_score(
        data["temperature"],
        data["rainfall"]
    )
    
    # Calculate final suitability
    site_suitability = calculate_site_suitability(
        vegetation_health,
        soil_suitability,
        climate_stress
    )
    
    # Compile results
    results = {
        "success": True,
        "input_data": data,
        "analysis": {
            "vegetation_health": vegetation_health,
            "soil_suitability": soil_suitability,
            "climate_stress": climate_stress,
            "site_suitability": site_suitability
        },
        "summary": {
            "suitability_score": site_suitability["final_score"],
            "risk_level": site_suitability["risk_level"],
            "priority": site_suitability["priority"],
            "recommendation": site_suitability["recommendation"]
        }
    }
    
    return json.dumps(results, indent=2)


def main():
    """
    Main entry point for command-line usage.
    Reads JSON from stdin or command-line argument.
    """
    if len(sys.argv) > 1:
        # Read from command-line argument
        json_input = sys.argv[1]
    else:
        # Read from stdin
        json_input = sys.stdin.read()
    
    # Analyze and print results
    result = analyze_site(json_input)
    print(result)


# Example usage and test cases
if __name__ == "__main__":
    # Example 1: Excellent site (degraded land with good conditions)
    example1 = {
        "ndvi": 0.35,
        "soil_ph": 6.5,
        "soil_moisture": 65,
        "temperature": 28,
        "rainfall": 150
    }
    
    # Example 2: Moderate site (some challenges)
    example2 = {
        "ndvi": 0.45,
        "soil_ph": 5.8,
        "soil_moisture": 45,
        "temperature": 32,
        "rainfall": 80
    }
    
    # Example 3: Poor site (high stress)
    example3 = {
        "ndvi": 0.25,
        "soil_ph": 8.5,
        "soil_moisture": 25,
        "temperature": 38,
        "rainfall": 15
    }
    
    # If no arguments provided, run examples
    if len(sys.argv) == 1 and sys.stdin.isatty():
        print("=" * 60)
        print("EXAMPLE 1: Excellent Site (Degraded land, good conditions)")
        print("=" * 60)
        print(analyze_site(json.dumps(example1)))
        
        print("\n" + "=" * 60)
        print("EXAMPLE 2: Moderate Site (Some challenges)")
        print("=" * 60)
        print(analyze_site(json.dumps(example2)))
        
        print("\n" + "=" * 60)
        print("EXAMPLE 3: Poor Site (High stress)")
        print("=" * 60)
        print(analyze_site(json.dumps(example3)))
    else:
        main()
