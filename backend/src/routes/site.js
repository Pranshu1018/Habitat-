import express from 'express';
import axios from 'axios';

const router = express.Router();

// Comprehensive site analysis with species matching
router.post('/analyze', async (req, res) => {
  try {
    const { lat, lng, name, hectares } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    // Fetch all environmental data in parallel
    const baseURL = `http://localhost:${process.env.PORT || 3001}/api`;
    
    const [weatherRes, soilRes, vegetationRes] = await Promise.all([
      axios.get(`${baseURL}/weather/current`, { params: { lat, lon: lng } }).catch(() => ({ data: {} })),
      axios.get(`${baseURL}/soil/data`, { params: { lat, lon: lng } }).catch(() => ({ data: {} })),
      axios.get(`${baseURL}/satellite/vegetation`, { params: { lat, lon: lng } }).catch(() => ({ data: {} }))
    ]);

    // Calculate comprehensive land suitability
    const landScoreResult = calculateLandSuitabilityScore(
      weatherRes.data,
      soilRes.data,
      vegetationRes.data
    );

    // Get species recommendations
    const recommendedSpecies = getSpeciesRecommendations(
      soilRes.data,
      weatherRes.data,
      vegetationRes.data,
      landScoreResult.overallScore
    );

    const analysis = {
      location: { lat, lng, name },
      landScore: landScoreResult.overallScore,
      priority: landScoreResult.priority,
      componentScores: landScoreResult.componentScores,
      weather: weatherRes.data,
      soil: soilRes.data,
      vegetation: vegetationRes.data,
      recommendedSpecies,
      metadata: {
        analysisDate: new Date().toISOString(),
        dataConfidence: {
          weather: weatherRes.data.cached ? 0.8 : 1.0,
          soil: soilRes.data.cached ? 0.9 : 1.0,
          vegetation: vegetationRes.data.cached ? 0.7 : 1.0
        },
        processingTime: Date.now() - performance.now()
      }
    };

    res.json(analysis);
  } catch (error) {
    console.error('Site analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze site' });
  }
});

function calculateLandSuitabilityScore(weather, soil, vegetation) {
  // Component scoring
  const soilScore = calculateSoilScore(soil);
  const climateScore = calculateClimateScore(weather);
  const vegetationScore = calculateVegetationScore(vegetation);

  // Weighted scoring (40% vegetation, 30% soil, 30% climate)
  const overallScore = Math.round(
    vegetationScore * 0.4 +
    soilScore * 0.3 +
    climateScore * 0.3
  );

  // Determine priority based on degradation and potential
  const priority = determinePriority(vegetation, overallScore);

  return {
    overallScore,
    priority,
    componentScores: {
      soil: soilScore,
      climate: climateScore,
      vegetation: vegetationScore
    }
  };
}

function calculateSoilScore(soil) {
  let score = 0;

  // pH scoring (optimal 6.0-7.0)
  if (soil.ph >= 6.0 && soil.ph <= 7.0) score += 25;
  else if (soil.ph >= 5.5 && soil.ph <= 7.5) score += 20;
  else if (soil.ph >= 5.0 && soil.ph <= 8.0) score += 15;
  else score += 10;

  // Nutrient scoring
  const nutrientScores = { 'high': 25, 'medium': 18, 'low': 10 };
  score += nutrientScores[soil.nitrogen] || 15;
  score += (nutrientScores[soil.phosphorus] || 15) * 0.8;
  score += (nutrientScores[soil.potassium] || 15) * 0.7;

  // Organic matter scoring
  if (soil.organicCarbon >= 3) score += 15;
  else if (soil.organicCarbon >= 2) score += 12;
  else if (soil.organicCarbon >= 1) score += 8;
  else score += 5;

  // Moisture scoring
  if (soil.moisture >= 60 && soil.moisture <= 80) score += 10;
  else if (soil.moisture >= 50 && soil.moisture <= 90) score += 8;
  else score += 5;

  return Math.min(100, Math.max(0, score));
}

function calculateClimateScore(weather) {
  let score = 0;

  if (!weather.current) return 50; // Default score if no weather data

  const temp = weather.current.temp;
  const humidity = weather.current.humidity;
  const precipitation = weather.current.precipitation || 0;

  // Temperature scoring (optimal 22-30°C)
  if (temp >= 22 && temp <= 30) score += 35;
  else if (temp >= 18 && temp <= 35) score += 25;
  else if (temp >= 15 && temp <= 40) score += 15;
  else score += 5;

  // Rainfall scoring
  if (precipitation >= 800 && precipitation <= 1500) score += 35;
  else if (precipitation >= 600 && precipitation <= 2000) score += 25;
  else if (precipitation >= 400 && precipitation <= 2500) score += 15;
  else score += 5;

  // Humidity scoring
  if (humidity >= 60 && humidity <= 80) score += 20;
  else if (humidity >= 50 && humidity <= 90) score += 15;
  else score += 10;

  // Wind scoring (lower is better)
  const windSpeed = weather.current.windSpeed || 0;
  if (windSpeed < 3) score += 10;
  else if (windSpeed < 6) score += 7;
  else score += 3;

  return Math.min(100, Math.max(0, score));
}

function calculateVegetationScore(vegetation) {
  let score = 0;

  if (!vegetation.ndvi) return 50; // Default score if no vegetation data

  const ndvi = vegetation.ndvi;

  // NDVI scoring
  if (ndvi >= 0.6) score += 40;
  else if (ndvi >= 0.4) score += 30;
  else if (ndvi >= 0.2) score += 20;
  else score += 10;

  // Health score
  if (vegetation.healthScore >= 70) score += 30;
  else if (vegetation.healthScore >= 50) score += 20;
  else if (vegetation.healthScore >= 30) score += 10;
  else score += 5;

  // Coverage scoring
  if (vegetation.coverage >= 60) score += 20;
  else if (vegetation.coverage >= 40) score += 15;
  else if (vegetation.coverage >= 20) score += 10;
  else score += 5;

  // Change rate (positive is good)
  if (vegetation.changeRate > 2) score += 10;
  else if (vegetation.changeRate > 0) score += 7;
  else if (vegetation.changeRate > -2) score += 3;
  else score += 0;

  return Math.min(100, Math.max(0, score));
}

function determinePriority(vegetation, overallScore) {
  const ndvi = vegetation.ndvi || 0.5;
  
  // High priority for degraded areas with good potential
  if (ndvi < 0.3 && overallScore > 40) {
    return 'High';
  }
  
  // Medium priority for moderately degraded areas
  if (ndvi < 0.5 && overallScore > 50) {
    return 'Medium';
  }

  // Low priority for already healthy areas or very poor conditions
  if (ndvi > 0.7 || overallScore < 30) {
    return 'Low';
  }

  return 'Medium';
}

function getSpeciesRecommendations(soil, weather, vegetation, landScore) {
  const speciesDatabase = [
    {
      name: 'Neem',
      scientificName: 'Azadirachta indica',
      phRange: [5.5, 7.5],
      rainfall: 'medium',
      droughtTolerance: 'high',
      growthRate: 'fast',
      maturityYears: 5,
      height: 15,
      uses: ['medicinal', 'shade', 'soil_improvement'],
      carbonSequestration: 8.5,
      biodiversityValue: 7
    },
    {
      name: 'Acacia Senegal',
      scientificName: 'Acacia senegal',
      phRange: [6.0, 8.5],
      rainfall: 'low',
      droughtTolerance: 'very_high',
      growthRate: 'medium',
      maturityYears: 4,
      height: 8,
      uses: ['gum_arabic', 'soil_stabilization', 'fodder'],
      carbonSequestration: 6.2,
      biodiversityValue: 6
    },
    {
      name: 'Baobab',
      scientificName: 'Adansonia digitata',
      phRange: [5.0, 7.0],
      rainfall: 'low',
      droughtTolerance: 'very_high',
      growthRate: 'slow',
      maturityYears: 20,
      height: 25,
      uses: ['fruit', 'medicinal', 'cultural'],
      carbonSequestration: 12.0,
      biodiversityValue: 9
    },
    {
      name: 'Moringa',
      scientificName: 'Moringa oleifera',
      phRange: [6.0, 8.0],
      rainfall: 'low',
      droughtTolerance: 'high',
      growthRate: 'very_fast',
      maturityYears: 2,
      height: 12,
      uses: ['nutrition', 'medicinal', 'water_purification'],
      carbonSequestration: 4.5,
      biodiversityValue: 5
    },
    {
      name: 'Teak',
      scientificName: 'Tectona grandis',
      phRange: [6.0, 7.5],
      rainfall: 'high',
      droughtTolerance: 'low',
      growthRate: 'medium',
      maturityYears: 20,
      height: 30,
      uses: ['timber', 'construction', 'furniture'],
      carbonSequestration: 15.0,
      biodiversityValue: 4
    }
  ];

  // Score each species based on compatibility
  const scoredSpecies = speciesDatabase.map(species => {
    const compatibility = checkSpeciesCompatibility(species, soil, weather, vegetation);
    const survivalProbability = calculateSurvivalProbability(compatibility);
    const matchScore = calculateMatchScore(species, survivalProbability);
    
    return {
      ...species,
      survivalProbability: Math.round(survivalProbability * 100),
      matchScore: Math.round(matchScore * 100),
      reason: generateReasoning(species, compatibility, survivalProbability),
      pros: generatePros(species, compatibility),
      cons: generateCons(species, compatibility),
      suitabilityFactors: compatibility
    };
  });

  // Filter and sort by match score
  return scoredSpecies
    .filter(species => species.survivalProbability > 30)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);
}

function checkSpeciesCompatibility(species, soil, weather, vegetation) {
  const factors = {
    ph: soil.ph && species.phRange[0] <= soil.ph && soil.ph <= species.phRange[1],
    rainfall: checkRainfallCompatibility(species, weather),
    drought: checkDroughtCompatibility(species, weather),
    temperature: checkTemperatureCompatibility(species, weather),
    soil: checkSoilTypeCompatibility(species, soil)
  };

  return factors;
}

function checkRainfallCompatibility(species, weather) {
  if (!weather.current) return true;
  const precipitation = weather.current.precipitation || 0;
  
  if (species.rainfall === 'low') return precipitation < 800;
  if (species.rainfall === 'medium') return precipitation >= 600 && precipitation <= 1500;
  if (species.rainfall === 'high') return precipitation > 1200;
  
  return true;
}

function checkDroughtCompatibility(species, weather) {
  // Simple drought assessment based on precipitation and humidity
  if (!weather.current) return true;
  
  const precipitation = weather.current.precipitation || 0;
  const humidity = weather.current.humidity || 50;
  
  const droughtRisk = precipitation < 400 || humidity < 40 ? 'high' : 
                     precipitation < 800 || humidity < 60 ? 'medium' : 'low';
  
  const toleranceLevels = { 'low': 1, 'medium': 2, 'high': 3, 'very_high': 4 };
  const riskLevels = { 'low': 1, 'medium': 2, 'high': 3 };
  
  return toleranceLevels[species.droughtTolerance] >= riskLevels[droughtRisk];
}

function checkTemperatureCompatibility(species, weather) {
  if (!weather.current) return true;
  
  const temp = weather.current.temp;
  
  // Most tropical species prefer 20-35°C
  return temp >= 15 && temp <= 40;
}

function checkSoilTypeCompatibility(species, soil) {
  // Simplified soil compatibility check
  return true; // For now, assume compatibility
}

function calculateSurvivalProbability(compatibility) {
  const factorScores = {
    ph: compatibility.ph ? 0.3 : 0.05,
    rainfall: compatibility.rainfall ? 0.25 : 0.05,
    drought: compatibility.drought ? 0.25 : 0.05,
    temperature: compatibility.temperature ? 0.15 : 0.05,
    soil: compatibility.soil ? 0.05 : 0.02
  };

  return Math.min(0.95, Object.values(factorScores).reduce((sum, score) => sum + score, 0));
}

function calculateMatchScore(species, survivalProbability) {
  const growthRateBonus = { 'very_fast': 0.1, 'fast': 0.08, 'medium': 0.05, 'slow': 0.02 }[species.growthRate] || 0;
  const carbonBonus = Math.min(0.1, species.carbonSequestration / 100);
  const biodiversityBonus = Math.min(0.05, species.biodiversityValue / 100);
  
  return survivalProbability + growthRateBonus + carbonBonus + biodiversityBonus;
}

function generateReasoning(species, compatibility, survivalProbability) {
  let reason = '';
  
  if (survivalProbability > 0.8) {
    reason = `Excellent match with ${Math.round(survivalProbability * 100)}% survival probability`;
  } else if (survivalProbability > 0.6) {
    reason = `Good match with ${Math.round(survivalProbability * 100)}% survival probability`;
  } else {
    reason = `Moderate match with ${Math.round(survivalProbability * 100)}% survival probability`;
  }

  if (species.droughtTolerance === 'very_high') {
    reason += `, exceptional drought tolerance`;
  }
  if (species.growthRate === 'very_fast') {
    reason += `, very fast growth for quick results`;
  }

  return reason;
}

function generatePros(species, compatibility) {
  const pros = [];
  
  if (compatibility.ph) pros.push('Optimal soil pH conditions');
  if (compatibility.rainfall) pros.push('Suitable rainfall patterns');
  if (compatibility.drought) pros.push('Good drought tolerance match');
  if (species.growthRate === 'fast' || species.growthRate === 'very_fast') {
    pros.push('Fast growth provides quick results');
  }
  if (species.carbonSequestration > 10) {
    pros.push('High carbon sequestration potential');
  }
  
  return pros;
}

function generateCons(species, compatibility) {
  const cons = [];
  
  if (!compatibility.ph) cons.push('Soil pH may require amendment');
  if (!compatibility.rainfall) cons.push('Rainfall conditions not ideal');
  if (!compatibility.drought) cons.push('May struggle in drought conditions');
  if (species.maturityYears > 10) cons.push('Long time to maturity');
  
  return cons;
}

export default router;
