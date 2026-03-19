import { SoilService, SoilData } from '../soilService';
import { ClimateService, ClimateData } from '../climateService';
import { VegetationService, VegetationData } from '../vegetationService';

export interface LandScoreResult {
  overallScore: number;
  priority: 'High' | 'Medium' | 'Low';
  componentScores: {
    soil: number;
    climate: number;
    vegetation: number;
  };
  weights: {
    soil: number;
    climate: number;
    vegetation: number;
  };
  explainability: {
    reasoning: string[];
    keyFactors: string[];
    limitations: string[];
  };
}

export class LandScoring {
  private static readonly DEFAULT_WEIGHTS = {
    vegetation: 0.4,
    soil: 0.3,
    climate: 0.3
  };

  static calculateLandScore(
    soil: SoilData,
    climate: ClimateData,
    vegetation: VegetationData,
    customWeights?: Partial<typeof LandScoring.DEFAULT_WEIGHTS>
  ): LandScoreResult {
    const weights = { ...this.DEFAULT_WEIGHTS, ...customWeights };

    // Calculate individual component scores
    const soilScore = SoilService.getSoilScore(soil);
    const climateScore = ClimateService.getClimateScore(climate);
    const vegetationScore = VegetationService.getVegetationScore(vegetation);

    // Calculate weighted overall score
    const overallScore = Math.round(
      vegetationScore * weights.vegetation +
      soilScore * weights.soil +
      climateScore * weights.climate
    );

    // Determine priority
    const priority = VegetationService.getRestorationPriority(vegetation, soilScore, climateScore);

    // Generate explainability
    const explainability = this.generateExplainability(
      soil,
      climate,
      vegetation,
      soilScore,
      climateScore,
      vegetationScore,
      overallScore
    );

    return {
      overallScore,
      priority,
      componentScores: {
        soil: soilScore,
        climate: climateScore,
        vegetation: vegetationScore
      },
      weights,
      explainability
    };
  }

  private static generateExplainability(
    soil: SoilData,
    climate: ClimateData,
    vegetation: VegetationData,
    soilScore: number,
    climateScore: number,
    vegetationScore: number,
    overallScore: number
  ): LandScoreResult['explainability'] {
    const reasoning: string[] = [];
    const keyFactors: string[] = [];
    const limitations: string[] = [];

    // Vegetation analysis
    if (vegetationScore > 70) {
      reasoning.push(`Healthy vegetation cover (${vegetation.vegetationIndex.toFixed(2)} NDVI) indicates good growing conditions`);
      keyFactors.push('High vegetation index');
    } else if (vegetationScore < 30) {
      reasoning.push(`Severely degraded land (${vegetation.vegetationIndex.toFixed(2)} NDVI) requires urgent intervention`);
      keyFactors.push('Severe land degradation');
    }

    // Soil analysis
    if (soil.ph >= 6.0 && soil.ph <= 7.0) {
      reasoning.push(`Optimal soil pH (${soil.ph.toFixed(1)}) supports most tree species`);
      keyFactors.push('Ideal soil pH');
    } else if (soil.ph < 5.5 || soil.ph > 7.5) {
      reasoning.push(`Soil pH (${soil.ph.toFixed(1)}) may limit species selection`);
      keyFactors.push('Soil pH constraints');
    }

    if (soil.organic_matter > 2.5) {
      reasoning.push(`High organic matter (${soil.organic_matter.toFixed(1)}%) indicates fertile soil`);
      keyFactors.push('Rich soil organic content');
    }

    // Climate analysis
    if (climate.rainfall >= 800 && climate.rainfall <= 1500) {
      reasoning.push(`Adequate rainfall (${climate.rainfall}mm annually) supports forest growth`);
      keyFactors.push('Suitable rainfall');
    } else if (climate.rainfall < 500) {
      reasoning.push(`Low rainfall (${climate.rainfall}mm) requires drought-tolerant species`);
      keyFactors.push('Water limitation');
    }

    // Priority reasoning
    if (vegetation.degradationLevel === 'severe' && overallScore > 40) {
      reasoning.push(`High priority due to severe degradation but good restoration potential`);
      keyFactors.push('Urgent restoration needed');
    }

    // Limitations
    limitations.push('Based on interpolated data from nearby measurement points');
    limitations.push('Does not account for local microclimate variations');
    limitations.push('Soil analysis limited to surface layers (0-30cm)');
    if (Math.abs(soil.ph - 6.5) > 1) {
      limitations.push('Soil pH may require amendment for optimal growth');
    }

    return {
      reasoning,
      keyFactors,
      limitations
    };
  }

  static getScoreInterpretation(score: number): {
    category: string;
    color: string;
    description: string;
  } {
    if (score >= 80) {
      return {
        category: 'Excellent',
        color: '#22c55e',
        description: 'Highly suitable for reforestation with minimal intervention'
      };
    } else if (score >= 60) {
      return {
        category: 'Good',
        color: '#84cc16',
        description: 'Suitable for reforestation with moderate preparation'
      };
    } else if (score >= 40) {
      return {
        category: 'Moderate',
        color: '#eab308',
        description: 'Requires significant site preparation and species selection'
      };
    } else if (score >= 20) {
      return {
        category: 'Poor',
        color: '#f97316',
        description: 'Challenging site requiring intensive restoration efforts'
      };
    } else {
      return {
        category: 'Very Poor',
        color: '#ef4444',
        description: 'Extremely challenging, may require alternative approaches'
      };
    }
  }
}
