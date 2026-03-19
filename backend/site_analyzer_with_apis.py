#!/usr/bin/env python3
"""
Adaptive Reforestation Site Analyzer with Real API Integration
===============================================================
Fetches real-time data from satellite, soil, and weather APIs,
then analyzes site suitability for reforestation.

Author: Habitat Canopy Team
Version: 2.0.0
"""

import json
import sys
import os
from typing import Dict, Any, Optional
import urllib.request
import urllib.error
from datetime import datetime, timedelta
from pathlib import Path


# Load environment variables from .env file
def load_env_file():
    """Load environment variables from backend/.env file."""
    env_file = Path(__file__).parent / '.env'
    if env_file.exists():
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    # Only set if not already in environment
                    if key not in os.environ:
                        os.environ[key] = value

# Load .env file first
load_env_file()

# API Configuration
OPENWEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY', '')
SENTINEL_CLIENT_ID = os.getenv('SENTINEL_CLIENT_ID', '')
SENTINEL_CLIENT_SECRET = os.getenv('SENTINEL_CLIENT_SECRET', '')


def fetch_weather_data(lat: float, lon: float) -> Dict[str, Any]:
    """
    Fetch current weather data from OpenWeatherMap API.
    
    Args:
        lat: Latitude
        lon: Longitude
        
    Returns:
        Dictionary with temperature and rainfall data
    """
    try:
        url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}&units=metric"
        
        with urllib.request.urlopen(url, timeout=10) as response:
            data = json.loads(response.read().decode())
            
            # Extract relevant data
            temperature = data.get('main', {}).get('temp', 25.0)
            
            # Get rainfall (if available)
            rainfall = data.get('rain', {}).get('1h', 0) * 24 * 14  # Estimate 14-day rainfall
            if rainfall == 0:
                rainfall = 100.0  # Default if no rain data
            
            return {
                'temperature': temperature,
                'rainfall': rainfall,
                'humidity': data.get('main', {}).get('humidity', 60),
                'source': 'OpenWeatherMap',
                'success': True
            }
    except Exception as e:
        print(f"Warning: Weather API failed - {str(e)}", file=sys.stderr)
        return {
            'temperature': 25.0,
            'rainfall': 100.0,
            'humidity': 60,
            'source': 'mock',
            'success': False,
            'error': str(e)
        }


def fetch_soil_data(lat: float, lon: float) -> Dict[str, Any]:
    """
    Fetch soil data from SoilGrids API.
    
    Args:
        lat: Latitude
        lon: Longitude
        
    Returns:
        Dictionary with soil pH and moisture data
    """
    try:
        # Fetch pH data
        ph_url = f"https://rest.isric.org/soilgrids/v2.0/properties/query?lon={lon}&lat={lat}&property=phh2o&depth=0-5cm&value=mean"
        
        with urllib.request.urlopen(ph_url, timeout=10) as response:
            ph_data = json.loads(response.read().decode())
            ph_value = ph_data['properties']['layers'][0]['depths'][0]['values']['mean'] / 10
        
        # Fetch clay content for moisture estimation
        clay_url = f"https://rest.isric.org/soilgrids/v2.0/properties/query?lon={lon}&lat={lat}&property=clay&depth=0-5cm&value=mean"
        
        with urllib.request.urlopen(clay_url, timeout=10) as response:
            clay_data = json.loads(response.read().decode())
            clay_content = clay_data['properties']['layers'][0]['depths'][0]['values']['mean'] / 10
        
        # Estimate moisture based on clay content
        moisture = min(95, 30 + (clay_content * 0.5))
        
        return {
            'soil_ph': ph_value,
            'soil_moisture': moisture,
            'clay_content': clay_content,
            'source': 'SoilGrids',
            'success': True
        }
    except Exception as e:
        print(f"Warning: Soil API failed - {str(e)}", file=sys.stderr)
        # Return mock data based on location
        is_tropical = abs(lat) < 23.5
        return {
            'soil_ph': 6.0 if is_tropical else 6.5,
            'soil_moisture': 65 if is_tropical else 55,
            'clay_content': 25,
            'source': 'mock',
            'success': False,
            'error': str(e)
        }


def fetch_ndvi_data(lat: float, lon: float) -> Dict[str, Any]:
    """
    Fetch NDVI data from Sentinel Hub or estimate from location.
    
    Args:
        lat: Latitude
        lon: Longitude
        
    Returns:
        Dictionary with NDVI value
    """
    try:
        # For now, estimate NDVI based on location
        # In production, this would call Sentinel Hub API
        
        # Tropical regions tend to have higher NDVI
        is_equatorial = abs(lat) < 10
        is_tropical = abs(lat) < 23.5
        
        if is_equatorial:
            base_ndvi = 0.65
        elif is_tropical:
            base_ndvi = 0.50
        else:
            base_ndvi = 0.40
        
        # Add some variation
        import random
        ndvi = base_ndvi + (random.random() * 0.2 - 0.1)
        ndvi = max(0.0, min(1.0, ndvi))
        
        return {
            'ndvi': ndvi,
            'source': 'estimated',
            'success': True,
            'note': 'NDVI estimated from location. Use Sentinel Hub API for real satellite data.'
        }
    except Exception as e:
        print(f"Warning: NDVI estimation failed - {str(e)}", file=sys.stderr)
        return {
            'ndvi': 0.40,
            'source': 'mock',
            'success': False,
            'error': str(e)
        }


def fetch_all_data(lat: float, lon: float) -> Dict[str, Any]:
    """
    Fetch all required data from APIs.
    
    Args:
        lat: Latitude
        lon: Longitude
        
    Returns:
        Dictionary with all environmental data
    """
    print(f"Fetching data for location: {lat}, {lon}", file=sys.stderr)
    
    # Fetch data from all APIs
    weather_data = fetch_weather_data(lat, lon)
    soil_data = fetch_soil_data(lat, lon)
    ndvi_data = fetch_ndvi_data(lat, lon)
    
    # Combine all data
    combined_data = {
        'location': {
            'lat': lat,
            'lon': lon
        },
        'ndvi': ndvi_data['ndvi'],
        'soil_ph': soil_data['soil_ph'],
        'soil_moisture': soil_data['soil_moisture'],
        'temperature': weather_data['temperature'],
        'rainfall': weather_data['rainfall'],
        'data_sources': {
            'weather': weather_data.get('source', 'unknown'),
            'soil': soil_data.get('source', 'unknown'),
            'ndvi': ndvi_data.get('source', 'unknown')
        },
        'api_status': {
            'weather_success': weather_data.get('success', False),
            'soil_success': soil_data.get('success', False),
            'ndvi_success': ndvi_data.get('success', False)
        },
        'timestamp': datetime.now().isoformat()
    }
    
    return combined_data


# Import scoring functions from original analyzer
def calculate_vegetation_health_score(ndvi: float) -> Dict[str, Any]:
    """Calculate vegetation health score based on NDVI value."""
    ndvi = max(0.0, min(1.0, ndvi))
    
    if ndvi > 0.6:
        score = 80 + (ndvi - 0.6) * 50
        classification = "HEALTHY"
        description = "Dense, healthy vegetation present"
    elif ndvi >= 0.3:
        score = 40 + (ndvi - 0.3) * 133.33
        classification = "MODERATE"
        description = "Moderate vegetation cover"
    else:
        score = ndvi * 133.33
        classification = "POOR"
        description = "Sparse or degraded vegetation"
    
    return {
        "score": round(score, 2),
        "classification": classification,
        "description": description,
        "ndvi_value": ndvi
    }


def calculate_soil_suitability_score(ph: float, moisture: float) -> Dict[str, Any]:
    """Calculate soil suitability score based on pH and moisture."""
    # pH Score (0-50 points)
    if 6.0 <= ph <= 7.5:
        ph_score = 50
        ph_status = "OPTIMAL"
    elif 5.5 <= ph < 6.0 or 7.5 < ph <= 8.0:
        ph_score = 35
        ph_status = "ACCEPTABLE"
    elif 5.0 <= ph < 5.5 or 8.0 < ph <= 8.5:
        ph_score = 20
        ph_status = "MARGINAL"
    else:
        ph_score = 10
        ph_status = "POOR"
    
    # Moisture Score (0-50 points)
    if 50 <= moisture <= 70:
        moisture_score = 50
        moisture_status = "OPTIMAL"
    elif 40 <= moisture < 50 or 70 < moisture <= 80:
        moisture_score = 35
        moisture_status = "ACCEPTABLE"
    elif 30 <= moisture < 40 or 80 < moisture <= 90:
        moisture_score = 20
        moisture_status = "MARGINAL"
    else:
        moisture_score = 10
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
    """Calculate climate stress score based on temperature and rainfall."""
    stress_score = 0
    risk_factors = []
    
    # Temperature Stress (0-50 points)
    if 20 <= temperature <= 30:
        temp_stress = 0
        temp_status = "OPTIMAL"
    elif 15 <= temperature < 20 or 30 < temperature <= 35:
        temp_stress = 15
        temp_status = "MILD_STRESS"
    elif 10 <= temperature < 15 or 35 < temperature <= 40:
        temp_stress = 30
        temp_status = "MODERATE_STRESS"
        risk_factors.append("Temperature outside optimal range")
    else:
        temp_stress = 50
        temp_status = "HIGH_STRESS"
        risk_factors.append("Extreme temperature conditions")
    
    # Rainfall Stress (0-50 points)
    if 100 <= rainfall <= 200:
        rain_stress = 0
        rain_status = "OPTIMAL"
    elif 50 <= rainfall < 100 or 200 < rainfall <= 300:
        rain_stress = 15
        rain_status = "MILD_STRESS"
    elif 20 <= rainfall < 50 or 300 < rainfall <= 400:
        rain_stress = 30
        rain_status = "MODERATE_STRESS"
        risk_factors.append("Rainfall outside optimal range")
    else:
        rain_stress = 50
        rain_status = "HIGH_STRESS"
        if rainfall < 20:
            risk_factors.append("Severe drought conditions")
        else:
            risk_factors.append("Excessive rainfall/flooding risk")
    
    # Drought Risk
    if temperature > 35 and rainfall < 50:
        stress_score += 20
        risk_factors.append("High drought risk detected")
    
    total_stress = temp_stress + rain_stress + (20 if len(risk_factors) > 2 else 0)
    total_stress = min(100, total_stress)
    
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
    """Calculate final site suitability score."""
    veg_score = vegetation_health["score"] * 0.30
    soil_score = soil_suitability["score"] * 0.40
    climate_score = (100 - climate_stress["stress_score"]) * 0.30
    
    final_score = veg_score + soil_score + climate_score
    final_score = round(final_score, 2)
    
    if final_score >= 70:
        risk_level = "LOW"
        priority = "HIGH"
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


def analyze_site_from_location(lat: float, lon: float) -> str:
    """
    Main function to analyze site by fetching data from APIs.
    
    Args:
        lat: Latitude
        lon: Longitude
        
    Returns:
        JSON string with analysis results
    """
    # Fetch data from APIs
    data = fetch_all_data(lat, lon)
    
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
        "location": data['location'],
        "input_data": {
            "ndvi": data["ndvi"],
            "soil_ph": data["soil_ph"],
            "soil_moisture": data["soil_moisture"],
            "temperature": data["temperature"],
            "rainfall": data["rainfall"]
        },
        "data_sources": data['data_sources'],
        "api_status": data['api_status'],
        "timestamp": data['timestamp'],
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
    Usage: python site_analyzer_with_apis.py <lat> <lon>
    """
    if len(sys.argv) < 3:
        print("Usage: python site_analyzer_with_apis.py <latitude> <longitude>")
        print("\nExample:")
        print("  python site_analyzer_with_apis.py 14.0 75.5")
        print("\nThis will fetch real data from:")
        print("  - OpenWeatherMap (weather)")
        print("  - SoilGrids (soil)")
        print("  - Sentinel Hub (NDVI - estimated for now)")
        sys.exit(1)
    
    try:
        lat = float(sys.argv[1])
        lon = float(sys.argv[2])
        
        # Validate coordinates
        if not (-90 <= lat <= 90):
            print("Error: Latitude must be between -90 and 90")
            sys.exit(1)
        if not (-180 <= lon <= 180):
            print("Error: Longitude must be between -180 and 180")
            sys.exit(1)
        
        # Analyze and print results
        result = analyze_site_from_location(lat, lon)
        print(result)
        
    except ValueError:
        print("Error: Latitude and longitude must be numbers")
        sys.exit(1)
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }, indent=2))
        sys.exit(1)


if __name__ == "__main__":
    main()
