// Carbon Sequestration Calculator
import { VegetationData } from '../api/satelliteService';
import { SoilData } from '../api/soilService';

export interface CarbonEstimate {
  currentStock: number; // tonnes CO2
  annualSequestration: number; // tonnes CO2/year
  projectedStock10Years: number; // tonnes CO2
  projectedStock20Years: number; // tonnes CO2
  perHectare: number; // tonnes CO2/ha
}

export interface SpeciesCarbonData {
  speciesName: string;
  growthRate: number; // m/year
  woodDensity: number; // kg/m³
  maxHeight: number; // meters
  carbonFactor: number; // multiplier
}

class CarbonCalculator {
  // Average carbon content in dry biomass (IPCC default)
  private readonly CARBON_FRACTION = 0.47;
  
  // CO2 to Carbon conversion factor
  private readonly CO2_TO_C = 3.67;

  // Species-specific carbon data
  private speciesData: Record<string, SpeciesCarbonData> = {
    'Khaya anthotheca': { speciesName: 'African Mahogany', growthRate: 1.2, woodDensity: 530, maxHeight: 30, carbonFactor: 1.1 },
    'Prunus africana': { speciesName: 'Prunus africana', growthRate: 0.8, woodDensity: 580, maxHeight: 25, carbonFactor: 1.0 },
    'Juniperus procera': { speciesName: 'East African Cedar', growthRate: 0.6, woodDensity: 480, maxHeight: 40, carbonFactor: 1.2 },
    'Yushania alpina': { speciesName: 'Bamboo', growthRate: 3.0, woodDensity: 600, maxHeight: 15, carbonFactor: 0.9 },
    'Milicia excelsa': { speciesName: 'Iroko', growthRate: 1.0, woodDensity: 560, maxHeight: 35, carbonFactor: 1.15 },
    'Shorea spp.': { speciesName: 'Meranti', growthRate: 1.5, woodDensity: 520, maxHeight: 45, carbonFactor: 1.3 },
    'Tectona grandis': { speciesName: 'Teak', growthRate: 1.3, woodDensity: 630, maxHeight: 30, carbonFactor: 1.2 },
    'Bertholletia excelsa': { speciesName: 'Brazil Nut', growthRate: 0.9, woodDensity: 700, maxHeight: 50, carbonFactor: 1.4 },
    'Ceiba pentandra': { speciesName: 'Ceiba', growthRate: 2.0, woodDensity: 350, maxHeight: 60, carbonFactor: 1.5 },
  };

  /**
   * Calculate carbon sequestration for a reforestation site
   */
  calculateSiteCarbon(
    hectares: number,
    treesPerHectare: number,
    speciesScientificName: string,
    ageYears: number,
    vegetationData?: VegetationData,
    soilData?: SoilData
  ): CarbonEstimate {
    const species = this.speciesData[speciesScientificName] || this.getDefaultSpeciesData();
    
    // Calculate current biomass
    const avgTreeHeight = Math.min(species.maxHeight, species.growthRate * ageYears);
    const avgDbh = avgTreeHeight * 0.15; // Diameter at breast height (rough estimate)
    
    // Allometric equation for above-ground biomass (simplified)
    // AGB = 0.0673 × (ρ × D² × H)^0.976
    const agbPerTree = 0.0673 * Math.pow(species.woodDensity * Math.pow(avgDbh, 2) * avgTreeHeight, 0.976);
    
    // Below-ground biomass (typically 20-30% of AGB)
    const bgbPerTree = agbPerTree * 0.25;
    
    // Total biomass per tree (kg)
    const totalBiomassPerTree = agbPerTree + bgbPerTree;
    
    // Total biomass for site (tonnes)
    const totalBiomass = (totalBiomassPerTree * treesPerHectare * hectares) / 1000;
    
    // Carbon stock (tonnes C)
    const carbonStock = totalBiomass * this.CARBON_FRACTION * species.carbonFactor;
    
    // CO2 equivalent (tonnes CO2)
    const currentStock = carbonStock * this.CO2_TO_C;
    
    // Annual sequestration rate (decreases with age)
    const growthFactor = Math.max(0.3, 1 - (ageYears / (species.maxHeight / species.growthRate)));
    const annualSequestration = (currentStock / Math.max(1, ageYears)) * growthFactor;
    
    // Adjust based on vegetation health if available
    let healthMultiplier = 1.0;
    if (vegetationData) {
      healthMultiplier = vegetationData.healthScore / 100;
    }
    
    // Adjust based on soil quality if available
    let soilMultiplier = 1.0;
    if (soilData) {
      soilMultiplier = this.calculateSoilQualityMultiplier(soilData);
    }
    
    const adjustedAnnualSequestration = annualSequestration * healthMultiplier * soilMultiplier;
    
    // Project future stocks
    const projectedStock10Years = currentStock + (adjustedAnnualSequestration * 10 * 0.85); // 15% reduction for uncertainty
    const projectedStock20Years = currentStock + (adjustedAnnualSequestration * 20 * 0.7); // 30% reduction for long-term uncertainty
    
    return {
      currentStock: parseFloat(currentStock.toFixed(2)),
      annualSequestration: parseFloat(adjustedAnnualSequestration.toFixed(2)),
      projectedStock10Years: parseFloat(projectedStock10Years.toFixed(2)),
      projectedStock20Years: parseFloat(projectedStock20Years.toFixed(2)),
      perHectare: parseFloat((currentStock / hectares).toFixed(2)),
    };
  }

  /**
   * Calculate soil quality multiplier for carbon sequestration
   */
  private calculateSoilQualityMultiplier(soilData: SoilData): number {
    let multiplier = 1.0;
    
    // pH factor (optimal range 6.0-7.0)
    if (soilData.ph >= 6.0 && soilData.ph <= 7.0) {
      multiplier *= 1.1;
    } else if (soilData.ph < 5.5 || soilData.ph > 7.5) {
      multiplier *= 0.85;
    }
    
    // Nutrient factors
    const nutrientScore = 
      (soilData.nitrogen === 'high' ? 1.1 : soilData.nitrogen === 'medium' ? 1.0 : 0.9) *
      (soilData.phosphorus === 'high' ? 1.05 : soilData.phosphorus === 'medium' ? 1.0 : 0.95) *
      (soilData.potassium === 'high' ? 1.05 : soilData.potassium === 'medium' ? 1.0 : 0.95);
    
    multiplier *= nutrientScore;
    
    // Moisture factor (optimal range 50-70%)
    if (soilData.moisture >= 50 && soilData.moisture <= 70) {
      multiplier *= 1.1;
    } else if (soilData.moisture < 40 || soilData.moisture > 80) {
      multiplier *= 0.9;
    }
    
    return multiplier;
  }

  /**
   * Calculate carbon sequestration potential for species selection
   */
  calculateSpeciesPotential(
    speciesScientificName: string,
    hectares: number,
    years: number = 20
  ): number {
    const species = this.speciesData[speciesScientificName] || this.getDefaultSpeciesData();
    const treesPerHectare = 400; // Standard density
    
    const estimate = this.calculateSiteCarbon(
      hectares,
      treesPerHectare,
      speciesScientificName,
      years
    );
    
    return estimate.currentStock;
  }

  /**
   * Compare carbon sequestration across multiple species
   */
  compareSpecies(
    speciesList: string[],
    hectares: number,
    years: number = 20
  ): Array<{ species: string; carbonPotential: number; ranking: number }> {
    const results = speciesList.map(species => ({
      species,
      carbonPotential: this.calculateSpeciesPotential(species, hectares, years),
      ranking: 0,
    }));
    
    // Sort by carbon potential and assign rankings
    results.sort((a, b) => b.carbonPotential - a.carbonPotential);
    results.forEach((result, index) => {
      result.ranking = index + 1;
    });
    
    return results;
  }

  private getDefaultSpeciesData(): SpeciesCarbonData {
    return {
      speciesName: 'Generic Tree',
      growthRate: 1.0,
      woodDensity: 500,
      maxHeight: 25,
      carbonFactor: 1.0,
    };
  }

  /**
   * Calculate total ecosystem carbon (trees + soil)
   */
  calculateEcosystemCarbon(
    treeCarbon: number,
    hectares: number,
    soilData?: SoilData
  ): { total: number; trees: number; soil: number } {
    const trees = treeCarbon;
    
    // Soil organic carbon (typical range: 30-100 tonnes C/ha)
    let soilCarbonPerHa = 50; // default
    if (soilData) {
      soilCarbonPerHa = soilData.organicCarbon * 3; // Rough conversion
    }
    
    const soil = soilCarbonPerHa * hectares * this.CO2_TO_C;
    const total = trees + soil;
    
    return {
      total: parseFloat(total.toFixed(2)),
      trees: parseFloat(trees.toFixed(2)),
      soil: parseFloat(soil.toFixed(2)),
    };
  }
}

export const carbonCalculator = new CarbonCalculator();
