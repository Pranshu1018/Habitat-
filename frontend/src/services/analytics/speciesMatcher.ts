// Species Matching Engine
import { SoilData } from '../api/soilService';
import { WeatherData } from '../api/weatherService';

export interface SpeciesRecommendation {
  id: string;
  name: string;
  scientificName: string;
  survivalProbability: number;
  reason: string;
  imageUrl: string;
  characteristics: {
    droughtTolerance: 'low' | 'medium' | 'high';
    growthRate: 'slow' | 'medium' | 'fast';
    maxHeight: number;
    soilPreference: string;
    climateZone: string;
  };
  benefits: string[];
  carbonPotential: number;
}

interface SpeciesDatabase {
  [key: string]: Omit<SpeciesRecommendation, 'id' | 'survivalProbability' | 'reason'>;
}

class SpeciesMatcher {
  private speciesDatabase: SpeciesDatabase = {
    'khaya-anthotheca': {
      name: 'African Mahogany',
      scientificName: 'Khaya anthotheca',
      imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400',
      characteristics: {
        droughtTolerance: 'high',
        growthRate: 'medium',
        maxHeight: 30,
        soilPreference: 'Well-drained, pH 5.5-7.0',
        climateZone: 'Tropical',
      },
      benefits: ['High-value timber', 'Excellent drought resistance', 'Good carbon sequestration'],
      carbonPotential: 850,
    },
    'prunus-africana': {
      name: 'African Cherry',
      scientificName: 'Prunus africana',
      imageUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=400',
      characteristics: {
        droughtTolerance: 'medium',
        growthRate: 'slow',
        maxHeight: 25,
        soilPreference: 'Moist, well-drained, pH 5.5-6.5',
        climateZone: 'Highland tropical',
      },
      benefits: ['Medicinal properties', 'Highland adapted', 'Biodiversity support'],
      carbonPotential: 720,
    },
    'juniperus-procera': {
      name: 'East African Cedar',
      scientificName: 'Juniperus procera',
      imageUrl: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=400',
      characteristics: {
        droughtTolerance: 'high',
        growthRate: 'slow',
        maxHeight: 40,
        soilPreference: 'Well-drained, pH 6.0-7.5',
        climateZone: 'Highland',
      },
      benefits: ['Excellent carbon storage', 'Long-lived', 'Erosion control'],
      carbonPotential: 1200,
    },
    'yushania-alpina': {
      name: 'Highland Bamboo',
      scientificName: 'Yushania alpina',
      imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
      characteristics: {
        droughtTolerance: 'medium',
        growthRate: 'fast',
        maxHeight: 15,
        soilPreference: 'Moist, pH 5.5-6.5',
        climateZone: 'Highland tropical',
      },
      benefits: ['Rapid growth', 'Soil stabilization', 'Multiple uses'],
      carbonPotential: 650,
    },
    'milicia-excelsa': {
      name: 'Iroko',
      scientificName: 'Milicia excelsa',
      imageUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=400',
      characteristics: {
        droughtTolerance: 'high',
        growthRate: 'medium',
        maxHeight: 35,
        soilPreference: 'Various soils, pH 5.0-7.0',
        climateZone: 'Tropical',
      },
      benefits: ['Valuable hardwood', 'Adaptable', 'Long-lived'],
      carbonPotential: 950,
    },
    'shorea-spp': {
      name: 'Meranti',
      scientificName: 'Shorea spp.',
      imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
      characteristics: {
        droughtTolerance: 'low',
        growthRate: 'medium',
        maxHeight: 45,
        soilPreference: 'Deep, moist, pH 5.0-6.5',
        climateZone: 'Equatorial rainforest',
      },
      benefits: ['High biodiversity value', 'Excellent timber', 'Large carbon storage'],
      carbonPotential: 1400,
    },
    'gonystylus-bancanus': {
      name: 'Ramin',
      scientificName: 'Gonystylus bancanus',
      imageUrl: 'https://images.unsplash.com/photo-1476231682828-37e571bc172f?w=400',
      characteristics: {
        droughtTolerance: 'low',
        growthRate: 'slow',
        maxHeight: 30,
        soilPreference: 'Peat swamp, pH 4.5-5.5',
        climateZone: 'Equatorial',
      },
      benefits: ['Peat forest restoration', 'Unique ecosystem', 'Carbon-rich soils'],
      carbonPotential: 800,
    },
    'tectona-grandis': {
      name: 'Teak',
      scientificName: 'Tectona grandis',
      imageUrl: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=400',
      characteristics: {
        droughtTolerance: 'high',
        growthRate: 'medium',
        maxHeight: 30,
        soilPreference: 'Well-drained, pH 6.0-7.5',
        climateZone: 'Monsoon tropical',
      },
      benefits: ['Premium timber', 'High economic value', 'Drought resistant'],
      carbonPotential: 1100,
    },
    'santalum-album': {
      name: 'Sandalwood',
      scientificName: 'Santalum album',
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      characteristics: {
        droughtTolerance: 'high',
        growthRate: 'slow',
        maxHeight: 12,
        soilPreference: 'Well-drained, pH 6.0-7.5',
        climateZone: 'Tropical dry',
      },
      benefits: ['High-value aromatic wood', 'Medicinal uses', 'Drought adapted'],
      carbonPotential: 450,
    },
    'acacia-mangium': {
      name: 'Acacia',
      scientificName: 'Acacia mangium',
      imageUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=400',
      characteristics: {
        droughtTolerance: 'high',
        growthRate: 'fast',
        maxHeight: 25,
        soilPreference: 'Various soils, pH 4.5-6.5',
        climateZone: 'Tropical',
      },
      benefits: ['Nitrogen fixation', 'Fast growth', 'Soil improvement'],
      carbonPotential: 700,
    },
    'bertholletia-excelsa': {
      name: 'Brazil Nut',
      scientificName: 'Bertholletia excelsa',
      imageUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=400',
      characteristics: {
        droughtTolerance: 'medium',
        growthRate: 'slow',
        maxHeight: 50,
        soilPreference: 'Deep, well-drained, pH 5.5-6.5',
        climateZone: 'Amazon rainforest',
      },
      benefits: ['Economic value (nuts)', 'Keystone species', 'Large carbon storage'],
      carbonPotential: 1600,
    },
    'euterpe-oleracea': {
      name: 'Açaí Palm',
      scientificName: 'Euterpe oleracea',
      imageUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=400',
      characteristics: {
        droughtTolerance: 'low',
        growthRate: 'fast',
        maxHeight: 20,
        soilPreference: 'Moist, flooded, pH 5.0-6.5',
        climateZone: 'Amazon floodplain',
      },
      benefits: ['High survival rate', 'Economic value (fruit)', 'Flood tolerant'],
      carbonPotential: 550,
    },
    'ceiba-pentandra': {
      name: 'Ceiba',
      scientificName: 'Ceiba pentandra',
      imageUrl: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=400',
      characteristics: {
        droughtTolerance: 'medium',
        growthRate: 'fast',
        maxHeight: 60,
        soilPreference: 'Various soils, pH 5.5-7.0',
        climateZone: 'Tropical',
      },
      benefits: ['Massive carbon storage', 'Cultural significance', 'Rapid growth'],
      carbonPotential: 1800,
    },
    'dipteryx-micrantha': {
      name: 'Shihuahuaco',
      scientificName: 'Dipteryx micrantha',
      imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
      characteristics: {
        droughtTolerance: 'medium',
        growthRate: 'slow',
        maxHeight: 40,
        soilPreference: 'Well-drained, pH 5.5-6.5',
        climateZone: 'Amazon',
      },
      benefits: ['Exceptional hardwood', 'Long-lived (1000+ years)', 'High carbon storage'],
      carbonPotential: 1500,
    },
  };

  /**
   * Match optimal species for a site based on environmental conditions
   */
  matchSpecies(
    lat: number,
    lon: number,
    soilData: SoilData,
    weatherData: WeatherData,
    prioritizeCarbon: boolean = false
  ): SpeciesRecommendation[] {
    const climateZone = this.determineClimateZone(lat, weatherData);
    const recommendations: SpeciesRecommendation[] = [];

    Object.entries(this.speciesDatabase).forEach(([key, species]) => {
      const compatibility = this.calculateCompatibility(
        species,
        climateZone,
        soilData,
        weatherData
      );

      if (compatibility.score > 50) {
        recommendations.push({
          id: key,
          ...species,
          survivalProbability: compatibility.score,
          reason: compatibility.reason,
        });
      }
    });

    // Sort by survival probability or carbon potential
    if (prioritizeCarbon) {
      recommendations.sort((a, b) => b.carbonPotential - a.carbonPotential);
    } else {
      recommendations.sort((a, b) => b.survivalProbability - a.survivalProbability);
    }

    return recommendations.slice(0, 5); // Return top 5
  }

  private determineClimateZone(lat: number, weatherData: WeatherData): string {
    const absLat = Math.abs(lat);
    const avgTemp = weatherData.current.temp;
    const avgPrecipitation = weatherData.forecast
      .reduce((sum, day) => sum + day.precipitation, 0) / weatherData.forecast.length;

    if (absLat < 10) {
      if (avgPrecipitation > 5) return 'Equatorial rainforest';
      return 'Equatorial';
    } else if (absLat < 23.5) {
      if (avgPrecipitation > 4) return 'Tropical';
      if (avgPrecipitation > 2) return 'Monsoon tropical';
      return 'Tropical dry';
    } else if (absLat < 35) {
      return 'Subtropical';
    } else {
      return 'Temperate';
    }
  }

  private calculateCompatibility(
    species: Omit<SpeciesRecommendation, 'id' | 'survivalProbability' | 'reason'>,
    climateZone: string,
    soilData: SoilData,
    weatherData: WeatherData
  ): { score: number; reason: string } {
    let score = 70; // Base score
    const reasons: string[] = [];

    // Climate zone match
    if (species.characteristics.climateZone.toLowerCase().includes(climateZone.toLowerCase().split(' ')[0])) {
      score += 15;
      reasons.push('Optimal climate zone');
    } else {
      score -= 20;
      reasons.push('Suboptimal climate zone');
    }

    // Soil pH compatibility
    const phRange = this.extractPhRange(species.characteristics.soilPreference);
    if (soilData.ph >= phRange.min && soilData.ph <= phRange.max) {
      score += 10;
      reasons.push('Suitable soil pH');
    } else if (Math.abs(soilData.ph - (phRange.min + phRange.max) / 2) < 0.5) {
      score += 5;
    } else {
      score -= 15;
      reasons.push('pH adjustment needed');
    }

    // Drought tolerance vs moisture
    const avgPrecipitation = weatherData.forecast
      .slice(0, 14)
      .reduce((sum, day) => sum + day.precipitation, 0) / 14;

    if (avgPrecipitation < 2 && species.characteristics.droughtTolerance === 'high') {
      score += 15;
      reasons.push('Excellent drought tolerance for dry conditions');
    } else if (avgPrecipitation < 2 && species.characteristics.droughtTolerance === 'low') {
      score -= 25;
      reasons.push('Poor drought tolerance for dry conditions');
    } else if (avgPrecipitation > 5 && species.characteristics.droughtTolerance === 'low') {
      score += 10;
      reasons.push('Suitable for high rainfall');
    }

    // Soil moisture compatibility
    if (soilData.moisture < 40 && species.characteristics.droughtTolerance === 'high') {
      score += 10;
    } else if (soilData.moisture < 40 && species.characteristics.droughtTolerance === 'low') {
      score -= 20;
    }

    // Nutrient requirements (simplified)
    if (soilData.nitrogen === 'high' || soilData.nitrogen === 'medium') {
      score += 5;
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));

    const reason = reasons.slice(0, 2).join('; ') || 'Moderate compatibility with site conditions';

    return { score, reason };
  }

  private extractPhRange(soilPreference: string): { min: number; max: number } {
    const match = soilPreference.match(/pH\s*([\d.]+)-([\d.]+)/);
    if (match) {
      return { min: parseFloat(match[1]), max: parseFloat(match[2]) };
    }
    return { min: 5.5, max: 7.0 }; // Default range
  }

  /**
   * Get species by scientific name
   */
  getSpeciesByScientificName(scientificName: string): SpeciesRecommendation | null {
    const entry = Object.entries(this.speciesDatabase).find(
      ([_, species]) => species.scientificName === scientificName
    );

    if (!entry) return null;

    return {
      id: entry[0],
      ...entry[1],
      survivalProbability: 75,
      reason: 'Species data retrieved',
    };
  }
}

export const speciesMatcher = new SpeciesMatcher();
