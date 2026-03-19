import vegetationData from '../../data/vegetation.json';

export interface VegetationData {
  vegetationIndex: number;
  landType: string;
  forestCover: number;
  grassCover: number;
  bareSoil: number;
  degradationLevel: 'low' | 'moderate' | 'severe';
  regenerationPotential: number;
  erosionRisk: 'low' | 'medium' | 'high' | 'very_high';
}

export interface VegetationResponse {
  data: VegetationData;
  confidence: number;
  source: string;
}

export class VegetationService {
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

  static async getVegetationData(lat: number, lng: number): Promise<VegetationResponse> {
    // Find the nearest data point
    let nearestPoint = vegetationData.data[0];
    let minDistance = Infinity;

    for (const point of vegetationData.data) {
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

    // Add realistic variation for NDVI and other metrics
    const ndviVariation = 0.05;
    const coverVariation = 5;

    const data: VegetationData = {
      vegetationIndex: Math.max(0, Math.min(1, nearestPoint.vegetationIndex + (Math.random() - 0.5) * ndviVariation)),
      landType: nearestPoint.landType,
      forestCover: Math.max(0, Math.min(100, nearestPoint.forestCover + (Math.random() - 0.5) * coverVariation)),
      grassCover: Math.max(0, Math.min(100, nearestPoint.grassCover + (Math.random() - 0.5) * coverVariation)),
      bareSoil: Math.max(0, Math.min(100, nearestPoint.bareSoil + (Math.random() - 0.5) * coverVariation)),
      degradationLevel: nearestPoint.degradationLevel as 'low' | 'moderate' | 'severe',
      regenerationPotential: Math.max(0, Math.min(1, nearestPoint.regenerationPotential + (Math.random() - 0.5) * 0.1)),
      erosionRisk: nearestPoint.erosionRisk as 'low' | 'medium' | 'high' | 'very_high'
    };

    return {
      data,
      confidence,
      source: vegetationData.metadata.source
    };
  }

  static getVegetationScore(vegetation: VegetationData): number {
    let score = 0;

    // Vegetation Index (NDVI) scoring
    if (vegetation.vegetationIndex >= 0.6) score += 30;
    else if (vegetation.vegetationIndex >= 0.4) score += 25;
    else if (vegetation.vegetationIndex >= 0.2) score += 15;
    else score += 5;

    // Land type scoring
    const landTypeScores: { [key: string]: number } = {
      'semi_forest': 20,
      'grassland': 18,
      'degraded': 12,
      'severely_degraded': 5,
      'desertified': 2
    };
    score += landTypeScores[vegetation.landType] || 10;

    // Degradation level scoring (inverse - lower degradation = higher score)
    const degradationScores = {
      'low': 20,
      'moderate': 12,
      'severe': 5
    };
    score += degradationScores[vegetation.degradationLevel];

    // Regeneration potential scoring
    if (vegetation.regenerationPotential >= 0.8) score += 20;
    else if (vegetation.regenerationPotential >= 0.6) score += 15;
    else if (vegetation.regenerationPotential >= 0.4) score += 10;
    else score += 5;

    // Erosion risk scoring (inverse - lower risk = higher score)
    const erosionScores = {
      'low': 10,
      'medium': 7,
      'high': 3,
      'very_high': 1
    };
    score += erosionScores[vegetation.erosionRisk];

    return Math.min(100, Math.max(0, score));
  }

  static getRestorationPriority(vegetation: VegetationData, soilScore: number, climateScore: number): 'High' | 'Medium' | 'Low' {
    const vegScore = this.getVegetationScore(vegetation);
    const overallScore = (vegScore + soilScore + climateScore) / 3;

    // High priority for degraded areas with good potential
    if (vegetation.degradationLevel === 'severe' && vegetation.regenerationPotential > 0.4 && overallScore > 40) {
      return 'High';
    }
    
    // Medium priority for moderately degraded areas
    if (vegetation.degradationLevel === 'moderate' && overallScore > 50) {
      return 'Medium';
    }

    // Low priority for already healthy areas or very poor conditions
    if (vegScore > 70 || overallScore < 30) {
      return 'Low';
    }

    return 'Medium';
  }
}
