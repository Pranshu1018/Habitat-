// Enterprise Workflow Service - Strategic Site & Species Matching
// Follows exact: Planning → Planting → Monitoring → Prediction → Intervention → Reporting → Repeat

import axios from 'axios';
import NodeCache from 'node-cache';

class EnterpriseWorkflowService {
  constructor() {
    this.cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache
  }

  // STEP 1: Strategic Site & Species Matching (Main Entry Point)
  async analyzeSiteForRestoration(coordinates) {
    const { lat, lng, regionName } = coordinates;
    
    console.log(`🌍 Starting Enterprise Workflow for: ${regionName || `${lat}, ${lng}`}`);
    
    try {
      // Step 1: Map interaction already done - we have coordinates
      const workflow = {
        step1: { status: 'completed', data: { lat, lng, regionName } },
        step2: await this.fetchSatelliteVegetationData(lat, lng),
        step3: await this.analyzeSoilAndClimate(lat, lng),
        step4: await this.generateNativeSpeciesRecommendations(lat, lng),
        summary: {}
      };

      // Generate overall summary
      workflow.summary = this.generateRestorationSummary(workflow);
      
      return workflow;
    } catch (error) {
      console.error('Enterprise workflow error:', error);
      throw new Error(`Workflow failed: ${error.message}`);
    }
  }

  // STEP 2: Fetch Satellite Vegetation & Land Data
  async fetchSatelliteVegetationData(lat, lng) {
    console.log('🛰️ Step 2: Fetching Satellite Vegetation & Land Data');
    
    try {
      // In production: Copernicus Sentinel-2, ISRO Bhuvan
      // For demo: Enhanced mock with realistic patterns
      const vegetationData = {
        // NDVI Analysis
        ndvi: this.calculateNDVI(lat, lng),
        ndviTrend: this.calculateNDVITrend(lat, lng),
        
        // Land Cover Classification
        landCover: this.classifyLandCover(lat, lng),
        landUseHistory: this.getLandUseHistory(lat, lng),
        
        // Deforestation Analysis
        deforestationZones: this.identifyDeforestationZones(lat, lng),
        degradationLevel: this.assessDegradationLevel(lat, lng),
        
        // Priority Calculation
        restorationPriority: this.calculateRestorationPriority(lat, lng),
        
        metadata: {
          sources: ['Sentinel-2 (mock)', 'ISRO Bhuvan (mock)'],
          lastUpdated: new Date().toISOString(),
          confidence: 0.85
        }
      };

      console.log(`✅ NDVI: ${vegetationData.ndvi.toFixed(3)}, Priority: ${vegetationData.restorationPriority}`);
      return { status: 'completed', data: vegetationData };
    } catch (error) {
      console.error('Satellite data error:', error);
      return { status: 'failed', error: error.message };
    }
  }

  // STEP 3: Soil & Climate Analysis
  async analyzeSoilAndClimate(lat, lng) {
    console.log('🌱 Step 3: Soil & Climate Analysis');
    
    try {
      // Parallel fetching of soil and climate data
      const [soilData, climateData] = await Promise.all([
        this.fetchSoilGridsData(lat, lng),
        this.fetchWorldClimData(lat, lng)
      ]);

      const analysis = {
        // Soil Variables
        soil: {
          ph: soilData.ph,
          nitrogen: soilData.nitrogen,
          phosphorus: soilData.phosphorus,
          potassium: soilData.potassium,
          texture: soilData.texture,
          moistureCapacity: soilData.moistureCapacity,
          organicMatter: soilData.organicMatter,
          suitability: this.assessSoilSuitability(soilData)
        },
        
        // Climate Variables
        climate: {
          avgRainfall: climateData.avgRainfall,
          temperatureRange: climateData.temperatureRange,
          seasonality: climateData.seasonality,
          droughtRisk: climateData.droughtRisk,
          growingSeason: climateData.growingSeason,
          frostDays: climateData.frostDays,
          suitability: this.assessClimateSuitability(climateData)
        },
        
        // Combined Analysis
        combinedSuitability: this.calculateCombinedSuitability(soilData, climateData),
        
        metadata: {
          sources: ['SoilGrids', 'WorldClim'],
          lastUpdated: new Date().toISOString(),
          confidence: 0.90
        }
      };

      console.log(`✅ Soil pH: ${analysis.soil.ph}, Rainfall: ${analysis.climate.avgRainfall}mm`);
      return { status: 'completed', data: analysis };
    } catch (error) {
      console.error('Soil/Climate analysis error:', error);
      return { status: 'failed', error: error.message };
    }
  }

  // STEP 4: Native Species Recommendation Engine
  async generateNativeSpeciesRecommendations(lat, lng) {
    console.log('🌿 Step 4: Native Species Recommendation Engine');
    
    try {
      // Get context from previous steps
      const soilData = await this.fetchSoilGridsData(lat, lng);
      const climateData = await this.fetchWorldClimData(lat, lng);
      const vegetationData = this.calculateNDVI(lat, lng);
      
      // Forest Survey of India species database (mock)
      const nativeSpeciesDatabase = this.getNativeSpeciesDatabase();
      
      // Rule-based recommendation engine
      const recommendations = this.applySpeciesRecommendationRules(
        nativeSpeciesDatabase,
        soilData,
        climateData,
        vegetationData
      );

      const result = {
        recommendedSpecies: recommendations,
        analysisContext: {
          soilConditions: soilData,
          climateConditions: climateData,
          vegetationHealth: vegetationData,
          region: this.identifyEcoregion(lat, lng)
        },
        metadata: {
          source: 'Forest Survey of India (mock)',
          methodology: 'Rule-based ecological compatibility analysis',
          lastUpdated: new Date().toISOString()
        }
      };

      console.log(`✅ Recommended ${recommendations.length} species`);
      return { status: 'completed', data: result };
    } catch (error) {
      console.error('Species recommendation error:', error);
      return { status: 'failed', error: error.message };
    }
  }

  // Helper Methods for Satellite Analysis
  calculateNDVI(lat, lng) {
    // Realistic NDVI based on latitude and regional patterns
    const baseNDVI = Math.abs(lat) < 10 ? 0.75 : 
                    Math.abs(lat) < 20 ? 0.65 : 
                    Math.abs(lat) < 30 ? 0.45 : 0.35;
    
    // Add some variation based on longitude (regional differences)
    const lngVariation = Math.sin(lng * 0.1) * 0.1;
    
    return Math.max(0.1, Math.min(0.9, baseNDVI + lngVariation));
  }

  calculateNDVITrend(lat, lng) {
    // Simulate historical trend (-5% to +5%)
    return (Math.random() - 0.5) * 10;
  }

  classifyLandCover(lat, lng) {
    const ndvi = this.calculateNDVI(lat, lng);
    
    if (ndvi > 0.6) return { type: 'dense_forest', percentage: 70 };
    if (ndvi > 0.4) return { type: 'open_forest', percentage: 50 };
    if (ndvi > 0.2) return { type: 'grassland', percentage: 30 };
    return { type: 'degraded_barren', percentage: 10 };
  }

  getLandUseHistory(lat, lng) {
    return {
      forestCover_2000: 45 + Math.random() * 20,
      forestCover_2010: 35 + Math.random() * 20,
      forestCover_2020: 25 + Math.random() * 20,
      forestCover_2024: this.calculateNDVI(lat, lng) * 100,
      deforestationRate: -2 + Math.random() * 3 // % per year
    };
  }

  identifyDeforestationZones(lat, lng) {
    const trend = this.calculateNDVITrend(lat, lng);
    return {
      isDeforestationHotspot: trend < -2,
      severity: trend < -3 ? 'high' : trend < -1 ? 'medium' : 'low',
      affectedArea: Math.abs(trend) * 10 // hectares
    };
  }

  assessDegradationLevel(lat, lng) {
    const ndvi = this.calculateNDVI(lat, lng);
    const trend = this.calculateNDVITrend(lat, lng);
    
    if (ndvi < 0.2 && trend < -2) return 'severe';
    if (ndvi < 0.4 && trend < -1) return 'moderate';
    if (ndvi < 0.6) return 'low';
    return 'minimal';
  }

  calculateRestorationPriority(lat, lng) {
    const ndvi = this.calculateNDVI(lat, lng);
    const degradation = this.assessDegradationLevel(lat, lng);
    const deforestation = this.identifyDeforestationZones(lat, lng);
    
    let priority = 0;
    
    // Low NDVI increases priority
    if (ndvi < 0.2) priority += 40;
    else if (ndvi < 0.4) priority += 25;
    else if (ndvi < 0.6) priority += 10;
    
    // Degradation level increases priority
    if (degradation === 'severe') priority += 30;
    else if (degradation === 'moderate') priority += 20;
    else if (degradation === 'low') priority += 10;
    
    // Deforestation hotspots get highest priority
    if (deforestation.isDeforestationHotspot) priority += 30;
    
    return Math.min(100, priority);
  }

  // Helper Methods for Soil Analysis
  async fetchSoilGridsData(lat, lng) {
    // Mock SoilGrids data with realistic patterns
    return {
      ph: 5.5 + Math.random() * 2, // 5.5-7.5
      nitrogen: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      phosphorus: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      potassium: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      texture: ['sandy', 'loamy', 'clay'][Math.floor(Math.random() * 3)],
      moistureCapacity: 30 + Math.random() * 40, // 30-70%
      organicMatter: 1 + Math.random() * 3, // 1-4%
      source: 'SoilGrids API (mock)'
    };
  }

  assessSoilSuitability(soilData) {
    let score = 0;
    
    // pH suitability (6.0-7.0 is optimal)
    if (soilData.ph >= 6.0 && soilData.ph <= 7.0) score += 30;
    else if (soilData.ph >= 5.5 && soilData.ph <= 7.5) score += 20;
    else score += 10;
    
    // Nutrient levels
    const nutrientScores = { 'high': 20, 'medium': 15, 'low': 8 };
    score += nutrientScores[soilData.nitrogen] || 10;
    score += nutrientScores[soilData.phosphorus] || 10;
    score += nutrientScores[soilData.potassium] || 10;
    
    // Organic matter
    if (soilData.organicMatter > 2.5) score += 15;
    else if (soilData.organicMatter > 1.5) score += 10;
    else score += 5;
    
    return Math.min(100, score);
  }

  // Helper Methods for Climate Analysis
  async fetchWorldClimData(lat, lng) {
    // Mock WorldClim data with realistic patterns
    const isTropical = Math.abs(lat) < 23.5;
    const isEquatorial = Math.abs(lat) < 10;
    
    return {
      avgRainfall: isEquatorial ? 2000 + Math.random() * 1000 :
                  isTropical ? 1200 + Math.random() * 800 :
                  600 + Math.random() * 600,
      temperatureRange: {
        min: isEquatorial ? 22 : isTropical ? 18 : 12,
        max: isEquatorial ? 32 : isTropical ? 35 : 28,
        mean: isEquatorial ? 27 : isTropical ? 25 : 20
      },
      seasonality: isEquatorial ? 'bimodal' : 'monsoonal',
      droughtRisk: isEquatorial ? 'low' : 'medium',
      growingSeason: isEquatorial ? 365 : isTropical ? 240 : 180,
      frostDays: isEquatorial ? 0 : isTropical ? 5 : 30,
      source: 'WorldClim API (mock)'
    };
  }

  assessClimateSuitability(climateData) {
    let score = 0;
    
    // Rainfall suitability
    if (climateData.avgRainfall > 1500) score += 30;
    else if (climateData.avgRainfall > 1000) score += 25;
    else if (climateData.avgRainfall > 600) score += 15;
    else score += 5;
    
    // Temperature suitability
    const meanTemp = climateData.temperatureRange.mean;
    if (meanTemp >= 22 && meanTemp <= 30) score += 30;
    else if (meanTemp >= 18 && meanTemp <= 35) score += 20;
    else score += 10;
    
    // Growing season
    if (climateData.growingSeason > 300) score += 20;
    else if (climateData.growingSeason > 200) score += 15;
    else score += 5;
    
    // Low drought risk gets bonus
    if (climateData.droughtRisk === 'low') score += 20;
    else if (climateData.droughtRisk === 'medium') score += 10;
    
    return Math.min(100, score);
  }

  calculateCombinedSuitability(soilData, climateData) {
    const soilScore = this.assessSoilSuitability(soilData);
    const climateScore = this.assessClimateSuitability(climateData);
    
    // Weighted combination (60% soil, 40% climate for planting)
    return Math.round(soilScore * 0.6 + climateScore * 0.4);
  }

  // Native Species Database (Forest Survey of India - Mock)
  getNativeSpeciesDatabase() {
    return [
      {
        name: 'Teak',
        scientificName: 'Tectona grandis',
        nativeRegions: ['central_india', 'western_ghats', 'eastern_himalayas'],
        requirements: {
          phRange: [6.0, 7.5],
          rainfallRange: [1200, 2500],
          temperatureRange: [22, 35],
          soilTypes: ['loamy', 'clay'],
          droughtTolerance: 'low'
        },
        characteristics: {
          growthRate: 'medium',
          maturityYears: 20,
          height: 30,
          woodValue: 'very_high',
          ecologicalValue: 8,
          carbonSequestration: 15.0
        },
        uses: ['timber', 'construction', 'furniture'],
        plantingSeason: 'monsoon'
      },
      {
        name: 'Sal',
        scientificName: 'Shorea robusta',
        nativeRegions: ['central_india', 'eastern_india', 'himalayan_foothills'],
        requirements: {
          phRange: [5.5, 7.0],
          rainfallRange: [1000, 2000],
          temperatureRange: [18, 30],
          soilTypes: ['loamy', 'sandy_loam'],
          droughtTolerance: 'medium'
        },
        characteristics: {
          growthRate: 'slow',
          maturityYears: 25,
          height: 25,
          woodValue: 'high',
          ecologicalValue: 9,
          carbonSequestration: 12.0
        },
        uses: ['timber', 'resin', 'medicinal'],
        plantingSeason: 'monsoon'
      },
      {
        name: 'Neem',
        scientificName: 'Azadirachta indica',
        nativeRegions: ['peninsular_india', 'dry_zones'],
        requirements: {
          phRange: [5.5, 8.0],
          rainfallRange: [400, 1200],
          temperatureRange: [20, 40],
          soilTypes: ['sandy', 'loamy', 'clay'],
          droughtTolerance: 'very_high'
        },
        characteristics: {
          growthRate: 'fast',
          maturityYears: 5,
          height: 15,
          woodValue: 'medium',
          ecologicalValue: 7,
          carbonSequestration: 8.5
        },
        uses: ['medicinal', 'shade', 'pest_control'],
        plantingSeason: 'pre_monsoon'
      },
      {
        name: 'Acacia',
        scientificName: 'Acacia nilotica',
        nativeRegions: ['arid_zones', 'peninsular_india'],
        requirements: {
          phRange: [6.0, 8.5],
          rainfallRange: [300, 800],
          temperatureRange: [20, 45],
          soilTypes: ['sandy', 'clay'],
          droughtTolerance: 'very_high'
        },
        characteristics: {
          growthRate: 'fast',
          maturityYears: 4,
          height: 8,
          woodValue: 'medium',
          ecologicalValue: 6,
          carbonSequestration: 6.2
        },
        uses: ['fuelwood', 'soil_stabilization', 'fodder'],
        plantingSeason: 'monsoon'
      },
      {
        name: 'Bamboo',
        scientificName: 'Dendrocalamus strictus',
        nativeRegions: ['western_ghats', 'eastern_india', 'northeast'],
        requirements: {
          phRange: [5.0, 7.5],
          rainfallRange: [1000, 3000],
          temperatureRange: [15, 35],
          soilTypes: ['loamy', 'clay_loam'],
          droughtTolerance: 'medium'
        },
        characteristics: {
          growthRate: 'very_fast',
          maturityYears: 3,
          height: 20,
          woodValue: 'high',
          ecologicalValue: 8,
          carbonSequestration: 10.0
        },
        uses: ['construction', 'handicrafts', 'soil_conservatio'],
        plantingSeason: 'monsoon'
      }
    ];
  }

  // Rule-based Species Recommendation Engine
  applySpeciesRecommendationRules(speciesDatabase, soilData, climateData, ndvi) {
    const recommendations = [];
    
    for (const species of speciesDatabase) {
      const compatibility = this.checkSpeciesCompatibility(species, soilData, climateData);
      const survivalProbability = this.calculateSurvivalProbability(compatibility);
      const priority = this.calculateSpeciesPriority(species, survivalProbability, ndvi);
      
      if (survivalProbability > 30) { // Only include viable species
        recommendations.push({
          ...species,
          survivalProbability: Math.round(survivalProbability),
          priority: Math.round(priority),
          compatibility,
          reasoning: this.generateSpeciesReasoning(species, compatibility, survivalProbability),
          waterRequirements: this.getWaterRequirements(species, climateData),
          careLevel: this.getCareLevel(species),
          expectedBenefits: this.getExpectedBenefits(species)
        });
      }
    }
    
    // Sort by priority (highest first)
    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  checkSpeciesCompatibility(species, soilData, climateData) {
    return {
      phCompatible: soilData.ph >= species.requirements.phRange[0] && 
                     soilData.ph <= species.requirements.phRange[1],
      rainfallCompatible: climateData.avgRainfall >= species.requirements.rainfallRange[0] && 
                          climateData.avgRainfall <= species.requirements.rainfallRange[1],
      temperatureCompatible: climateData.temperatureRange.mean >= species.requirements.temperatureRange[0] && 
                            climateData.temperatureRange.mean <= species.requirements.temperatureRange[1],
      soilCompatible: species.requirements.soilTypes.includes(soilData.texture),
      droughtCompatible: this.assessDroughtCompatibility(species.requirements.droughtTolerance, climateData.droughtRisk)
    };
  }

  assessDroughtCompatibility(speciesTolerance, climateRisk) {
    const toleranceLevels = { 'low': 1, 'medium': 2, 'high': 3, 'very_high': 4 };
    const riskLevels = { 'low': 1, 'medium': 2, 'high': 3 };
    
    return toleranceLevels[speciesTolerance] >= riskLevels[climateRisk];
  }

  calculateSurvivalProbability(compatibility) {
    let probability = 0;
    
    // Base probability from compatibility factors
    if (compatibility.phCompatible) probability += 25;
    if (compatibility.rainfallCompatible) probability += 25;
    if (compatibility.temperatureCompatible) probability += 20;
    if (compatibility.soilCompatible) probability += 15;
    if (compatibility.droughtCompatible) probability += 15;
    
    return Math.min(95, probability);
  }

  calculateSpeciesPriority(species, survivalProbability, ndvi) {
    let priority = survivalProbability;
    
    // Boost priority for fast-growing species in degraded areas
    if (ndvi < 0.3 && species.characteristics.growthRate === 'very_fast') priority += 15;
    else if (ndvi < 0.4 && species.characteristics.growthRate === 'fast') priority += 10;
    
    // Boost priority for high ecological value
    if (species.characteristics.ecologicalValue > 8) priority += 10;
    
    // Boost priority for high carbon sequestration
    if (species.characteristics.carbonSequestration > 12) priority += 5;
    
    return Math.min(100, priority);
  }

  generateSpeciesReasoning(species, compatibility, survivalProbability) {
    let reasoning = `Recommended with ${survivalProbability}% survival probability. `;
    
    const reasons = [];
    
    if (compatibility.phCompatible) reasons.push('optimal soil pH conditions');
    if (compatibility.rainfallCompatible) reasons.push('suitable rainfall patterns');
    if (compatibility.temperatureCompatible) reasons.push('appropriate temperature range');
    if (compatibility.soilCompatible) reasons.push('compatible soil type');
    if (compatibility.droughtCompatible) reasons.push('adequate drought tolerance');
    
    if (species.characteristics.growthRate === 'very_fast') reasons.push('very fast growth for quick results');
    if (species.characteristics.ecologicalValue > 8) reasons.push('high ecological value for biodiversity');
    if (species.characteristics.carbonSequestration > 12) reasons.push('excellent carbon sequestration potential');
    
    reasoning += reasons.join(', ') + '.';
    
    return reasoning;
  }

  getWaterRequirements(species, climateData) {
    const rainfall = climateData.avgRainfall;
    const speciesRequirement = species.requirements.rainfallRange[1];
    
    if (rainfall >= speciesRequirement) return 'natural_rainfall_sufficient';
    if (rainfall >= speciesRequirement * 0.8) return 'minimal_supplement_needed';
    if (rainfall >= speciesRequirement * 0.6) return 'moderate_irrigation_needed';
    return 'intensive_irrigation_needed';
  }

  getCareLevel(species) {
    if (species.requirements.droughtTolerance === 'very_high') return 'low';
    if (species.requirements.droughtTolerance === 'high') return 'medium';
    return 'high';
  }

  getExpectedBenefits(species) {
    const benefits = [];
    
    if (species.characteristics.woodValue === 'very_high') benefits.push('premium timber production');
    if (species.characteristics.woodValue === 'high') benefits.push('quality timber production');
    if (species.uses.includes('medicinal')) benefits.push('medicinal plant resources');
    if (species.uses.includes('shade')) benefits.push('shade and temperature regulation');
    if (species.characteristics.ecologicalValue > 8) benefits.push('wildlife habitat creation');
    if (species.characteristics.carbonSequestration > 10) benefits.push('significant carbon storage');
    
    return benefits;
  }

  identifyEcoregion(lat, lng) {
    if (Math.abs(lat) < 10) return 'tropical_wet';
    if (Math.abs(lat) < 20) return 'tropical_dry';
    if (Math.abs(lat) < 30) return 'subtropical';
    return 'temperate';
  }

  generateRestorationSummary(workflow) {
    const step2 = workflow.step2.data || {};
    const step3 = workflow.step3.data || {};
    const step4 = workflow.step4.data || {};
    
    return {
      siteCoordinates: workflow.step1.data,
      restorationPriority: step2.restorationPriority || 0,
      landCondition: {
        degradationLevel: step2.degradationLevel || 'unknown',
        vegetationHealth: step2.ndvi || 0,
        landCoverType: step2.landCover?.type || 'unknown'
      },
      environmentalConditions: {
        soilSuitability: step3.combinedSuitability || 0,
        climateRisk: step3.climate?.droughtRisk || 'unknown',
        growingSeason: step3.climate?.growingSeason || 0
      },
      recommendations: {
        topSpecies: step4.recommendedSpecies?.slice(0, 3) || [],
        totalViableSpecies: step4.recommendedSpecies?.length || 0,
        averageSurvivalRate: this.calculateAverageSurvivalRate(step4.recommendedSpecies || [])
      },
      nextSteps: this.generateNextSteps(workflow),
      estimatedTimeline: this.generateTimeline(workflow),
      confidence: this.calculateOverallConfidence(workflow)
    };
  }

  calculateAverageSurvivalRate(species) {
    if (!species.length) return 0;
    const total = species.reduce((sum, s) => sum + s.survivalProbability, 0);
    return Math.round(total / species.length);
  }

  generateNextSteps(workflow) {
    const priority = workflow.step2.data?.restorationPriority || 0;
    const steps = [];
    
    if (priority > 70) {
      steps.push('Immediate site preparation required');
      steps.push('Priority species procurement');
    } else if (priority > 40) {
      steps.push('Site assessment within 1 month');
      steps.push('Species nursery preparation');
    } else {
      steps.push('Routine monitoring recommended');
      steps.push('Long-term planning phase');
    }
    
    return steps;
  }

  generateTimeline(workflow) {
    const priority = workflow.step2.data?.restorationPriority || 0;
    const species = workflow.step4.data?.recommendedSpecies || [];
    
    const fastestGrowth = Math.min(...species.map(s => 
      s.characteristics.growthRate === 'very_fast' ? 1 :
      s.characteristics.growthRate === 'fast' ? 2 :
      s.characteristics.growthRate === 'medium' ? 3 : 5
    ));
    
    return {
      planning: priority > 70 ? '1 month' : '3 months',
      planting: 'next monsoon season',
      establishment: `${fastestGrowth * 2} years`,
      maturity: '10-25 years depending on species'
    };
  }

  calculateOverallConfidence(workflow) {
    const confidences = [];
    
    if (workflow.step2.data?.metadata?.confidence) confidences.push(workflow.step2.data.metadata.confidence);
    if (workflow.step3.data?.metadata?.confidence) confidences.push(workflow.step3.data.metadata.confidence);
    if (workflow.step4.data?.metadata) confidences.push(0.9); // Rule-based = high confidence
    
    if (!confidences.length) return 0.8;
    const average = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
    return Math.round(average * 100) / 100;
  }
}

export default new EnterpriseWorkflowService();
