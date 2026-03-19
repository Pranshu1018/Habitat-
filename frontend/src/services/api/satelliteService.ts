// Satellite Service - Vegetation Monitoring
import { API_CONFIG, CACHE_DURATION } from './config';

export interface VegetationData {
  ndvi: number; // Normalized Difference Vegetation Index (-1 to 1)
  evi: number; // Enhanced Vegetation Index
  coverage: number; // Percentage
  healthScore: number; // 0-100
  changeRate: number; // Percentage change
  lastUpdated: string;
}

export interface LandCoverData {
  forestCover: number;
  grassland: number;
  cropland: number;
  bareLand: number;
  waterBodies: number;
}

class SatelliteService {
  private cache = new Map<string, { data: any; timestamp: number }>();

  private getCached(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION.SATELLITE) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async getVegetationIndex(lat: number, lon: number): Promise<VegetationData> {
    const cacheKey = `vegetation_${lat}_${lon}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      // Use our backend API instead of calling external APIs directly
      const response = await fetch(
        `http://localhost:3001/api/satellite/vegetation?lat=${lat}&lon=${lon}`
      );

      if (!response.ok) {
        throw new Error('Satellite API request failed');
      }

      const data = await response.json();
      
      const vegetationData = {
        ndvi: data.ndvi || 0.5,
        evi: data.evi || 0.4,
        coverage: data.coverage || 45,
        healthScore: data.healthScore || 50,
        changeRate: data.changeRate || 0,
        lastUpdated: data.lastUpdated || new Date().toISOString()
      };
      
      this.setCache(cacheKey, vegetationData);
      return vegetationData;
    } catch (error) {
      console.error('Satellite API error:', error);
      return this.getMockVegetationData(lat, lon);
    }
  }

  private calculateVegetationMetrics(data: any, lat: number, lon: number): VegetationData {
    // Calculate NDVI approximation based on solar radiation and location
    const isForested = Math.abs(lat) < 10 || (Math.abs(lat) < 23.5 && lon > 70 && lon < 140);
    
    const baseNdvi = isForested ? 0.7 : 0.4;
    const ndvi = baseNdvi + (Math.random() * 0.2 - 0.1);
    
    // EVI is typically slightly lower than NDVI
    const evi = ndvi * 0.85;
    
    // Calculate health score from NDVI
    const healthScore = Math.min(100, Math.max(0, (ndvi + 1) * 50));
    
    // Calculate coverage percentage
    const coverage = Math.min(100, healthScore * 0.9);
    
    // Simulate change rate (positive for growth)
    const changeRate = (Math.random() * 10 - 2);

    return {
      ndvi: parseFloat(ndvi.toFixed(3)),
      evi: parseFloat(evi.toFixed(3)),
      coverage: parseFloat(coverage.toFixed(1)),
      healthScore: parseFloat(healthScore.toFixed(1)),
      changeRate: parseFloat(changeRate.toFixed(2)),
      lastUpdated: new Date().toISOString(),
    };
  }

  private getMockVegetationData(lat: number, lon: number): VegetationData {
    const isEquatorial = Math.abs(lat) < 10;
    const isTropical = Math.abs(lat) < 23.5;
    
    const baseNdvi = isEquatorial ? 0.75 : isTropical ? 0.6 : 0.45;
    const ndvi = baseNdvi + (Math.random() * 0.15 - 0.075);
    
    return {
      ndvi: parseFloat(ndvi.toFixed(3)),
      evi: parseFloat((ndvi * 0.85).toFixed(3)),
      coverage: parseFloat(((ndvi + 1) * 45).toFixed(1)),
      healthScore: parseFloat(((ndvi + 1) * 50).toFixed(1)),
      changeRate: parseFloat((Math.random() * 8 - 1).toFixed(2)),
      lastUpdated: new Date().toISOString(),
    };
  }

  async getLandCover(lat: number, lon: number): Promise<LandCoverData> {
    const cacheKey = `landcover_${lat}_${lon}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    // Mock land cover data based on location
    const isEquatorial = Math.abs(lat) < 10;
    const isTropical = Math.abs(lat) < 23.5;
    
    let landCover: LandCoverData;
    
    if (isEquatorial) {
      landCover = {
        forestCover: 60 + Math.random() * 20,
        grassland: 15 + Math.random() * 10,
        cropland: 10 + Math.random() * 10,
        bareLand: 5 + Math.random() * 5,
        waterBodies: 5 + Math.random() * 5,
      };
    } else if (isTropical) {
      landCover = {
        forestCover: 40 + Math.random() * 20,
        grassland: 25 + Math.random() * 15,
        cropland: 20 + Math.random() * 10,
        bareLand: 10 + Math.random() * 5,
        waterBodies: 3 + Math.random() * 3,
      };
    } else {
      landCover = {
        forestCover: 25 + Math.random() * 15,
        grassland: 35 + Math.random() * 15,
        cropland: 25 + Math.random() * 10,
        bareLand: 10 + Math.random() * 5,
        waterBodies: 3 + Math.random() * 3,
      };
    }

    // Normalize to 100%
    const total = Object.values(landCover).reduce((sum, val) => sum + val, 0);
    Object.keys(landCover).forEach(key => {
      landCover[key as keyof LandCoverData] = parseFloat(
        ((landCover[key as keyof LandCoverData] / total) * 100).toFixed(1)
      );
    });

    this.setCache(cacheKey, landCover);
    return landCover;
  }

  async detectDeforestation(lat: number, lon: number, months: number = 12): Promise<{
    detected: boolean;
    areaLost: number;
    severity: 'low' | 'medium' | 'high';
  }> {
    // Simulate deforestation detection
    const random = Math.random();
    
    if (random < 0.1) {
      return {
        detected: true,
        areaLost: 5 + Math.random() * 15,
        severity: 'high',
      };
    } else if (random < 0.25) {
      return {
        detected: true,
        areaLost: 1 + Math.random() * 4,
        severity: 'medium',
      };
    } else if (random < 0.4) {
      return {
        detected: true,
        areaLost: Math.random() * 1,
        severity: 'low',
      };
    }
    
    return {
      detected: false,
      areaLost: 0,
      severity: 'low',
    };
  }
}

export const satelliteService = new SatelliteService();
