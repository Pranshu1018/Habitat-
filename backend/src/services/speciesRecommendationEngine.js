import { INDIAN_TREE_SPECIES, calculateSpeciesCompatibility } from '../data/indian-species-database.js';

// Re-export so site.js can pass the full DB to AI fallback
export { INDIAN_TREE_SPECIES };

/**
 * Advanced Species Recommendation Engine
 * Uses multi-factor compatibility scoring against 20 Indian native tree species.
 * Falls back to AI recommendation constrained to the same database.
 */
class SpeciesRecommendationEngine {
  
  /**
   * Get species recommendations based on site conditions
   */
  async getRecommendations(siteData) {
    const { weather, soil, vegetation, location, projectGoals = {} } = siteData;
    
    // Extract key parameters
    const conditions = this.extractConditions(weather, soil, vegetation, location);
    
    // Calculate compatibility for ALL species
    const scoredSpecies = INDIAN_TREE_SPECIES.map(species => {
      const compatibility = calculateSpeciesCompatibility(species, conditions);
      
      // Additional scoring factors
      const priorityBonus = this.calculatePriorityBonus(species, conditions, projectGoals);
      const riskPenalty = this.calculateRiskPenalty(species, conditions);
      
      const finalScore = compatibility.compatibility + priorityBonus - riskPenalty;
      
      return {
        ...species,
        compatibility,
        priorityBonus,
        riskPenalty,
        finalScore: Math.max(0, Math.min(100, finalScore)),
        reasoning: this.generateReasoning(species, compatibility, conditions)
      };
    });
    
    // Filter and sort
    const viableSpecies = scoredSpecies
      .filter(s => s.finalScore >= 40) // Minimum viability threshold
      .sort((a, b) => b.finalScore - a.finalScore);
    
    // Return top 5 with detailed analysis
    return viableSpecies.slice(0, 5).map(species => ({
      id: species.id,
      commonName: species.commonName,
      scientificName: species.scientificName,
      family: species.family,
      survivalProbability: Math.round(species.finalScore),
      matchScore: Math.round(species.finalScore),
      compatibility: species.compatibility,
      reasoning: species.reasoning,
      pros: this.extractPros(species),
      cons: this.extractCons(species, conditions),
      carePlan: this.generateCarePlan(species, conditions),
      expectedOutcomes: this.generateExpectedOutcomes(species),
      economicValue: species.economicValue,
      characteristics: {
        growthRate: species.characteristics.growthRate,
        maturityYears: species.characteristics.maturityYears,
        maxHeight: species.characteristics.maxHeight,
        carbonSequestration: species.characteristics.carbonSequestration
      }
    }));
  }
  
  /**
   * Extract conditions from site data
   */
  extractConditions(weather, soil, vegetation, location) {
    return {
      temperature: weather?.current?.temp || 28,
      rainfall: this.estimateAnnualRainfall(weather),
      ph: soil?.ph || 6.5,
      soilType: this.normalizeSoilType(soil?.texture || 'loamy'),
      elevation: location?.elevation || 200,
      humidity: weather?.current?.humidity || 65,
      ndvi: vegetation?.ndvi || 0.5,
      degradationLevel: this.assessDegradation(vegetation)
    };
  }
  
  /**
   * Estimate annual rainfall from current data
   */
  estimateAnnualRainfall(weather) {
    if (weather?.annual?.rainfall) {
      return weather.annual.rainfall;
    }
    
    // Estimate from current precipitation (rough approximation)
    const currentPrecip = weather?.current?.precipitation || 2;
    const humidity = weather?.current?.humidity || 65;
    
    // Simple model: high humidity areas get more rain
    if (humidity > 80) return 2000 + (currentPrecip * 365);
    if (humidity > 65) return 1200 + (currentPrecip * 300);
    return 600 + (currentPrecip * 200);
  }
  
  /**
   * Normalize soil type names
   */
  normalizeSoilType(texture) {
    const mapping = {
      'clay': 'clay',
      'sandy': 'sandy',
      'loam': 'loamy',
      'loamy': 'loamy',
      'silt': 'loamy',
      'silty': 'loamy',
      'clay loam': 'clay_loam',
      'sandy loam': 'sandy_loam',
      'alluvial': 'alluvial'
    };
    
    return mapping[texture.toLowerCase()] || 'loamy';
  }
  
  /**
   * Assess degradation level from vegetation data
   */
  assessDegradation(vegetation) {
    const ndvi = vegetation?.ndvi || 0.5;
    if (ndvi < 0.2) return 'severe';
    if (ndvi < 0.4) return 'high';
    if (ndvi < 0.6) return 'moderate';
    return 'low';
  }
  
  /**
   * Calculate priority bonus based on project goals
   */
  calculatePriorityBonus(species, conditions, projectGoals) {
    let bonus = 0;
    
    // Fast growth bonus for degraded areas
    if (conditions.degradationLevel === 'severe' && 
        species.characteristics.growthRate === 'very_fast') {
      bonus += 15;
    } else if (conditions.degradationLevel === 'high' && 
               species.characteristics.growthRate === 'fast') {
      bonus += 10;
    }
    
    // Carbon sequestration priority
    if (projectGoals.carbonCredits && 
        species.characteristics.carbonSequestration > 12) {
      bonus += 8;
    }
    
    // Ecological restoration priority
    if (projectGoals.biodiversity && 
        species.characteristics.ecologicalValue > 8) {
      bonus += 8;
    }
    
    // Economic timber priority
    if (projectGoals.timber && 
        species.characteristics.woodValue === 'very_high') {
      bonus += 10;
    }
    
    // Nitrogen fixing for poor soils
    if (species.characteristics.nitrogenFixing && conditions.ph < 6.0) {
      bonus += 12;
    }
    
    return bonus;
  }
  
  /**
   * Calculate risk penalty
   */
  calculateRiskPenalty(species, conditions) {
    let penalty = 0;
    
    // Drought risk
    if (conditions.rainfall < 600 && 
        species.requirements.droughtTolerance === 'low') {
      penalty += 20;
    }
    
    // Extreme temperature
    if (conditions.temperature > 40 && 
        species.requirements.temperature.max < 40) {
      penalty += 15;
    }
    
    // pH mismatch
    const phDiff = Math.max(
      Math.abs(conditions.ph - species.requirements.phRange.min),
      Math.abs(conditions.ph - species.requirements.phRange.max)
    );
    if (phDiff > 1.5) {
      penalty += 10;
    }
    
    return penalty;
  }
  
  /**
   * Generate human-readable reasoning
   */
  generateReasoning(species, compatibility, conditions) {
    const reasons = [];
    
    compatibility.factors.forEach(factor => {
      if (factor.match === 'optimal') {
        reasons.push(`Optimal ${factor.name} conditions`);
      } else if (factor.match === 'acceptable' || factor.match === 'compatible') {
        reasons.push(`Suitable ${factor.name}`);
      }
    });
    
    if (species.characteristics.growthRate === 'very_fast') {
      reasons.push('Very fast growth rate');
    }
    
    if (species.characteristics.carbonSequestration > 10) {
      reasons.push('Excellent carbon sequestration');
    }
    
    if (species.characteristics.nitrogenFixing) {
      reasons.push('Improves soil nitrogen');
    }
    
    if (conditions.degradationLevel === 'severe' && 
        species.requirements.droughtTolerance === 'high') {
      reasons.push('High resilience in degraded areas');
    }
    
    return reasons.join('. ') + '.';
  }
  
  /**
   * Extract pros
   */
  extractPros(species) {
    const pros = [];
    
    if (species.characteristics.growthRate === 'very_fast') {
      pros.push('Very fast growth (3-5 years to maturity)');
    } else if (species.characteristics.growthRate === 'fast') {
      pros.push('Fast growth (5-8 years)');
    }
    
    if (species.requirements.droughtTolerance === 'very_high') {
      pros.push('Excellent drought tolerance');
    } else if (species.requirements.droughtTolerance === 'high') {
      pros.push('Good drought tolerance');
    }
    
    if (species.characteristics.carbonSequestration > 12) {
      pros.push(`High carbon capture (${species.characteristics.carbonSequestration} tonnes CO2/year)`);
    }
    
    if (species.characteristics.nitrogenFixing) {
      pros.push('Fixes atmospheric nitrogen, improves soil');
    }
    
    if (species.economicValue === 'very_high') {
      pros.push('High economic returns');
    }
    
    if (species.medicinalValue) {
      pros.push('Medicinal value');
    }
    
    return pros.slice(0, 4);
  }
  
  /**
   * Extract cons based on conditions
   */
  extractCons(species, conditions) {
    const cons = [];
    
    if (species.characteristics.maturityYears > 15) {
      cons.push(`Long maturity period (${species.characteristics.maturityYears} years)`);
    }
    
    if (conditions.rainfall < species.requirements.rainfall.min) {
      cons.push('May require supplemental irrigation');
    }
    
    if (Math.abs(conditions.ph - species.requirements.phRange.optimal[0]) > 0.8) {
      cons.push('Soil pH amendment recommended');
    }
    
    if (species.requirements.droughtTolerance === 'low' && conditions.rainfall < 1000) {
      cons.push('High water requirements');
    }
    
    if (species.characteristics.rootDepth === 'shallow') {
      cons.push('Vulnerable to wind damage');
    }
    
    return cons.slice(0, 3);
  }
  
  /**
   * Generate care plan
   */
  generateCarePlan(species, conditions) {
    const plan = {
      irrigation: this.getIrrigationPlan(species, conditions),
      fertilization: this.getFertilizationPlan(species, conditions),
      pruning: this.getPruningSchedule(species),
      monitoring: this.getMonitoringSchedule(species)
    };
    
    return plan;
  }
  
  getIrrigationPlan(species, conditions) {
    const deficit = species.requirements.rainfall.min - conditions.rainfall;
    
    if (deficit > 500) {
      return 'Twice weekly for first 2 years, then weekly';
    } else if (deficit > 0) {
      return 'Weekly for first year, then during dry season only';
    } else {
      return 'Natural rainfall sufficient, supplement only during extreme drought';
    }
  }
  
  getFertilizationPlan(species, conditions) {
    if (species.characteristics.nitrogenFixing) {
      return 'Minimal - species fixes own nitrogen. Apply phosphorus and potassium annually.';
    }
    
    if (conditions.ph < 6.0) {
      return 'Apply NPK (10:10:10) twice yearly + lime to raise pH';
    }
    
    return 'Apply organic compost annually, NPK (10:10:10) during monsoon';
  }
  
  getPruningSchedule(species) {
    if (species.characteristics.growthRate === 'very_fast') {
      return 'Formative pruning in year 1-2, maintenance pruning annually';
    }
    return 'Formative pruning in year 2-3, minimal maintenance thereafter';
  }
  
  getMonitoringSchedule(species) {
    return {
      year1: 'Weekly inspection, monthly health assessment',
      year2_3: 'Bi-weekly inspection, quarterly assessment',
      year4_plus: 'Monthly inspection, bi-annual assessment'
    };
  }
  
  /**
   * Generate expected outcomes
   */
  generateExpectedOutcomes(species) {
    return {
      year1: {
        height: `${(species.characteristics.maxHeight * 0.15).toFixed(1)}m`,
        survival: '85-95%',
        carbonStored: `${(species.characteristics.carbonSequestration * 0.05).toFixed(2)} tonnes CO2`
      },
      year5: {
        height: `${(species.characteristics.maxHeight * 0.5).toFixed(1)}m`,
        survival: '90-98%',
        carbonStored: `${(species.characteristics.carbonSequestration * 0.4).toFixed(1)} tonnes CO2`
      },
      maturity: {
        height: `${species.characteristics.maxHeight}m`,
        survival: '95-100%',
        carbonStored: `${species.characteristics.carbonSequestration} tonnes CO2/year`,
        economicValue: species.economicValue
      }
    };
  }

  /**
   * Returns a compact summary of all species in the database.
   * Used to feed the AI chatbot a catalogue it must choose from.
   */
  static getPlantDatabaseSummary() {
    return INDIAN_TREE_SPECIES.map(s => ({
      commonName: s.commonName,
      scientificName: s.scientificName,
      biome: s.biome,
      phRange: `${s.requirements.phRange.min}–${s.requirements.phRange.max}`,
      rainfall: `${s.requirements.rainfall.min}–${s.requirements.rainfall.max}mm`,
      temperature: `${s.requirements.temperature.min}–${s.requirements.temperature.max}°C`,
      droughtTolerance: s.requirements.droughtTolerance,
      growthRate: s.characteristics.growthRate,
      carbonSequestration: s.characteristics.carbonSequestration,
      economicValue: s.economicValue
    }));
  }
}

export default new SpeciesRecommendationEngine();
export { SpeciesRecommendationEngine };

