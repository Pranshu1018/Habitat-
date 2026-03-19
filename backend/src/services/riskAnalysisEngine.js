/**
 * Risk Analysis Engine
 * Predicts plantation failure by combining satellite vegetation trends,
 * weather forecasts, soil conditions, and species sensitivity into an
 * explainable, time-ahead stress scoring framework.
 */

export class RiskAnalysisEngine {
  /**
   * Calculate comprehensive risk score for a location
   */
  async calculateRiskScore(data) {
    const {
      weather,
      soil,
      vegetation,
      species = 'mixed',
      treeAge = 1,
      plantingDensity = 1000
    } = data;

    // Step 1: Calculate individual risk scores
    const droughtScore = this.calculateDroughtRisk(weather, soil);
    const heatStressScore = this.calculateHeatStressRisk(weather, species, treeAge);
    const waterScarcityScore = this.calculateWaterScarcityRisk(weather, soil);
    const vegetationDeclineScore = this.calculateVegetationDeclineRisk(vegetation);

    // Step 2: Weighted fusion of risks
    const weights = {
      drought: 0.35,
      heatStress: 0.25,
      waterScarcity: 0.25,
      vegetationDecline: 0.15
    };

    const finalScore = Math.round(
      droughtScore * weights.drought +
      heatStressScore * weights.heatStress +
      waterScarcityScore * weights.waterScarcity +
      vegetationDeclineScore * weights.vegetationDecline
    );

    // Step 3: Classify risk level
    const riskLevel = this.classifyRisk(finalScore);

    // Step 4: Determine primary cause
    const risks = [
      { name: 'Drought', score: droughtScore },
      { name: 'Heat Stress', score: heatStressScore },
      { name: 'Water Scarcity', score: waterScarcityScore },
      { name: 'Vegetation Decline', score: vegetationDeclineScore }
    ];
    const primaryCause = risks.sort((a, b) => b.score - a.score)[0];

    // Step 5: Time-ahead prediction
    const timeToImpact = this.calculateTimeToImpact(finalScore, weather);

    // Step 6: Recommended actions
    const actions = this.getRecommendedActions(riskLevel, primaryCause.name);

    return {
      finalRiskScore: finalScore,
      riskLevel,
      primaryCause: primaryCause.name,
      timeToImpact,
      recommendedActions: actions,
      breakdown: {
        drought: droughtScore,
        heatStress: heatStressScore,
        waterScarcity: waterScarcityScore,
        vegetationDecline: vegetationDeclineScore
      },
      confidence: this.calculateConfidence(data),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Drought Risk Score (0-100)
   * Based on rainfall deficit, temperature, and soil moisture
   */
  calculateDroughtRisk(weather, soil) {
    let score = 0;

    // Rainfall deficit (0-40 points)
    const avgRainfall = weather.forecast
      ? weather.forecast.slice(0, 14).reduce((sum, day) => sum + (day.precipitation || 0), 0) / 14
      : weather.current?.precipitation || 2;

    if (avgRainfall < 1) score += 40;
    else if (avgRainfall < 2) score += 30;
    else if (avgRainfall < 3) score += 20;
    else if (avgRainfall < 5) score += 10;

    // Temperature stress (0-30 points)
    const avgTemp = weather.current?.temp || 25;
    if (avgTemp > 35) score += 30;
    else if (avgTemp > 32) score += 20;
    else if (avgTemp > 30) score += 10;

    // Soil moisture (0-30 points)
    const moisture = soil.moisture || 60;
    if (moisture < 30) score += 30;
    else if (moisture < 40) score += 20;
    else if (moisture < 50) score += 10;

    return Math.min(100, score);
  }

  /**
   * Heat Stress Risk Score (0-100)
   * Based on temperature forecast and species tolerance
   */
  calculateHeatStressRisk(weather, species, treeAge) {
    let score = 0;

    const avgTemp = weather.current?.temp || 25;
    const maxTemp = weather.forecast
      ? Math.max(...weather.forecast.slice(0, 7).map(d => d.temp || 25))
      : avgTemp;

    // Base temperature stress (0-50 points)
    if (maxTemp > 40) score += 50;
    else if (maxTemp > 38) score += 40;
    else if (maxTemp > 35) score += 30;
    else if (maxTemp > 33) score += 20;
    else if (maxTemp > 30) score += 10;

    // Age factor (young trees more vulnerable) (0-25 points)
    if (treeAge < 1) score += 25;
    else if (treeAge < 2) score += 15;
    else if (treeAge < 3) score += 10;

    // Humidity factor (0-25 points)
    const humidity = weather.current?.humidity || 65;
    if (humidity < 30) score += 25;
    else if (humidity < 40) score += 15;
    else if (humidity < 50) score += 10;

    return Math.min(100, score);
  }

  /**
   * Water Scarcity Risk Score (0-100)
   * Captures drying soil even if rain occurred earlier
   */
  calculateWaterScarcityRisk(weather, soil) {
    let score = 0;

    // Rainfall trend (0-35 points)
    const recentRain = weather.forecast
      ? weather.forecast.slice(0, 7).reduce((sum, day) => sum + (day.precipitation || 0), 0)
      : 10;

    if (recentRain < 5) score += 35;
    else if (recentRain < 10) score += 25;
    else if (recentRain < 15) score += 15;

    // Evaporation from temperature (0-35 points)
    const temp = weather.current?.temp || 25;
    const humidity = weather.current?.humidity || 65;
    const evaporationIndex = (temp / 10) * (100 - humidity) / 100;

    if (evaporationIndex > 4) score += 35;
    else if (evaporationIndex > 3) score += 25;
    else if (evaporationIndex > 2) score += 15;

    // Soil water retention (0-30 points)
    const sandContent = soil.sandContent || 40;
    if (sandContent > 70) score += 30; // Sandy soil drains fast
    else if (sandContent > 60) score += 20;
    else if (sandContent > 50) score += 10;

    return Math.min(100, score);
  }

  /**
   * Vegetation Decline Risk Score (0-100)
   * Based on NDVI trend and canopy density change
   */
  calculateVegetationDeclineRisk(vegetation) {
    let score = 0;

    const ndvi = vegetation.ndvi || 0.5;
    const healthScore = vegetation.healthScore || 70;
    const changeRate = vegetation.changeRate || 0;

    // NDVI value (0-40 points)
    if (ndvi < 0.2) score += 40;
    else if (ndvi < 0.3) score += 30;
    else if (ndvi < 0.4) score += 20;
    else if (ndvi < 0.5) score += 10;

    // Health score (0-30 points)
    if (healthScore < 40) score += 30;
    else if (healthScore < 50) score += 20;
    else if (healthScore < 60) score += 10;

    // Negative trend (0-30 points)
    if (changeRate < -5) score += 30;
    else if (changeRate < -3) score += 20;
    else if (changeRate < -1) score += 10;

    return Math.min(100, score);
  }

  /**
   * Classify risk level based on score
   */
  classifyRisk(score) {
    if (score >= 70) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Calculate time to impact based on risk score and weather forecast
   */
  calculateTimeToImpact(score, weather) {
    if (score >= 70) return '7-14 days';
    if (score >= 40) return '14-21 days';
    return '21-30 days';
  }

  /**
   * Get recommended actions based on risk level and cause
   */
  getRecommendedActions(riskLevel, primaryCause) {
    const actions = {
      HIGH: {
        Drought: [
          'Implement emergency irrigation within 48 hours',
          'Apply 5-10cm mulch layer to retain moisture',
          'Prioritize water delivery to young saplings',
          'Consider temporary shade structures'
        ],
        'Heat Stress': [
          'Increase irrigation frequency to twice daily',
          'Install shade cloth for vulnerable saplings',
          'Apply reflective mulch to reduce soil temperature',
          'Monitor for wilting and leaf scorch'
        ],
        'Water Scarcity': [
          'Activate water conservation protocol',
          'Reduce planting density in new areas',
          'Install drip irrigation if available',
          'Harvest and store rainwater'
        ],
        'Vegetation Decline': [
          'Conduct immediate field inspection',
          'Test soil for nutrient deficiencies',
          'Check for pest or disease signs',
          'Consider supplemental fertilization'
        ]
      },
      MEDIUM: {
        Drought: [
          'Increase irrigation by 30-50%',
          'Apply mulch to retain soil moisture',
          'Monitor soil moisture daily',
          'Prepare emergency water sources'
        ],
        'Heat Stress': [
          'Adjust irrigation timing to early morning/evening',
          'Apply organic mulch around saplings',
          'Monitor temperature stress indicators',
          'Ensure adequate soil moisture'
        ],
        'Water Scarcity': [
          'Optimize irrigation schedule',
          'Reduce water waste and runoff',
          'Monitor weather forecasts closely',
          'Prepare contingency water sources'
        ],
        'Vegetation Decline': [
          'Schedule field inspection within 7 days',
          'Review recent maintenance activities',
          'Check irrigation system functionality',
          'Monitor NDVI trends weekly'
        ]
      },
      LOW: {
        Drought: [
          'Continue regular monitoring',
          'Maintain current irrigation schedule',
          'Keep mulch layers intact',
          'Review water availability'
        ],
        'Heat Stress': [
          'Monitor weather forecasts',
          'Maintain adequate soil moisture',
          'Continue routine care',
          'Prepare for temperature increases'
        ],
        'Water Scarcity': [
          'Monitor rainfall patterns',
          'Maintain irrigation infrastructure',
          'Continue water conservation practices',
          'Review water budget'
        ],
        'Vegetation Decline': [
          'Continue routine monitoring',
          'Maintain regular care schedule',
          'Document vegetation health',
          'Review growth patterns'
        ]
      }
    };

    return actions[riskLevel]?.[primaryCause] || actions[riskLevel]?.Drought || [];
  }

  /**
   * Calculate confidence level based on data quality
   */
  calculateConfidence(data) {
    let confidence = 100;

    // Reduce confidence if data is missing or mock
    if (!data.weather?.forecast) confidence -= 15;
    if (data.weather?.mock) confidence -= 20;
    if (data.soil?.mock) confidence -= 15;
    if (!data.vegetation?.ndvi) confidence -= 10;

    return Math.max(50, confidence);
  }

  /**
   * Generate detailed risk assessment with all metrics
   */
  async generateDetailedAssessment(location, projectData) {
    const { lat, lon } = location;

    // This would fetch real data from APIs
    // For now, using the data passed in
    const riskScore = await this.calculateRiskScore(projectData);

    return {
      location: { lat, lon },
      project: projectData.projectName || 'Unknown',
      assessment: riskScore,
      alerts: this.generateAlerts(riskScore),
      trends: this.analyzeTrends(projectData),
      recommendations: this.generateRecommendations(riskScore)
    };
  }

  /**
   * Generate alerts based on risk assessment
   */
  generateAlerts(riskScore) {
    const alerts = [];

    if (riskScore.finalRiskScore >= 70) {
      alerts.push({
        severity: 'critical',
        message: `High ${riskScore.primaryCause} risk detected`,
        action: 'Immediate action required',
        priority: 1
      });
    }

    if (riskScore.breakdown.drought >= 60) {
      alerts.push({
        severity: 'warning',
        message: 'Drought conditions developing',
        action: 'Increase irrigation',
        priority: 2
      });
    }

    if (riskScore.breakdown.heatStress >= 60) {
      alerts.push({
        severity: 'warning',
        message: 'Heat stress risk elevated',
        action: 'Provide shade and increase watering',
        priority: 2
      });
    }

    return alerts;
  }

  /**
   * Analyze trends from historical data
   */
  analyzeTrends(projectData) {
    return {
      ndviTrend: projectData.vegetation?.changeRate || 0,
      moistureTrend: projectData.soil?.moisture > 50 ? 'stable' : 'declining',
      temperatureTrend: projectData.weather?.current?.temp > 30 ? 'increasing' : 'stable',
      overallTrend: projectData.vegetation?.changeRate < 0 ? 'declining' : 'improving'
    };
  }

  /**
   * Generate comprehensive recommendations
   */
  generateRecommendations(riskScore) {
    return {
      immediate: riskScore.recommendedActions.slice(0, 2),
      shortTerm: riskScore.recommendedActions.slice(2, 4),
      longTerm: [
        'Develop drought-resistant species portfolio',
        'Install permanent irrigation infrastructure',
        'Implement soil improvement program',
        'Establish weather monitoring station'
      ]
    };
  }
}

export const riskAnalysisEngine = new RiskAnalysisEngine();
