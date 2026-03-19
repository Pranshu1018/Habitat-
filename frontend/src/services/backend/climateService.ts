import climateData from '../../data/climate.json';

export interface ClimateData {
  avgTemp: number;
  minTemp: number;
  maxTemp: number;
  rainfall: number;
  rainfallSeason: 'short' | 'long' | 'bimodal';
  droughtRisk: 'low' | 'medium' | 'high' | 'very_high';
  humidity: number;
  growingSeason: number;
  frostDays: number;
}

export interface ClimateResponse {
  data: ClimateData;
  confidence: number;
  source: string;
}

export class ClimateService {
  private static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  static async getClimateData(lat: number, lng: number): Promise<ClimateResponse> {
    // Find the nearest data point
    let nearestPoint = climateData.data[0];
    let minDistance = Infinity;

    for (const point of climateData.data) {
      const distance = this.calculateDistance(lat, lng, point.lat, point.lng);
      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = point;
      }
    }

    // Calculate confidence based on distance
    let confidence = 1.0;
    if (minDistance > 50) confidence = 0.7;
    else if (minDistance > 20) confidence = 0.85;
    else if (minDistance > 10) confidence = 0.95;

    // Add realistic variation
    const tempVariation = 2;
    const rainfallVariation = 50;
    
    const data: ClimateData = {
      avgTemp: Math.max(15, Math.min(45, nearestPoint.avgTemp + (Math.random() - 0.5) * tempVariation)),
      minTemp: Math.max(10, nearestPoint.minTemp + (Math.random() - 0.5) * tempVariation),
      maxTemp: Math.min(50, nearestPoint.maxTemp + (Math.random() - 0.5) * tempVariation),
      rainfall: Math.max(100, nearestPoint.rainfall + (Math.random() - 0.5) * rainfallVariation),
      rainfallSeason: nearestPoint.rainfallSeason,
      droughtRisk: nearestPoint.droughtRisk as 'low' | 'medium' | 'high' | 'very_high',
      humidity: Math.max(20, Math.min(95, nearestPoint.humidity + (Math.random() - 0.5) * 10)),
      growingSeason: Math.max(100, Math.min(365, nearestPoint.growingSeason + (Math.random() - 0.5) * 20)),
      frostDays: nearestPoint.frostDays
    };

    return {
      data,
      confidence,
      source: climateData.metadata.source
    };
  }

  static getClimateScore(climate: ClimateData): number {
    let score = 0;

    // Temperature scoring (optimal 22-30°C)
    if (climate.avgTemp >= 22 && climate.avgTemp <= 30) score += 25;
    else if (climate.avgTemp >= 18 && climate.avgTemp <= 35) score += 20;
    else if (climate.avgTemp >= 15 && climate.avgTemp <= 40) score += 15;
    else score += 10;

    // Rainfall scoring (optimal 800-1500mm)
    if (climate.rainfall >= 800 && climate.rainfall <= 1500) score += 25;
    else if (climate.rainfall >= 600 && climate.rainfall <= 2000) score += 20;
    else if (climate.rainfall >= 400 && climate.rainfall <= 2500) score += 15;
    else score += 10;

    // Drought risk scoring
    const droughtScores = {
      'low': 20,
      'medium': 15,
      'high': 8,
      'very_high': 3
    };
    score += droughtScores[climate.droughtRisk];

    // Growing season scoring
    if (climate.growingSeason >= 240) score += 20;
    else if (climate.growingSeason >= 180) score += 15;
    else if (climate.growingSeason >= 120) score += 10;
    else score += 5;

    // Humidity scoring
    if (climate.humidity >= 60 && climate.humidity <= 80) score += 10;
    else if (climate.humidity >= 50 && climate.humidity <= 90) score += 8;
    else score += 5;

    return Math.min(100, Math.max(0, score));
  }

  static getRainfallCategory(rainfall: number): 'low' | 'medium' | 'high' {
    if (rainfall < 600) return 'low';
    if (rainfall < 1200) return 'medium';
    return 'high';
  }
}
