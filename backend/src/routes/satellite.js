import express from 'express';
import NodeCache from 'node-cache';

const router = express.Router();
const cache = new NodeCache({ stdTTL: 604800 }); // 7 days

router.get('/vegetation', async (req, res) => {
  try {
    const { lat, lon, nocache } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const cacheKey = `vegetation_${lat}_${lon}`;
    
    // Check if cache bypass is requested
    if (nocache !== 'true') {
      const cached = cache.get(cacheKey);
      
      if (cached) {
        console.log(`✓ Satellite: Returning CACHED data for ${lat}, ${lon} (7 day cache)`);
        return res.json({ ...cached, cached: true, cacheInfo: 'Data from cache (7 day TTL)' });
      }
    } else {
      console.log(`🔄 Satellite: Cache bypass requested for ${lat}, ${lon}`);
    }

    console.log(`🌐 Satellite: Generating vegetation data for ${lat}, ${lon}...`);
    const vegetationData = getMockVegetationData(parseFloat(lat), parseFloat(lon));
    console.log('✅ Vegetation data generated (Note: Using mock data - Sentinel Hub integration pending)');
    cache.set(cacheKey, vegetationData);
    res.json({ ...vegetationData, cached: false, cacheInfo: 'Fresh mock data (Sentinel Hub integration pending)' });
  } catch (error) {
    console.error('Satellite route error:', error);
    res.status(500).json({ error: 'Failed to fetch vegetation data' });
  }
});

function getMockVegetationData(lat, lon) {
  // Location-aware NDVI based on known biome characteristics
  // Uses a deterministic seed from lat/lon so same location always returns same value
  const seed = (Math.abs(lat * 1000) + Math.abs(lon * 1000)) % 100;
  const jitter = (seed % 15 - 7) / 100; // ±0.07 deterministic jitter

  let baseNdvi;
  const absLat = Math.abs(lat);

  // Arid/desert zones (Rajasthan, Sahara, Arabian Peninsula)
  if ((lat > 20 && lat < 35 && lon > 60 && lon < 80) ||  // Rajasthan/Thar
      (lat > 15 && lat < 35 && lon > 35 && lon < 60)) {   // Middle East
    baseNdvi = 0.18;
  }
  // Tropical rainforest (Western Ghats, NE India, Sundarbans)
  else if (absLat < 15 && lon > 70 && lon < 100) {
    baseNdvi = 0.72;
  }
  // Sundarbans / Bengal delta
  else if (lat > 20 && lat < 24 && lon > 87 && lon < 92) {
    baseNdvi = 0.68;
  }
  // Deccan plateau / central India
  else if (lat > 15 && lat < 25 && lon > 75 && lon < 85) {
    baseNdvi = 0.48;
  }
  // Himalayan foothills
  else if (lat > 25 && lat < 32 && lon > 75 && lon < 90) {
    baseNdvi = 0.55;
  }
  // Equatorial (< 10°)
  else if (absLat < 10) {
    baseNdvi = 0.75;
  }
  // Tropical (10-23.5°)
  else if (absLat < 23.5) {
    baseNdvi = 0.55;
  }
  // Subtropical / temperate
  else {
    baseNdvi = 0.42;
  }

  const ndvi = Math.max(0.05, Math.min(0.95, baseNdvi + jitter));
  const healthScore = Math.round(ndvi * 100 * 1.05); // slightly above NDVI
  const coverage = Math.round(ndvi * 100 * 1.1);

  return {
    ndvi: parseFloat(ndvi.toFixed(3)),
    evi: parseFloat((ndvi * 0.85).toFixed(3)),
    coverage: Math.min(100, coverage),
    healthScore: Math.min(100, healthScore),
    changeRate: parseFloat(((seed % 10 - 3) / 10).toFixed(2)), // deterministic -0.3 to +0.7
    lastUpdated: new Date().toISOString(),
    timestamp: new Date().toISOString(),
    source: 'Biome-calibrated estimate'
  };
}

// Cache management endpoints
router.get('/cache/stats', (req, res) => {
  const keys = cache.keys();
  res.json({
    totalCached: keys.length,
    keys: keys,
    ttl: '7 days'
  });
});

router.delete('/cache/clear', (req, res) => {
  const keyCount = cache.keys().length;
  cache.flushAll();
  console.log('🗑️  Satellite cache cleared');
  res.json({ 
    message: 'Satellite cache cleared',
    clearedKeys: keyCount
  });
});

export default router;
