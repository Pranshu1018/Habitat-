#!/usr/bin/env python3
"""
Test script for site_analyzer.py
Demonstrates various input scenarios and expected outputs.
"""

import json
import subprocess
import sys


def test_analyzer(test_name: str, input_data: dict):
    """Run analyzer with test data and display results."""
    print(f"\n{'=' * 70}")
    print(f"TEST: {test_name}")
    print(f"{'=' * 70}")
    print(f"Input Data:")
    print(json.dumps(input_data, indent=2))
    print(f"\n{'-' * 70}")
    
    # Run the analyzer
    result = subprocess.run(
        ['python', 'site_analyzer.py', json.dumps(input_data)],
        capture_output=True,
        text=True
    )
    
    print("Output:")
    print(result.stdout)
    
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
    
    return result.returncode == 0


def main():
    """Run all test cases."""
    print("SITE ANALYZER TEST SUITE")
    print("=" * 70)
    
    tests_passed = 0
    tests_total = 0
    
    # Test 1: Ideal reforestation site
    tests_total += 1
    if test_analyzer(
        "Ideal Reforestation Site",
        {
            "ndvi": 0.35,
            "soil_ph": 6.5,
            "soil_moisture": 65,
            "temperature": 28,
            "rainfall": 150
        }
    ):
        tests_passed += 1
    
    # Test 2: Healthy forest (already vegetated)
    tests_total += 1
    if test_analyzer(
        "Healthy Forest (Low Priority)",
        {
            "ndvi": 0.75,
            "soil_ph": 6.8,
            "soil_moisture": 70,
            "temperature": 25,
            "rainfall": 180
        }
    ):
        tests_passed += 1
    
    # Test 3: Drought conditions
    tests_total += 1
    if test_analyzer(
        "Drought Conditions",
        {
            "ndvi": 0.25,
            "soil_ph": 7.2,
            "soil_moisture": 25,
            "temperature": 38,
            "rainfall": 15
        }
    ):
        tests_passed += 1
    
    # Test 4: Acidic soil
    tests_total += 1
    if test_analyzer(
        "Acidic Soil Challenge",
        {
            "ndvi": 0.40,
            "soil_ph": 5.0,
            "soil_moisture": 55,
            "temperature": 26,
            "rainfall": 120
        }
    ):
        tests_passed += 1
    
    # Test 5: Waterlogged conditions
    tests_total += 1
    if test_analyzer(
        "Waterlogged Conditions",
        {
            "ndvi": 0.30,
            "soil_ph": 6.5,
            "soil_moisture": 95,
            "temperature": 24,
            "rainfall": 450
        }
    ):
        tests_passed += 1
    
    # Test 6: Missing fields (should use defaults)
    tests_total += 1
    if test_analyzer(
        "Missing Fields (Defaults)",
        {
            "ndvi": 0.45,
            "soil_ph": 6.0
            # Missing: soil_moisture, temperature, rainfall
        }
    ):
        tests_passed += 1
    
    # Test 7: Invalid JSON (error handling)
    tests_total += 1
    print(f"\n{'=' * 70}")
    print("TEST: Invalid JSON (Error Handling)")
    print(f"{'=' * 70}")
    result = subprocess.run(
        ['python', 'site_analyzer.py', '{invalid json}'],
        capture_output=True,
        text=True
    )
    print("Output:")
    print(result.stdout)
    if "error" in result.stdout.lower():
        tests_passed += 1
        print("✓ Error handled correctly")
    
    # Summary
    print(f"\n{'=' * 70}")
    print(f"TEST SUMMARY: {tests_passed}/{tests_total} tests passed")
    print(f"{'=' * 70}")
    
    return 0 if tests_passed == tests_total else 1


if __name__ == "__main__":
    sys.exit(main())
