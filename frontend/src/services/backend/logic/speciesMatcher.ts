import speciesData from '../../../data/species.json';
import { SoilData } from '../soilService';
import { ClimateData } from '../climateService';
import { ClimateService } from '../climateService';

export interface Species {
  name: string;
  scientificName: string;
  phRange: [number, number];
  rainfall: 'low' | 'medium' | 'high';
  minRainfall: number;
  maxRainfall: number;
  droughtTolerance: 'low' | 'medium' | 'high' | 'very_high';
  growthRate: 'slow' | 'medium' | 'fast' | 'very_fast';
  maturityYears: number;
  height: number;
  nativeRegion: string;
  soilPreference: string;
  temperatureRange: [number, number];
  uses: string[];
  carbonSequestration: number;
  biodiversityValue: number;
}

export interface SpeciesRecommendation {
  species: Species;
  survivalProbability: number;
  matchScore: number;
  reason: string;
  pros: string[];
  cons: string[];
  suitabilityFactors: {
    ph: boolean;
    rainfall: boolean;
    temperature: boolean;
    drought: boolean;
    soil: boolean;
  };
}

export class SpeciesMatcher {
  static getRecommendedSpecies(
    soil: SoilData,
    climate: ClimateData,
    landScore: number,
    maxRecommendations: number = 5
  ): SpeciesRecommendation[] {
    const rainfallCategory = ClimateService.getRainfallCategory(climate.rainfall);
    
    // Score each species
    const scoredSpecies = speciesData.species.map(species => {
      const typedSpecies = {
        ...species,
        phRange: species.phRange as [number, number],
        temperatureRange: species.temperatureRange as [number, number],
        rainfall: species.rainfall as 'low' | 'medium' | 'high',
        droughtTolerance: species.droughtTolerance as 'low' | 'medium' | 'high' | 'very_high',
        growthRate: species.growthRate as 'slow' | 'medium' | 'fast' | 'very_fast'
      };
      const recommendation = this.scoreSpecies(typedSpecies, soil, climate, rainfallCategory, landScore);
      return recommendation;
    });

    // Filter out species with very low survival probability
    const viableSpecies = scoredSpecies.filter(rec => rec.survivalProbability > 0.3);

    // Sort by match score (survival probability + suitability factors)
    viableSpecies.sort((a, b) => b.matchScore - a.matchScore);

    // Return top recommendations
    return viableSpecies.slice(0, maxRecommendations);
  }

  private static scoreSpecies(
    species: Species,
    soil: SoilData,
    climate: ClimateData,
    rainfallCategory: 'low' | 'medium' | 'high',
    landScore: number
  ): SpeciesRecommendation {
    const factors = {
      ph: this.checkPHCompatibility(species.phRange, soil.ph),
      rainfall: this.checkRainfallCompatibility(species, rainfallCategory, climate.rainfall),
      temperature: this.checkTemperatureCompatibility(species.temperatureRange, climate.avgTemp),
      drought: this.checkDroughtCompatibility(species.droughtTolerance, climate.droughtRisk),
      soil: this.checkSoilCompatibility(species.soilPreference, soil.texture)
    };

    // Calculate survival probability based on compatibility factors
    const factorScores = {
      ph: factors.ph ? 0.25 : 0.05,
      rainfall: factors.rainfall ? 0.25 : 0.05,
      temperature: factors.temperature ? 0.20 : 0.05,
      drought: factors.drought ? 0.20 : 0.05,
      soil: factors.soil ? 0.10 : 0.02
    };

    const survivalProbability = Math.min(0.95, 
      Object.values(factorScores).reduce((sum, score) => sum + score, 0)
    );

    // Calculate match score (includes additional factors like growth rate, carbon sequestration)
    const growthRateBonus = this.getGrowthRateBonus(species.growthRate);
    const carbonBonus = Math.min(0.1, species.carbonSequestration / 100);
    const biodiversityBonus = Math.min(0.05, species.biodiversityValue / 100);
    
    const matchScore = survivalProbability + growthRateBonus + carbonBonus + biodiversityBonus;

    // Generate reasoning
    const { reason, pros, cons } = this.generateReasoning(
      species,
      soil,
      climate,
      factors,
      survivalProbability
    );

    return {
      species,
      survivalProbability,
      matchScore,
      reason,
      pros,
      cons,
      suitabilityFactors: factors
    };
  }

  private static checkPHCompatibility(phRange: [number, number], soilPH: number): boolean {
    return soilPH >= phRange[0] && soilPH <= phRange[1];
  }

  private static checkRainfallCompatibility(
    species: Species,
    rainfallCategory: 'low' | 'medium' | 'high',
    actualRainfall: number
  ): boolean {
    // Check if species rainfall category matches
    if (species.rainfall !== rainfallCategory) return false;
    
    // Check if actual rainfall is within species range
    return actualRainfall >= species.minRainfall && actualRainfall <= species.maxRainfall;
  }

  private static checkTemperatureCompatibility(
    tempRange: [number, number],
    actualTemp: number
  ): boolean {
    return actualTemp >= tempRange[0] && actualTemp <= tempRange[1];
  }

  private static checkDroughtCompatibility(
    speciesTolerance: 'low' | 'medium' | 'high' | 'very_high',
    climateRisk: 'low' | 'medium' | 'high' | 'very_high'
  ): boolean {
    const toleranceLevels = { 'low': 1, 'medium': 2, 'high': 3, 'very_high': 4 };
    return toleranceLevels[speciesTolerance] >= toleranceLevels[climateRisk];
  }

  private static checkSoilCompatibility(speciesPreference: string, soilTexture: string): boolean {
    // Simple text-based matching - could be enhanced with more sophisticated logic
    return speciesPreference.toLowerCase().includes(soilTexture.toLowerCase()) ||
           soilTexture.toLowerCase().includes(speciesPreference.toLowerCase()) ||
           speciesPreference === 'well_drained' && soilTexture.includes('sandy') ||
           speciesPreference.includes('loam') && soilTexture.includes('loam');
  }

  private static getGrowthRateBonus(growthRate: string): number {
    const bonuses = {
      'very_fast': 0.1,
      'fast': 0.08,
      'medium': 0.05,
      'slow': 0.02
    };
    return bonuses[growthRate as keyof typeof bonuses] || 0;
  }

  private static generateReasoning(
    species: Species,
    soil: SoilData,
    climate: ClimateData,
    factors: any,
    survivalProbability: number
  ): { reason: string; pros: string[]; cons: string[] } {
    const pros: string[] = [];
    const cons: string[] = [];

    // Generate pros based on matching factors
    if (factors.ph) pros.push(`Soil pH (${soil.ph.toFixed(1)}) is optimal for ${species.name}`);
    if (factors.rainfall) pros.push(`Rainfall (${climate.rainfall}mm) matches requirements`);
    if (factors.temperature) pros.push(`Temperature (${climate.avgTemp}°C) is within ideal range`);
    if (factors.drought) pros.push(`${species.droughtTolerance} drought tolerance matches local conditions`);
    if (species.growthRate === 'fast' || species.growthRate === 'very_fast') {
      pros.push(`Fast growth rate provides quick results`);
    }
    if (species.carbonSequestration > 10) {
      pros.push(`High carbon sequestration potential (${species.carbonSequestration} tons/ha/year)`);
    }

    // Generate cons based on mismatching factors
    if (!factors.ph) cons.push(`Soil pH (${soil.ph.toFixed(1)}) is outside optimal range`);
    if (!factors.rainfall) cons.push(`Rainfall conditions may not be ideal`);
    if (!factors.temperature) cons.push(`Temperature may stress the species`);
    if (!factors.drought) cons.push(`Drought tolerance may be insufficient for local conditions`);
    if (species.maturityYears > 10) cons.push(`Long time to maturity (${species.maturityYears} years)`);

    // Generate primary reason
    let reason = '';
    if (survivalProbability > 0.8) {
      reason = `Excellent match with ${Math.round(survivalProbability * 100)}% survival probability`;
    } else if (survivalProbability > 0.6) {
      reason = `Good match with ${Math.round(survivalProbability * 100)}% survival probability`;
    } else if (survivalProbability > 0.4) {
      reason = `Moderate match with ${Math.round(survivalProbability * 100)}% survival probability`;
    } else {
      reason = `Challenging conditions with ${Math.round(survivalProbability * 100)}% survival probability`;
    }

    // Add key differentiator
    if (species.droughtTolerance === 'very_high' && climate.droughtRisk !== 'low') {
      reason += `, exceptional drought tolerance`;
    }
    if (species.growthRate === 'very_fast') {
      reason += `, very fast growth for quick results`;
    }

    return { reason, pros, cons };
  }

  static getSpeciesByUseCase(useCase: string): Species[] {
    return speciesData.species.map(species => ({
      ...species,
      phRange: species.phRange as [number, number],
      temperatureRange: species.temperatureRange as [number, number],
      rainfall: species.rainfall as 'low' | 'medium' | 'high',
      droughtTolerance: species.droughtTolerance as 'low' | 'medium' | 'high' | 'very_high',
      growthRate: species.growthRate as 'slow' | 'medium' | 'fast' | 'very_fast'
    })).filter(species => 
      species.uses.some(use => use.toLowerCase().includes(useCase.toLowerCase()))
    );
  }

  static getSpeciesByGrowthRate(growthRate: string): Species[] {
    return speciesData.species.map(species => ({
      ...species,
      phRange: species.phRange as [number, number],
      temperatureRange: species.temperatureRange as [number, number],
      rainfall: species.rainfall as 'low' | 'medium' | 'high',
      droughtTolerance: species.droughtTolerance as 'low' | 'medium' | 'high' | 'very_high',
      growthRate: species.growthRate as 'slow' | 'medium' | 'fast' | 'very_fast'
    })).filter(species => species.growthRate === growthRate);
  }
}
