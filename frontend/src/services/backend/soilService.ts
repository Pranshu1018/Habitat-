import soilData from '../../data/soil.json';

export interface SoilData {
  ph: number;
  nitrogen: 'low' | 'medium' | 'high';
  phosphorus: 'low' | 'medium' | 'high';
  potassium: 'low' | 'medium' | 'high';
  organic_matter: number;
  texture: string;
  drainage: 'poor' | 'moderate' | 'good' | 'excellent';
  depth: number;
}

export interface SoilResponse {
  data: SoilData;
  confidence: number;
  source: string;
}

export class SoilService {
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

  static async getSoilData(lat: number, lng: number): Promise<SoilResponse> {
    // Find the nearest data point
    let nearestPoint = soilData.data[0];
    let minDistance = Infinity;

    for (const point of soilData.data) {
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

    // Add some realistic variation for demonstration
    const variation = 0.1;
    const data: SoilData = {
      ph: Math.max(4.5, Math.min(8.5, nearestPoint.ph + (Math.random() - 0.5) * variation)),
      nitrogen: nearestPoint.nitrogen as 'low' | 'medium' | 'high',
      phosphorus: nearestPoint.phosphorus as 'low' | 'medium' | 'high',
      potassium: nearestPoint.potassium as 'low' | 'medium' | 'high',
      organic_matter: Math.max(0.5, nearestPoint.organic_matter + (Math.random() - 0.5) * variation),
      texture: nearestPoint.texture,
      drainage: nearestPoint.drainage as 'poor' | 'moderate' | 'good' | 'excellent',
      depth: Math.max(50, nearestPoint.depth + (Math.random() - 0.5) * 20)
    };

    return {
      data,
      confidence,
      source: soilData.metadata.source
    };
  }

  static getSoilScore(soil: SoilData): number {
    let score = 0;

    // pH scoring (optimal 6.0-7.0)
    if (soil.ph >= 6.0 && soil.ph <= 7.0) score += 25;
    else if (soil.ph >= 5.5 && soil.ph <= 7.5) score += 20;
    else if (soil.ph >= 5.0 && soil.ph <= 8.0) score += 15;
    else score += 10;

    // Nutrient scoring
    const nutrientScores = {
      'high': 25,
      'medium': 18,
      'low': 10
    };
    score += nutrientScores[soil.nitrogen];
    score += nutrientScores[soil.phosphorus] * 0.8;
    score += nutrientScores[soil.potassium] * 0.7;

    // Organic matter scoring
    if (soil.organic_matter >= 3) score += 15;
    else if (soil.organic_matter >= 2) score += 12;
    else if (soil.organic_matter >= 1) score += 8;
    else score += 5;

    // Drainage scoring
    const drainageScores = {
      'good': 10,
      'moderate': 8,
      'excellent': 7,
      'poor': 3
    };
    score += drainageScores[soil.drainage];

    return Math.min(100, Math.max(0, score));
  }
}
