// Risk Prediction Engine
import { WeatherData, DroughtRisk } from '../api/weatherService';
import { VegetationData } from '../api/satelliteService';
import { SoilData } from '../api/soilService';

export interface RiskAssessment {
  id: string;
  type: 'drought' | 'heat' | 'pest' | 'flood' | 'disease' | 'fire';
  probability: number; // 0-100
  severity: 'low' | 'medium' | 'high' | 'critical';
  expectedDate: string;
  daysAhead: number;
  description: string;
  mitigationActions: string[];
  confidence: number; // 0-100
}

class RiskPredictor {
  /**
   * Comprehensive risk assessment for a site
   */
  async assessAllRisks(
    lat: number,
    lon: number,
    weatherData: WeatherData,
    vegetationData: VegetationData,
    soilData: SoilData,
    simulationMode: boolean = false
  ): Promise<RiskAssessment[]> {
    const risks: RiskAssessment[] = [];

    // Drought risk
    const droughtRisk = await this.assessDroughtRisk(weatherData, soilData, vegetationData);
    if (droughtRisk) risks.push(droughtRisk);

    // Heat stress risk
    const heatRisk = this.assessHeatStress(weatherData, lat);
    if (heatRisk) risks.push(heatRisk);

    // Flood risk
    const floodRisk = this.assessFloodRisk(weatherData, soilData);
    if (floodRisk) risks.push(floodRisk);

    // Pest risk
    const pestRisk = this.assessPestRisk(weatherData, vegetationData);
    if (pestRisk) risks.push(pestRisk);

    // Disease risk
    const diseaseRisk = this.assessDiseaseRisk(weatherData, vegetationData, soilData);
    if (diseaseRisk) risks.push(diseaseRisk);

    // Fire risk
    const fireRisk = this.assessFireRisk(weatherData, vegetationData, soilData);
    if (fireRisk) risks.push(fireRisk);

    // In simulation mode, inject additional scenarios
    if (simulationMode) {
      risks.push(...this.generateSimulationScenarios());
    }

    // Sort by severity and probability
    return risks.sort((a, b) => {
      const severityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
      const scoreA = severityWeight[a.severity] * a.probability;
      const scoreB = severityWeight[b.severity] * b.probability;
      return scoreB - scoreA;
    });
  }

  private async assessDroughtRisk(
    weatherData: WeatherData,
    soilData: SoilData,
    vegetationData: VegetationData
  ): Promise<RiskAssessment | null> {
    // Calculate drought indicators
    const avgPrecipitation = weatherData.forecast
      .slice(0, 14)
      .reduce((sum, day) => sum + day.precipitation, 0) / 14;
    
    const avgHumidity = weatherData.forecast
      .slice(0, 14)
      .reduce((sum, day) => sum + day.humidity, 0) / 14;

    let probability = 0;
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Risk factors
    if (avgPrecipitation < 2 && soilData.moisture < 40) {
      probability = 75;
      severity = 'high';
    } else if (avgPrecipitation < 3 && soilData.moisture < 50) {
      probability = 50;
      severity = 'medium';
    } else if (avgPrecipitation < 5) {
      probability = 25;
      severity = 'low';
    }

    // Adjust based on vegetation health
    if (vegetationData.healthScore < 60) {
      probability += 15;
      if (severity === 'medium') severity = 'high';
    }

    if (probability < 20) return null;

    const daysAhead = 14;
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + daysAhead);

    return {
      id: `risk_drought_${Date.now()}`,
      type: 'drought',
      probability: Math.min(100, probability),
      severity,
      expectedDate: expectedDate.toISOString(),
      daysAhead,
      description: `${severity.charAt(0).toUpperCase() + severity.slice(1)} drought risk detected. Low precipitation forecast and declining soil moisture levels.`,
      mitigationActions: [
        'Increase irrigation frequency by 30-50%',
        'Apply mulch to retain soil moisture',
        'Prioritize water delivery to young saplings',
        'Consider drought-resistant species for new plantings',
      ],
      confidence: 78,
    };
  }

  private assessHeatStress(
    weatherData: WeatherData,
    lat: number
  ): Promise<RiskAssessment | null> {
    const avgTemp = weatherData.forecast
      .slice(0, 7)
      .reduce((sum, day) => sum + day.temp, 0) / 7;

    // Temperature thresholds vary by latitude
    const isEquatorial = Math.abs(lat) < 10;
    const threshold = isEquatorial ? 32 : 35;

    if (avgTemp < threshold - 3) return null;

    let probability = 0;
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

    if (avgTemp > threshold + 2) {
      probability = 70;
      severity = 'high';
    } else if (avgTemp > threshold) {
      probability = 50;
      severity = 'medium';
    } else {
      probability = 30;
      severity = 'low';
    }

    const daysAhead = 7;
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + daysAhead);

    return Promise.resolve({
      id: `risk_heat_${Date.now()}`,
      type: 'heat',
      probability,
      severity,
      expectedDate: expectedDate.toISOString(),
      daysAhead,
      description: `Heat stress warning. Temperatures expected to reach ${avgTemp.toFixed(1)}°C, which may stress young saplings.`,
      mitigationActions: [
        'Increase irrigation during peak heat hours',
        'Install shade cloth for vulnerable saplings',
        'Apply reflective mulch to reduce soil temperature',
        'Monitor for signs of heat stress (wilting, leaf scorch)',
      ],
      confidence: 72,
    });
  }

  private assessFloodRisk(
    weatherData: WeatherData,
    soilData: SoilData
  ): RiskAssessment | null {
    const totalPrecipitation = weatherData.forecast
      .slice(0, 7)
      .reduce((sum, day) => sum + day.precipitation, 0);

    // High clay content reduces drainage
    const drainageIssue = soilData.clayContent > 40 || soilData.moisture > 75;

    if (totalPrecipitation < 50 && !drainageIssue) return null;

    let probability = 0;
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

    if (totalPrecipitation > 100 && drainageIssue) {
      probability = 65;
      severity = 'high';
    } else if (totalPrecipitation > 75) {
      probability = 45;
      severity = 'medium';
    } else {
      probability = 25;
      severity = 'low';
    }

    const daysAhead = 7;
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + daysAhead);

    return {
      id: `risk_flood_${Date.now()}`,
      type: 'flood',
      probability,
      severity,
      expectedDate: expectedDate.toISOString(),
      daysAhead,
      description: `Flooding risk due to heavy rainfall forecast (${totalPrecipitation.toFixed(0)}mm expected).`,
      mitigationActions: [
        'Improve drainage channels around planting areas',
        'Create water diversion berms',
        'Avoid planting in low-lying areas temporarily',
        'Monitor soil saturation levels',
      ],
      confidence: 68,
    };
  }

  private assessPestRisk(
    weatherData: WeatherData,
    vegetationData: VegetationData
  ): RiskAssessment | null {
    const avgTemp = weatherData.current.temp;
    const avgHumidity = weatherData.current.humidity;

    // Pest activity increases in warm, humid conditions
    const favorableConditions = avgTemp > 20 && avgTemp < 30 && avgHumidity > 60;

    if (!favorableConditions) return null;

    let probability = 35;
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Stressed vegetation is more susceptible
    if (vegetationData.healthScore < 70) {
      probability += 20;
      severity = 'medium';
    }

    const daysAhead = 21;
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + daysAhead);

    return {
      id: `risk_pest_${Date.now()}`,
      type: 'pest',
      probability,
      severity,
      expectedDate: expectedDate.toISOString(),
      daysAhead,
      description: `Increased pest activity expected due to favorable temperature and humidity conditions.`,
      mitigationActions: [
        'Install pest monitoring traps',
        'Conduct regular visual inspections',
        'Apply organic pest deterrents if needed',
        'Maintain plant health to improve resistance',
      ],
      confidence: 62,
    };
  }

  private assessDiseaseRisk(
    weatherData: WeatherData,
    vegetationData: VegetationData,
    soilData: SoilData
  ): RiskAssessment | null {
    const highHumidity = weatherData.current.humidity > 75;
    const poorDrainage = soilData.moisture > 75;
    const stressedVegetation = vegetationData.healthScore < 65;

    if (!highHumidity && !poorDrainage) return null;

    let probability = 30;
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

    if (highHumidity && poorDrainage && stressedVegetation) {
      probability = 60;
      severity = 'medium';
    } else if (highHumidity && poorDrainage) {
      probability = 45;
      severity = 'medium';
    }

    const daysAhead = 14;
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + daysAhead);

    return {
      id: `risk_disease_${Date.now()}`,
      type: 'disease',
      probability,
      severity,
      expectedDate: expectedDate.toISOString(),
      daysAhead,
      description: `Fungal disease risk elevated due to high humidity and moisture levels.`,
      mitigationActions: [
        'Improve air circulation between plants',
        'Reduce irrigation if soil is saturated',
        'Remove infected plant material promptly',
        'Apply preventive fungicide if necessary',
      ],
      confidence: 65,
    };
  }

  private assessFireRisk(
    weatherData: WeatherData,
    vegetationData: VegetationData,
    soilData: SoilData
  ): RiskAssessment | null {
    const highTemp = weatherData.current.temp > 30;
    const lowHumidity = weatherData.current.humidity < 40;
    const dryVegetation = vegetationData.ndvi < 0.4;
    const drySoil = soilData.moisture < 30;

    if (!highTemp || !lowHumidity) return null;

    let probability = 20;
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

    if (highTemp && lowHumidity && dryVegetation && drySoil) {
      probability = 55;
      severity = 'high';
    } else if (highTemp && lowHumidity && (dryVegetation || drySoil)) {
      probability = 35;
      severity = 'medium';
    }

    const daysAhead = 7;
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + daysAhead);

    return {
      id: `risk_fire_${Date.now()}`,
      type: 'fire',
      probability,
      severity,
      expectedDate: expectedDate.toISOString(),
      daysAhead,
      description: `Elevated fire risk due to hot, dry conditions and low vegetation moisture.`,
      mitigationActions: [
        'Clear dry vegetation and debris',
        'Create firebreaks around planting areas',
        'Ensure fire suppression equipment is accessible',
        'Restrict access during high-risk periods',
      ],
      confidence: 70,
    };
  }

  private generateSimulationScenarios(): RiskAssessment[] {
    const scenarios: RiskAssessment[] = [];

    // Severe drought scenario
    scenarios.push({
      id: `sim_drought_${Date.now()}`,
      type: 'drought',
      probability: 85,
      severity: 'critical',
      expectedDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      daysAhead: 10,
      description: '[SIMULATION] Severe drought conditions projected. Extended dry period with no rainfall expected for 4+ weeks.',
      mitigationActions: [
        'Implement emergency irrigation protocol',
        'Prioritize water for high-value species',
        'Consider temporary shade structures',
        'Prepare for potential sapling losses',
      ],
      confidence: 92,
    });

    return scenarios;
  }
}

export const riskPredictor = new RiskPredictor();
