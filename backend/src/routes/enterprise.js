// Enterprise Route - Strategic Site & Species Matching
// Follows exact workflow: Planning → Planting → Monitoring → Prediction → Intervention → Reporting → Repeat

import express from 'express';
import enterpriseWorkflow from '../services/enterpriseWorkflow.js';

const router = express.Router();

// MAIN ENTERPRISE WORKFLOW ENDPOINT
// Step 1: Strategic Site & Species Matching (Initial Planning Phase)
router.post('/analyze-restoration-site', async (req, res) => {
  try {
    const { lat, lng, regionName } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        error: 'Coordinates required',
        message: 'Please provide latitude and longitude for site analysis'
      });
    }

    console.log(`🌍 Starting Enterprise Workflow for: ${regionName || `${lat}, ${lng}`}`);
    
    // Execute the complete enterprise workflow
    const workflow = await enterpriseWorkflow.analyzeSiteForRestoration({
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      regionName: regionName || `Site_${lat}_${lng}`
    });

    // Return structured response for frontend
    res.json({
      success: true,
      workflow: {
        step1_mapInteraction: workflow.step1,
        step2_satelliteAnalysis: workflow.step2,
        step3_soilClimateAnalysis: workflow.step3,
        step4_speciesRecommendations: workflow.step4,
        summary: workflow.summary
      },
      visualization: {
        priorityZone: {
          level: workflow.summary.restorationPriority > 70 ? 'high' :
                 workflow.summary.restorationPriority > 40 ? 'medium' : 'low',
          score: workflow.summary.restorationPriority,
          color: workflow.summary.restorationPriority > 70 ? '#ef4444' :
                 workflow.summary.restorationPriority > 40 ? '#f59e0b' : '#10b981'
        },
        landCondition: workflow.summary.landCondition,
        environmentalFactors: workflow.summary.environmentalConditions,
        topRecommendations: workflow.summary.recommendations.topSpecies
      },
      metadata: {
        workflowVersion: '1.0',
        processingTime: Date.now(),
        confidence: workflow.summary.confidence,
        nextSteps: workflow.summary.nextSteps,
        timeline: workflow.summary.estimatedTimeline
      }
    });

  } catch (error) {
    console.error('Enterprise workflow error:', error);
    res.status(500).json({
      success: false,
      error: 'Workflow execution failed',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET PRIORITY ZONES (for map visualization)
router.get('/priority-zones', async (req, res) => {
  try {
    // This would typically query a database of pre-analyzed sites
    // For demo, return sample priority zones
    const priorityZones = [
      { lat: 1.37, lng: 32.29, priority: 85, region: 'Central Uganda' },
      { lat: 6.7, lng: -1.5, priority: 72, region: 'Southern Ghana' },
      { lat: -0.5, lng: 35.5, priority: 68, region: 'Western Kenya' },
      { lat: 1.1, lng: 34.5, priority: 45, region: 'Western Kenya' },
      { lat: 9.0, lng: 8.0, priority: 38, region: 'Central Nigeria' }
    ];

    res.json({
      success: true,
      zones: priorityZones.map(zone => ({
        ...zone,
        color: zone.priority > 70 ? '#ef4444' :
               zone.priority > 40 ? '#f59e0b' : '#10b981',
        label: `${zone.region} (${zone.priority}% priority)`
      }))
    });
  } catch (error) {
    console.error('Priority zones error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET SPECIES DATABASE (for reference)
router.get('/species-database', async (req, res) => {
  try {
    const speciesDatabase = enterpriseWorkflow.getNativeSpeciesDatabase();
    
    res.json({
      success: true,
      species: speciesDatabase.map(species => ({
        name: species.name,
        scientificName: species.scientificName,
        nativeRegions: species.nativeRegions,
        growthRate: species.characteristics.growthRate,
        maturityYears: species.characteristics.maturityYears,
        ecologicalValue: species.characteristics.ecologicalValue,
        uses: species.uses,
        requirements: species.requirements
      }))
    });
  } catch (error) {
    console.error('Species database error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// WORKFLOW STATUS CHECK
router.get('/workflow-status', async (req, res) => {
  res.json({
    success: true,
    status: {
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
    }
  });
});

export default router;
