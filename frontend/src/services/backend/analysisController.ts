import { SoilService } from './soilService';
import { ClimateService } from './climateService';
import { VegetationService } from './vegetationService';
import { LandScoring } from './logic/landScoring';
import { SpeciesMatcher } from './logic/speciesMatcher';

export interface SiteAnalysisRequest {
  lat: number;
  lng: number;
}

export interface SiteAnalysisResponse {
  landScore: number;
  priority: 'High' | 'Medium' | 'Low';
  soil: any;
  climate: any;
  vegetation: any;
  recommendedSpecies: any[];
  metadata: {
    location: { lat: number; lng: number };
    analysisDate: string;
    dataConfidence: {
      soil: number;
      climate: number;
      vegetation: number;
    };
    processingTime: number;
  };
}

export class AnalysisController {
  static async analyzeSite(request: SiteAnalysisRequest): Promise<SiteAnalysisResponse> {
    const startTime = Date.now();
    
    try {
      // Step 1: Gather environmental data from all services
      const [soilResponse, climateResponse, vegetationResponse] = await Promise.all([
        SoilService.getSoilData(request.lat, request.lng),
        ClimateService.getClimateData(request.lat, request.lng),
        VegetationService.getVegetationData(request.lat, request.lng)
      ]);

      // Step 2: Calculate land suitability score
      const landScoreResult = LandScoring.calculateLandScore(
        soilResponse.data,
        climateResponse.data,
        vegetationResponse.data
      );

      // Step 3: Get species recommendations
      const recommendedSpecies = SpeciesMatcher.getRecommendedSpecies(
        soilResponse.data,
        climateResponse.data,
        landScoreResult.overallScore,
        5 // Return top 5 recommendations
      );

      // Step 4: Calculate processing time
      const processingTime = Date.now() - startTime;

      // Step 5: Assemble response
      const response: SiteAnalysisResponse = {
        landScore: landScoreResult.overallScore,
        priority: landScoreResult.priority,
        soil: {
          ...soilResponse.data,
          confidence: soilResponse.confidence,
          source: soilResponse.source
        },
        climate: {
          ...climateResponse.data,
          confidence: climateResponse.confidence,
          source: climateResponse.source
        },
        vegetation: {
          ...vegetationResponse.data,
          confidence: vegetationResponse.confidence,
          source: vegetationResponse.source
        },
        recommendedSpecies: recommendedSpecies.map(rec => ({
          name: rec.species.name,
          scientificName: rec.species.scientificName,
          survivalProbability: Math.round(rec.survivalProbability * 100),
          matchScore: Math.round(rec.matchScore * 100),
          reason: rec.reason,
          pros: rec.pros,
          cons: rec.cons,
          growthRate: rec.species.growthRate,
          maturityYears: rec.species.maturityYears,
          height: rec.species.height,
          uses: rec.species.uses,
          carbonSequestration: rec.species.carbonSequestration,
          biodiversityValue: rec.species.biodiversityValue,
          suitabilityFactors: rec.suitabilityFactors
        })),
        metadata: {
          location: { lat: request.lat, lng: request.lng },
          analysisDate: new Date().toISOString(),
          dataConfidence: {
            soil: soilResponse.confidence,
            climate: climateResponse.confidence,
            vegetation: vegetationResponse.confidence
          },
          processingTime
        }
      };

      return response;
    } catch (error) {
      console.error('Error in site analysis:', error);
      throw new Error(`Site analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getBatchAnalysis(requests: SiteAnalysisRequest[]): Promise<SiteAnalysisResponse[]> {
    // Process multiple sites in parallel
    const analyses = await Promise.allSettled(
      requests.map(request => this.analyzeSite(request))
    );

    // Filter out failed analyses and return successful ones
    return analyses
      .filter((result): result is PromiseFulfilledResult<SiteAnalysisResponse> => result.status === 'fulfilled')
      .map(result => result.value);
  }

  static validateRequest(request: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.lat || typeof request.lat !== 'number' || request.lat < -90 || request.lat > 90) {
      errors.push('Latitude must be a number between -90 and 90');
    }

    if (!request.lng || typeof request.lng !== 'number' || request.lng < -180 || request.lng > 180) {
      errors.push('Longitude must be a number between -180 and 180');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
