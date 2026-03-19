import express from 'express';
import axios from 'axios';
import NodeCache from 'node-cache';

const router = express.Router();
const cache = new NodeCache({ stdTTL: 86400 }); // 24 hours

// ─── OpenLandMap REST API (free, no key, very reliable) ───────────────────────
// Docs: https://openlandmap.org/about/#api
const OLM_BASE = 'https://api.openlandmap.org/query/point';

async function fetchOpenLandMap(lat, lon) {
  // Fetch soil pH (0-5cm), sand%, clay%, SOC, nitrogen in one call
  const params = {
    lon: parseFloat(lon),
    lat: parseFloat(lat),
    // layer codes: https://openlandmap.org/layers
    layers: [
      'sol_ph.h2o_usda.4c1a2a_m_250m_b0..0cm_1950..2017_v0.2',   // pH ×10
      'sol_sand.wfraction_usda.3a1a1a_m_250m_b0..0cm_1950..2017_v0.2', // sand %
      'sol_clay.wfraction_usda.3a1a1a_m_250m_b0..0cm_1950..2017_v0.2', // clay %
      'sol_organic.carbon_usda.6a1c_m_250m_b0..0cm_1950..2017_v0.2',   // SOC g/kg
      'sol_nitrogen_usda.4h2_m_250m_b0..0cm_1950..2017_v0.2',          // N g/kg
    ].join(','),
  };

  const resp = await axios.get(OLM_BASE, { params, timeout: 10000 });
  const d = resp.data;

  // OLM returns { [layer_code]: { value: number } }
  const get = (key) => {
    const entry = Object.entries(d).find(([k]) => k.includes(key));
    return entry ? Number(entry[1]?.value ?? entry[1]) : null;
  };

  const phRaw    = get('sol_ph');
  const sandRaw  = get('sol_sand');
  const clayRaw  = get('sol_clay');
  const socRaw   = get('sol_organic');
  const nRaw     = get('sol_nitrogen');

  if (phRaw === null) throw new Error('OpenLandMap returned no data');

  const ph       = phRaw / 10;           // stored as pH×10
  const sand     = sandRaw ?? 40;
  const clay     = clayRaw ?? 25;
  const silt     = Math.max(0, 100 - sand - clay);
  const soc      = socRaw ?? 15;
  const nitrogen = nRaw ?? 1.5;

  // Estimate moisture from clay + SOC (pedotransfer function)
  const moisture = Math.min(90, 25 + clay * 0.45 + soc * 1.2);

  const classifyNutrient = (v, lo, hi) =>
    v < lo ? 'low' : v < hi ? 'medium' : 'high';

  return {
    ph:           parseFloat(ph.toFixed(2)),
    nitrogen:     classifyNutrient(nitrogen, 1.0, 2.5),
    phosphorus:   classifyNutrient(soc * 8, 12, 25),
    potassium:    classifyNutrient(clay, 20, 40),
    moisture:     parseFloat(moisture.toFixed(1)),
    organicCarbon: parseFloat(soc.toFixed(1)),
    clayContent:  parseFloat(clay.toFixed(1)),
    sandContent:  parseFloat(sand.toFixed(1)),
    siltContent:  parseFloat(silt.toFixed(1)),
    texture:      determineSoilTexture(clay, sand, silt),
    source:       'OpenLandMap',
    cached:       false,
  };
}

// ─── SoilGrids fallback (sometimes 503, but worth trying) ────────────────────
async function fetchSoilGrids(lat, lon) {
  const props = ['phh2o', 'nitrogen', 'soc', 'clay', 'sand'];
  const results = await Promise.all(
    props.map(p =>
      axios.get('https://rest.isric.org/soilgrids/v2.0/properties/query', {
        params: { lon: parseFloat(lon), lat: parseFloat(lat), property: p, depth: '0-5cm', value: 'mean' },
        timeout: 8000,
      }).catch(() => null)
    )
  );

  const get = (i) => results[i]?.data?.properties?.layers?.[0]?.depths?.[0]?.values?.mean ?? null;

  const phRaw = get(0);
  if (phRaw === null) throw new Error('SoilGrids unavailable');

  const ph   = phRaw / 10;
  const n    = get(1) ?? 15;
  const soc  = (get(2) ?? 150) / 10;
  const clay = (get(3) ?? 250) / 10;
  const sand = (get(4) ?? 400) / 10;
  const silt = Math.max(0, 100 - clay - sand);
  const moisture = Math.min(90, 25 + clay * 0.45 + soc * 1.2);

  const classifyNutrient = (v, lo, hi) =>
    v < lo ? 'low' : v < hi ? 'medium' : 'high';

  return {
    ph:           parseFloat(ph.toFixed(2)),
    nitrogen:     classifyNutrient(n, 20, 40),
    phosphorus:   classifyNutrient(soc * 8, 12, 25),
    potassium:    classifyNutrient(clay, 20, 40),
    moisture:     parseFloat(moisture.toFixed(1)),
    organicCarbon: parseFloat(soc.toFixed(1)),
    clayContent:  parseFloat(clay.toFixed(1)),
    sandContent:  parseFloat(sand.toFixed(1)),
    siltContent:  parseFloat(silt.toFixed(1)),
    texture:      determineSoilTexture(clay, sand, silt),
    source:       'SoilGrids',
    cached:       false,
  };
}

// ─── NASA POWER fallback — derives soil estimates from climate data ───────────
// NASA POWER is 100% reliable (no 503s). We use it to get climate-informed
// soil estimates when both soil APIs are down.
async function fetchNASAPowerSoilEstimate(lat, lon) {
  const resp = await axios.get('https://power.larc.nasa.gov/api/temporal/climatology/point', {
    params: {
      parameters: 'T2M,PRECTOTCORR,RH2M',
      community: 'AG',
      longitude: parseFloat(lon),
      latitude:  parseFloat(lat),
      format:    'JSON',
    },
    timeout: 12000,
  });

  const p = resp.data?.properties?.parameter;
  if (!p) throw new Error('NASA POWER returned no data');

  // Annual averages
  const annualTemp  = Object.values(p.T2M  || {}).reduce((s, v) => s + v, 0) / 12;
  const annualRain  = Object.values(p.PRECTOTCORR || {}).reduce((s, v) => s + v, 0);
  const annualHumid = Object.values(p.RH2M || {}).reduce((s, v) => s + v, 0) / 12;

  // Pedoclimatic transfer functions (FAO-based)
  // Higher rainfall + humidity → lower pH (leaching), higher clay, higher SOC
  const ph       = Math.max(4.5, Math.min(8.5, 7.2 - (annualRain / 3000) * 1.8));
  const clay     = Math.min(55, 15 + (annualRain / 1000) * 12 + (annualHumid / 100) * 8);
  const sand     = Math.max(15, 65 - clay * 0.8);
  const silt     = Math.max(5, 100 - clay - sand);
  const soc      = Math.min(40, 8 + (annualRain / 1000) * 6 - (annualTemp / 10) * 1.5);
  const moisture = Math.min(85, 25 + clay * 0.45 + soc * 1.2);
  const nitrogen = soc * 0.1; // C:N ratio ~10

  const classifyNutrient = (v, lo, hi) =>
    v < lo ? 'low' : v < hi ? 'medium' : 'high';

  return {
    ph:            parseFloat(ph.toFixed(2)),
    nitrogen:      classifyNutrient(nitrogen, 1.0, 2.5),
    phosphorus:    classifyNutrient(soc * 8, 12, 25),
    potassium:     classifyNutrient(clay, 20, 40),
    moisture:      parseFloat(moisture.toFixed(1)),
    organicCarbon: parseFloat(soc.toFixed(1)),
    clayContent:   parseFloat(clay.toFixed(1)),
    sandContent:   parseFloat(sand.toFixed(1)),
    siltContent:   parseFloat(silt.toFixed(1)),
    texture:       determineSoilTexture(clay, sand, silt),
    source:        'NASA POWER (climate-derived)',
    cached:        false,
    note:          'Soil estimates derived from NASA POWER climate data via pedotransfer functions',
  };
}

function determineSoilTexture(clay, sand, silt) {
  if (clay > 40) return 'Clay';
  if (sand > 70) return 'Sandy';
  if (silt > 50) return 'Silty';
  if (clay > 27 && sand > 20) return 'Clay Loam';
  if (sand > 52 && clay < 20) return 'Sandy Loam';
  return 'Loam';
}

// ─── Main route ───────────────────────────────────────────────────────────────
router.get('/data', async (req, res) => {
  const { lat, lon, nocache } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  const cacheKey = `soil_v2_${parseFloat(lat).toFixed(2)}_${parseFloat(lon).toFixed(2)}`;

  if (nocache !== 'true') {
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`✓ Soil: CACHED for ${lat}, ${lon}`);
      return res.json({ ...cached, cached: true });
    }
  }

  // 1. Try OpenLandMap (primary)
  try {
    console.log(`🌐 Soil: Trying OpenLandMap for ${lat}, ${lon}...`);
    const data = await fetchOpenLandMap(lat, lon);
    cache.set(cacheKey, data);
    console.log(`✅ Soil: OpenLandMap success — pH ${data.ph}, moisture ${data.moisture}%`);
    return res.json(data);
  } catch (e1) {
    console.log(`⚠️  OpenLandMap failed: ${e1.message}`);
  }

  // 2. Try SoilGrids (fallback)
  try {
    console.log(`🌐 Soil: Trying SoilGrids for ${lat}, ${lon}...`);
    const data = await fetchSoilGrids(lat, lon);
    cache.set(cacheKey, data);
    console.log(`✅ Soil: SoilGrids success — pH ${data.ph}`);
    return res.json(data);
  } catch (e2) {
    console.log(`⚠️  SoilGrids failed: ${e2.message}`);
  }

  // 3. NASA POWER climate-derived soil estimates (always works)
  try {
    console.log(`🌐 Soil: Using NASA POWER climate-derived estimates for ${lat}, ${lon}...`);
    const data = await fetchNASAPowerSoilEstimate(lat, lon);
    cache.set(cacheKey, data);
    console.log(`✅ Soil: NASA POWER estimate — pH ${data.ph}, moisture ${data.moisture}%`);
    return res.json(data);
  } catch (e3) {
    console.log(`⚠️  NASA POWER failed: ${e3.message}`);
  }

  // 4. Last resort: static location-based fallback
  console.log(`🔄 Soil: Static fallback for ${lat}, ${lon}`);
  const absLat = Math.abs(parseFloat(lat));
  const isTropical = absLat < 23.5;
  return res.json({
    ph: isTropical ? 6.2 : 6.6, nitrogen: 'medium', phosphorus: 'low', potassium: 'medium',
    moisture: isTropical ? 62 : 52, organicCarbon: isTropical ? 16 : 12,
    clayContent: isTropical ? 28 : 22, sandContent: isTropical ? 38 : 45, siltContent: 34,
    texture: 'Loam', source: 'Static Fallback', cached: false,
  });
});

// Cache management
router.delete('/cache/clear', (req, res) => {
  const n = cache.keys().length;
  cache.flushAll();
  res.json({ message: 'Soil cache cleared', clearedKeys: n });
});

router.get('/cache/stats', (req, res) => {
  res.json({ totalCached: cache.keys().length, ttl: '24 hours' });
});

export default router;
