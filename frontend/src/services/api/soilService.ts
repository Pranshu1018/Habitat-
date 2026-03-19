// Soil Service - SoilGrids API Integration
import { API_CONFIG, CACHE_DURATION } from './config';

export interface SoilData {
  ph: number;
  nitrogen: 'low' | 'medium' | 'high';
  phosphorus: 'low' | 'medium' | 'high';
  potassium: 'low' | 'medium' | 'high';
  moisture: number;
  organicCarbon: number;
  bulkDensity: number;
  clayContent: number;
  sandContent: number;
}

class SoilService {
  private cache = new Map<string, { data: any; timestamp: number }>();

  private getCached(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION.SOIL) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async getSoilData(lat: number, lon: number): Promise<SoilData> {
    const cacheKey = `soil_${lat}_${lon}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      // Use our backend API instead of calling SoilGrids directly
      const response = await fetch(
        `http://localhost:3001/api/soil/data?lat=${lat}&lon=${lon}`
      );

      if (!response.ok) {
        throw new Error('Soil API request failed');
      }

      const data = await response.json();
      
      const soilData = {
        ph: data.ph || 6.5,
        nitrogen: data.nitrogen || 'medium',
        phosphorus: data.phosphorus || 'medium',
        potassium: data.potassium || 'medium',
        moisture: data.moisture || 60,
        organicCarbon: data.organicCarbon || 2.0,
        bulkDensity: data.bulkDensity || 1.3,
        clayContent: data.clayContent || 25,
        sandContent: data.sandContent || 40
      };

      this.setCache(cacheKey, soilData);
      return soilData;
    } catch (error) {
      console.error('Soil API error:', error);
      return this.getMockSoilData(lat, lon);
    }
  }

  private parseSoilGridsData(data: any): SoilData {
    // Extract values from SoilGrids response
    const properties = data.properties?.layers || [];
    
    const getPropertyValue = (name: string): number => {
      const layer = properties.find((p: any) => p.name === name);
      return layer?.depths?.[0]?.values?.mean || 0;
    };

    // pH (phh2o) - value is in pH * 10
    const phValue = getPropertyValue('phh2o') / 10;
    
    // Nitrogen (nitrogen) - value is in cg/kg
    const nitrogenValue = getPropertyValue('nitrogen');
    
    // Organic Carbon (soc) - value is in dg/kg
    const organicCarbon = getPropertyValue('soc') / 10;
    
    // Bulk Density (bdod) - value is in cg/cm³
    const bulkDensity = getPropertyValue('bdod') / 100;
    
    // Clay content (clay) - value is in g/kg
    const clayContent = getPropertyValue('clay') / 10;
    
    // Sand content (sand) - value is in g/kg
    const sandContent = getPropertyValue('sand') / 10;

    // Classify nutrient levels
    const classifyNutrient = (value: number, thresholds: [number, number]): 'low' | 'medium' | 'high' => {
      if (value < thresholds[0]) return 'low';
      if (value < thresholds[1]) return 'medium';
      return 'high';
    };

    // Estimate moisture based on clay content and organic carbon
    const moisture = Math.min(95, 30 + (clayContent * 0.5) + (organicCarbon * 2));

    return {
      ph: phValue || 6.5,
      nitrogen: classifyNutrient(nitrogenValue, [20, 40]),
      phosphorus: classifyNutrient(organicCarbon * 10, [15, 30]), // Estimated from organic carbon
      potassium: classifyNutrient(clayContent, [20, 40]), // Estimated from clay content
      moisture: moisture || 60,
      organicCarbon: organicCarbon || 15,
      bulkDensity: bulkDensity || 1.3,
      clayContent: clayContent || 25,
      sandContent: sandContent || 40,
    };
  }

  private getMockSoilData(lat: number, lon: number): SoilData {
    // Generate realistic mock data based on location
    const isEquatorial = Math.abs(lat) < 10;
    const isTropical = Math.abs(lat) < 23.5;
    
    // Tropical soils tend to be more acidic and weathered
    const basePh = isEquatorial ? 5.5 : isTropical ? 6.0 : 6.5;
    const moisture = isEquatorial ? 75 : isTropical ? 65 : 55;
    
    return {
      ph: basePh + (Math.random() * 0.8 - 0.4),
      nitrogen: Math.random() > 0.5 ? 'medium' : Math.random() > 0.5 ? 'high' : 'low',
      phosphorus: Math.random() > 0.6 ? 'low' : 'medium',
      potassium: Math.random() > 0.5 ? 'medium' : 'high',
      moisture: moisture + (Math.random() * 20 - 10),
      organicCarbon: 10 + Math.random() * 20,
      bulkDensity: 1.2 + Math.random() * 0.4,
      clayContent: 20 + Math.random() * 30,
      sandContent: 30 + Math.random() * 30,
    };
  }

  async analyzeSoilAmendments(soilData: SoilData): Promise<string[]> {
    const amendments: string[] = [];

    // pH adjustments
    if (soilData.ph < 5.5) {
      amendments.push('Apply lime to increase pH (target: 6.0-6.5)');
    } else if (soilData.ph > 7.5) {
      amendments.push('Apply sulfur to decrease pH (target: 6.5-7.0)');
    }

    // Nutrient amendments
    if (soilData.nitrogen === 'low') {
      amendments.push('Add nitrogen-rich compost or organic fertilizer');
    }
    if (soilData.phosphorus === 'low') {
      amendments.push('Apply rock phosphate or bone meal');
    }
    if (soilData.potassium === 'low') {
      amendments.push('Add potassium sulfate or wood ash');
    }

    // Moisture management
    if (soilData.moisture < 40) {
      amendments.push('Increase irrigation frequency and add mulch to retain moisture');
    } else if (soilData.moisture > 80) {
      amendments.push('Improve drainage to prevent waterlogging');
    }

    // Organic matter
    if (soilData.organicCarbon < 10) {
      amendments.push('Incorporate organic matter to improve soil structure');
    }

    return amendments.length > 0 ? amendments : ['Soil conditions are optimal for planting'];
  }
}

export const soilService = new SoilService();
