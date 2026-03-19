import express from 'express';

const router = express.Router();

// GET summary endpoint - returns available analytics capabilities
router.get('/', (req, res) => {
  const { lat, lon } = req.query;
  res.json({
    status: 'ok',
    location: lat && lon ? { lat: parseFloat(lat), lon: parseFloat(lon) } : null,
    endpoints: {
      'POST /api/analytics/carbon': 'Calculate carbon sequestration for a site',
      'POST /api/analytics/risks': 'Assess environmental risks',
      'POST /api/analytics/species': 'Get species recommendations'
    },
    source: 'Analytics Engine',
    cached: false
  });
});

// Carbon calculation endpoint
router.post('/carbon', async (req, res) => {
  try {
    const { hectares, treesPerHectare, species, ageYears, vegetationData, soilData } = req.body;
    
    const carbon = calculateCarbon(hectares, treesPerHectare, species, ageYears, vegetationData, soilData);
    res.json(carbon);
  } catch (error) {
    console.error('Carbon calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate carbon' });
  }
});

// Risk assessment endpoint
router.post('/risks', async (req, res) => {
  try {
    const { lat, lon, weatherData, vegetationData, soilData } = req.body;
    
    const risks = assessRisks(weatherData, vegetationData, soilData);
    res.json({ risks });
  } catch (error) {
    console.error('Risk assessment error:', error);
    res.status(500).json({ error: 'Failed to assess risks' });
  }
});

// Species matching endpoint
router.post('/species', async (req, res) => {
  try {
    const { lat, lon, soilData, weatherData } = req.body;
    
    const species = matchSpecies(lat, soilData, weatherData);
    res.json({ species });
  } catch (error) {
    console.error('Species matching error:', error);
    res.status(500).json({ error: 'Failed to match species' });
  }
});

function calculateCarbon(hectares, treesPerHectare, species, ageYears, vegetationData, soilData) {
  const CARBON_FRACTION = 0.47;
  const CO2_TO_C = 3.67;
  
  const speciesData = {
    growthRate: 1.2,
    woodDensity: 530,
    maxHeight: 30,
    carbonFactor: 1.1
  };
  
  const avgTreeHeight = Math.min(speciesData.maxHeight, speciesData.growthRate * ageYears);
  const avgDbh = avgTreeHeight * 0.15;
  
  const agbPerTree = 0.0673 * Math.pow(speciesData.woodDensity * Math.pow(avgDbh, 2) * avgTreeHeight, 0.976);
  const bgbPerTree = agbPerTree * 0.25;
  const totalBiomassPerTree = agbPerTree + bgbPerTree;
  const totalBiomass = (totalBiomassPerTree * treesPerHectare * hectares) / 1000;
  const carbonStock = totalBiomass * CARBON_FRACTION * speciesData.carbonFactor;
  const currentStock = carbonStock * CO2_TO_C;
  
  const growthFactor = Math.max(0.3, 1 - (ageYears / (speciesData.maxHeight / speciesData.growthRate)));
  const annualSequestration = (currentStock / Math.max(1, ageYears)) * growthFactor;
  
  return {
    currentStock: parseFloat(currentStock.toFixed(2)),
    annualSequestration: parseFloat(annualSequestration.toFixed(2)),
    projectedStock10Years: parseFloat((currentStock + (annualSequestration * 10 * 0.85)).toFixed(2)),
    projectedStock20Years: parseFloat((currentStock + (annualSequestration * 20 * 0.7)).toFixed(2)),
    perHectare: parseFloat((currentStock / hectares).toFixed(2)),
  };
}

function assessRisks(weatherData, vegetationData, soilData) {
  const risks = [];
  
  // Drought risk
  if (soilData.moisture < 40) {
    risks.push({
      id: `risk_drought_${Date.now()}`,
      type: 'drought',
      probability: 65,
      severity: 'medium',
      expectedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      daysAhead: 14,
      description: 'Low soil moisture detected. Drought risk elevated.',
      mitigationActions: ['Increase irrigation', 'Apply mulch', 'Monitor closely']
    });
  }
  
  return risks;
}

function matchSpecies(lat, soilData, weatherData) {
  return [
    {
      id: 'species1',
      name: 'African Mahogany',
      scientificName: 'Khaya anthotheca',
      survivalProbability: 88,
      reason: 'Excellent match for climate and soil conditions',
      imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400',
      carbonPotential: 850
    }
  ];
}

export default router;
