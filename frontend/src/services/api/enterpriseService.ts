// Enterprise Service - Strategic Site & Species Matching
// Follows exact workflow: Planning → Planting → Monitoring → Prediction → Intervention → Reporting → Repeat

export interface SiteCoordinates {
  lat: number;
  lng: number;
  regionName?: string;
}

export interface EnterpriseWorkflowResponse {
  success: boolean;
  workflow: {
    step1_mapInteraction: any;
    step2_satelliteAnalysis: any;
    step3_soilClimateAnalysis: any;
    step4_speciesRecommendations: any;
    summary: any;
  };
  visualization: {
    priorityZone: {
      level: 'high' | 'medium' | 'low';
      score: number;
      color: string;
    };
    landCondition: any;
    environmentalFactors: any;
    topRecommendations: any[];
  };
  metadata: {
    workflowVersion: string;
    processingTime: number;
    confidence: number;
    nextSteps: string[];
    timeline: any;
  };
}

export interface PriorityZone {
  lat: number;
  lng: number;
  priority: number;
  region: string;
  color: string;
  label: string;
}

export interface SpeciesInfo {
  name: string;
  scientificName: string;
  nativeRegions: string[];
  growthRate: string;
  maturityYears: number;
  ecologicalValue: number;
  uses: string[];
  requirements: any;
}

class EnterpriseService {
  private static readonly API_BASE = 'http://localhost:3001/api/enterprise';

  // MAIN ENTERPRISE WORKFLOW - Strategic Site & Species Matching
  static async analyzeRestorationSite(coordinates: SiteCoordinates): Promise<EnterpriseWorkflowResponse> {
    try {
      const response = await fetch(`${this.API_BASE}/analyze-restoration-site`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(coordinates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Enterprise workflow error:', error);
      throw error;
    }
  }

  // Get priority zones for map visualization
  static async getPriorityZones(): Promise<PriorityZone[]> {
    try {
      const response = await fetch(`${this.API_BASE}/priority-zones`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch priority zones');
      }

      const data = await response.json();
      return data.zones;
    } catch (error) {
      console.error('Priority zones error:', error);
      // Return mock data for demo
      return this.getMockPriorityZones();
    }
  }

  // Get species database for reference
  static async getSpeciesDatabase(): Promise<SpeciesInfo[]> {
    try {
      const response = await fetch(`${this.API_BASE}/species-database`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch species database');
      }

      const data = await response.json();
      return data.species;
    } catch (error) {
      console.error('Species database error:', error);
      return this.getMockSpeciesDatabase();
    }
  }

  // Get workflow status
  static async getWorkflowStatus(): Promise<any> {
    try {
      const response = await fetch(`${this.API_BASE}/workflow-status`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch workflow status');
      }

      const data = await response.json();
      return data.status;
    } catch (error) {
      console.error('Workflow status error:', error);
      return this.getMockWorkflowStatus();
    }
  }

  // Mock data methods for fallback
  private static getMockPriorityZones(): PriorityZone[] {
    return [
      { lat: 1.37, lng: 32.29, priority: 85, region: 'Central Uganda', color: '#ef4444', label: 'Central Uganda (85% priority)' },
      { lat: 6.7, lng: -1.5, priority: 72, region: 'Southern Ghana', color: '#ef4444', label: 'Southern Ghana (72% priority)' },
      { lat: -0.5, lng: 35.5, priority: 68, region: 'Western Kenya', color: '#f59e0b', label: 'Western Kenya (68% priority)' },
      { lat: 1.1, lng: 34.5, priority: 45, region: 'Western Kenya', color: '#f59e0b', label: 'Western Kenya (45% priority)' },
      { lat: 9.0, lng: 8.0, priority: 38, region: 'Central Nigeria', color: '#10b981', label: 'Central Nigeria (38% priority)' }
    ];
  }

  private static getMockSpeciesDatabase(): SpeciesInfo[] {
    return [
      {
        name: 'Teak',
        scientificName: 'Tectona grandis',
        nativeRegions: ['central_india', 'western_ghats', 'eastern_himalayas'],
        growthRate: 'medium',
        maturityYears: 20,
        ecologicalValue: 8,
        uses: ['timber', 'construction', 'furniture'],
        requirements: {
          phRange: [6.0, 7.5],
          rainfallRange: [1200, 2500],
          temperatureRange: [22, 35],
          soilTypes: ['loamy', 'clay'],
          droughtTolerance: 'low'
        }
      },
      {
        name: 'Sal',
        scientificName: 'Shorea robusta',
        nativeRegions: ['central_india', 'eastern_india', 'himalayan_foothills'],
        growthRate: 'slow',
        maturityYears: 25,
        ecologicalValue: 9,
        uses: ['timber', 'resin', 'medicinal'],
        requirements: {
          phRange: [5.5, 7.0],
          rainfallRange: [1000, 2000],
          temperatureRange: [18, 30],
          soilTypes: ['loamy', 'sandy_loam'],
          droughtTolerance: 'medium'
        }
      },
      {
        name: 'Neem',
        scientificName: 'Azadirachta indica',
        nativeRegions: ['peninsular_india', 'dry_zones'],
        growthRate: 'fast',
        maturityYears: 5,
        ecologicalValue: 7,
        uses: ['medicinal', 'shade', 'pest_control'],
        requirements: {
          phRange: [5.5, 8.0],
          rainfallRange: [400, 1200],
          temperatureRange: [20, 40],
          soilTypes: ['sandy', 'loamy', 'clay'],
          droughtTolerance: 'very_high'
        }
      }
    ];
  }

  private static getMockWorkflowStatus() {
    return {
      currentPhase: 'Strategic Site & Species Matching',
      overallProgress: 'planning_phase',
      availableFeatures: [
        'Satellite vegetation analysis',
        'Soil and climate assessment', 
        'Native species recommendations',
        'Priority zone mapping',
        'Restoration planning'
      ],
      upcomingFeatures: [
        'Planting phase tracking',
        'Growth monitoring',
        'Predictive analytics',
        'Intervention recommendations',
        'Impact reporting'
      ]
    };
  }

  // Utility method to format workflow results for UI
  static formatWorkflowForUI(workflow: EnterpriseWorkflowResponse) {
    const { step2_satelliteAnalysis, step3_soilClimateAnalysis, step4_speciesRecommendations, summary } = workflow.workflow;
    
    return {
      // Step 1: Map Interaction (already have coordinates)
      siteInfo: {
        coordinates: workflow.workflow.step1_mapInteraction.data,
        selectedRegion: workflow.workflow.step1_mapInteraction.data.regionName
      },
      
      // Step 2: Satellite Analysis
      satelliteData: {
        ndvi: step2_satelliteAnalysis.data?.ndvi || 0,
        landCover: step2_satelliteAnalysis.data?.landCover || {},
        degradationLevel: step2_satelliteAnalysis.data?.degradationLevel || 'unknown',
        restorationPriority: step2_satelliteAnalysis.data?.restorationPriority || 0,
        deforestationZones: step2_satelliteAnalysis.data?.deforestationZones || {},
        sources: step2_satelliteAnalysis.data?.metadata?.sources || []
      },
      
      // Step 3: Soil & Climate Analysis
      environmentalData: {
        soil: step3_soilClimateAnalysis.data?.soil || {},
        climate: step3_soilClimateAnalysis.data?.climate || {},
        combinedSuitability: step3_soilClimateAnalysis.data?.combinedSuitability || 0,
        sources: step3_soilClimateAnalysis.data?.metadata?.sources || []
      },
      
      // Step 4: Species Recommendations
      speciesRecommendations: step4_speciesRecommendations.data?.recommendedSpecies || [],
      analysisContext: step4_speciesRecommendations.data?.analysisContext || {},
      
      // Summary & Visualization
      summary: summary,
      visualization: workflow.visualization,
      metadata: workflow.metadata
    };
  }
}

export default EnterpriseService;
