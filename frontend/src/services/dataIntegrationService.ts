// Integrated Data Service - Orchestrates all data sources
import { weatherService, WeatherData } from './api/weatherService';
import { soilService, SoilData } from './api/soilService';
import { satelliteService, VegetationData, LandCoverData } from './api/satelliteService';
import { carbonCalculator, CarbonEstimate } from './analytics/carbonCalculator';
import { riskPredictor, RiskAssessment } from './analytics/riskPredictor';
import { speciesMatcher, SpeciesRecommendation } from './analytics/speciesMatcher';

export interface SiteAnalysis {
  location: {
    lat: number;
    lon: number;
    name: string;
  };
  weather: WeatherData;
  soil: SoilData;
  vegetation: VegetationData;
  landCover: LandCoverData;
  suitabilityScore: number;
  risks: RiskAssessment[];
  speciesRecommendations: SpeciesRecommendation[];
  carbonEstimate: CarbonEstimate;
  soilAmendments: string[];
  lastUpdated: string;
}

export interface SimulationScenario {
  type: 'drought' | 'flood' | 'heat' | 'species_failure';
  intensity: 'low' | 'medium' | 'high';
  duration: number; // days
}

class DataIntegrationService {
  private analysisCache = new Map<string, { data: SiteAnalysis; timestamp: number }>();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  /**
   * Comprehensive site analysis - integrates all data sources
   */
  async analyzeSite(
    lat: number,
    lon: number,
    name: string,
    hectares: number = 100,
    simulationMode: boolean = false,
    simulationScenario?: SimulationScenario
  ): Promise<SiteAnalysis> {
    const cacheKey = `site_${lat}_${lon}_${simulationMode}`;
    
    // Check cache
    if (!simulationMode) {
      const cached = this.analysisCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.data;
      }
    }

    try {
      // Fetch data from all sources in parallel
      const [weather, soil, vegetation, landCover] = await Promise.all([
        weatherService.getCurrentWeather(lat, lon),
        soilService.getSoilData(lat, lon),
        satelliteService.getVegetationIndex(lat, lon),
        satelliteService.getLandCover(lat, lon),
      ]);

      // Get weather forecast
      const forecast = await weatherService.getForecast(lat, lon);
      weather.forecast = forecast;

      // Apply simulation modifications if in simulation mode
      if (simulationMode && simulationScenario) {
        this.applySimulationScenario(weather, soil, vegetation, simulationScenario);
      }

      // Calculate suitability score
      const suitabilityScore = this.calculateSuitabilityScore(
        weather,
        soil,
        vegetation,
        landCover
      );

      // Get species recommendations
      const speciesRecommendations = speciesMatcher.matchSpecies(
        lat,
        lon,
        soil,
        weather,
        false
      );

      // Assess risks
      const risks = await riskPredictor.assessAllRisks(
        lat,
        lon,
        weather,
        vegetation,
        soil,
        simulationMode
      );

      // Calculate carbon sequestration
      const primarySpecies = speciesRecommendations[0]?.scientificName || 'Generic Tree';
      const carbonEstimate = carbonCalculator.calculateSiteCarbon(
        hectares,
        400, // trees per hectare
        primarySpecies,
        5, // age in years
        vegetation,
        soil
      );

      // Get soil amendments
      const soilAmendments = await soilService.analyzeSoilAmendments(soil);

      const analysis: SiteAnalysis = {
        location: { lat, lon, name },
        weather,
        soil,
        vegetation,
        landCover,
        suitabilityScore,
        risks,
        speciesRecommendations,
        carbonEstimate,
        soilAmendments,
        lastUpdated: new Date().toISOString(),
      };

      // Cache the result
      if (!simulationMode) {
        this.analysisCache.set(cacheKey, { data: analysis, timestamp: Date.now() });
      }

      return analysis;
    } catch (error) {
      console.error('Site analysis error:', error);
      throw new Error('Failed to complete site analysis');
    }
  }

  /**
   * Calculate overall site suitability score (0-100)
   */
  private calculateSuitabilityScore(
    weather: WeatherData,
    soil: SoilData,
    vegetation: VegetationData,
    landCover: LandCoverData
  ): number {
    let score = 50; // Base score

    // Vegetation health factor (0-25 points)
    score += (vegetation.healthScore / 100) * 25;

    // Soil quality factor (0-20 points)
    const soilScore = this.calculateSoilScore(soil);
    score += soilScore * 20;

    // Climate suitability (0-20 points)
    const climateScore = this.calculateClimateScore(weather);
    score += climateScore * 20;

    // Land cover factor (0-15 points)
    const landCoverScore = (landCover.forestCover + landCover.grassland) / 100;
    score += landCoverScore * 15;

    // Moisture availability (0-10 points)
    if (soil.moisture >= 50 && soil.moisture <= 70) {
      score += 10;
    } else if (soil.moisture >= 40 && soil.moisture <= 80) {
      score += 7;
    } else {
      score += 3;
    }

    // NDVI factor (0-10 points)
    if (vegetation.ndvi > 0.6) {
      score += 10;
    } else if (vegetation.ndvi > 0.4) {
      score += 7;
    } else if (vegetation.ndvi > 0.2) {
      score += 4;
    }

    return Math.round(Math.max(0, Math.min(100, score)));
  }

  private calculateSoilScore(soil: SoilData): number {
    let score = 0.5;

    // pH score
    if (soil.ph >= 6.0 && soil.ph <= 7.0) {
      score += 0.2;
    } else if (soil.ph >= 5.5 && soil.ph <= 7.5) {
      score += 0.1;
    }

    // Nutrient score
    const nutrientScore = 
      (soil.nitrogen === 'high' ? 0.1 : soil.nitrogen === 'medium' ? 0.07 : 0.03) +
      (soil.phosphorus === 'high' ? 0.1 : soil.phosphorus === 'medium' ? 0.07 : 0.03) +
      (soil.potassium === 'high' ? 0.1 : soil.potassium === 'medium' ? 0.07 : 0.03);
    
    score += nutrientScore;

    return Math.min(1, score);
  }

  private calculateClimateScore(weather: WeatherData): number {
    let score = 0.5;

    // Temperature score (optimal 20-28°C)
    const temp = weather.current.temp;
    if (temp >= 20 && temp <= 28) {
      score += 0.25;
    } else if (temp >= 15 && temp <= 32) {
      score += 0.15;
    }

    // Precipitation score
    const avgPrecip = weather.forecast
      .slice(0, 7)
      .reduce((sum, day) => sum + day.precipitation, 0) / 7;
    
    if (avgPrecip >= 2 && avgPrecip <= 6) {
      score += 0.25;
    } else if (avgPrecip >= 1 && avgPrecip <= 8) {
      score += 0.15;
    }

    return Math.min(1, score);
  }

  /**
   * Apply simulation scenario modifications to data
   */
  private applySimulationScenario(
    weather: WeatherData,
    soil: SoilData,
    vegetation: VegetationData,
    scenario: SimulationScenario
  ): void {
    const intensityMultiplier = scenario.intensity === 'high' ? 1.5 : scenario.intensity === 'medium' ? 1.2 : 1.0;

    switch (scenario.type) {
      case 'drought':
        // Reduce precipitation and soil moisture
        weather.forecast.forEach(day => {
          day.precipitation *= (1 - 0.7 * intensityMultiplier);
          day.humidity *= (1 - 0.3 * intensityMultiplier);
        });
        soil.moisture *= (1 - 0.4 * intensityMultiplier);
        vegetation.healthScore *= (1 - 0.2 * intensityMultiplier);
        vegetation.ndvi *= (1 - 0.15 * intensityMultiplier);
        break;

      case 'flood':
        // Increase precipitation and soil moisture
        weather.forecast.forEach(day => {
          day.precipitation *= (1 + 2.0 * intensityMultiplier);
          day.humidity = Math.min(100, day.humidity * 1.2);
        });
        soil.moisture = Math.min(100, soil.moisture * (1 + 0.5 * intensityMultiplier));
        break;

      case 'heat':
        // Increase temperature
        weather.current.temp *= (1 + 0.2 * intensityMultiplier);
        weather.forecast.forEach(day => {
          day.temp *= (1 + 0.2 * intensityMultiplier);
          day.humidity *= (1 - 0.2 * intensityMultiplier);
        });
        vegetation.healthScore *= (1 - 0.15 * intensityMultiplier);
        break;

      case 'species_failure':
        // Reduce vegetation health
        vegetation.healthScore *= (1 - 0.4 * intensityMultiplier);
        vegetation.ndvi *= (1 - 0.3 * intensityMultiplier);
        vegetation.coverage *= (1 - 0.35 * intensityMultiplier);
        break;
    }
  }

  /**
   * Batch analyze multiple sites
   */
  async analyzeMultipleSites(
    sites: Array<{ lat: number; lon: number; name: string; hectares: number }>
  ): Promise<SiteAnalysis[]> {
    const analyses = await Promise.all(
      sites.map(site => this.analyzeSite(site.lat, site.lon, site.name, site.hectares))
    );

    // Sort by suitability score
    return analyses.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.analysisCache.clear();
  }
}

export const dataIntegrationService = new DataIntegrationService();
