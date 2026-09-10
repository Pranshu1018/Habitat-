import express from 'express';
import axios from 'axios';
import NodeCache from 'node-cache';
import speciesRecommendationEngine from '../services/speciesRecommendationEngine.js';
import { INDIAN_TREE_SPECIES } from '../data/indian-species-database.js';
import intelligentFallbackService from '../services/intelligentFallbackService.js';

const router = express.Router();
const cache = new NodeCache({ stdTTL: 1800 }); // 30 min

// Increase timeout for API calls
const API_TIMEOUT = 15000; // 15 seconds

// ─── Phase 1 Fetchers ────────────────────────────────────────────────────────
// Each returns { data, success, source, confidence, error?, tried[] }

/**
 * Weather fetcher — OpenWeatherMap only.
 * Returns a standardised result object with audit metadata.
 */
async function fetchWeatherPhase1(lat, lon) {
  const tried = [];
  const failed = [];

  const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

  if (!OPENWEATHER_API_KEY) {
    console.log('⚠️  No OpenWeatherMap key — weather will need AI fallback');
    return { data: null, success: false, source: null, confidence: 0, tried: ['OpenWeatherMap'], failed: ['OpenWeatherMap'], error: 'No API key configured' };
  }

  tried.push('OpenWeatherMap');
  try {
    console.log('🌐 Trying OpenWeatherMap API...');
    const res = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: { lat, lon, appid: OPENWEATHER_API_KEY, units: 'metric' },
      timeout: API_TIMEOUT,
    });
    const d = res.data;
    console.log('✅ OpenWeatherMap success');
    return {
      data: {
        current: {
          temp: d.main.temp,
          feelsLike: d.main.feels_like,
          humidity: d.main.humidity,
          precipitation: d.rain?.['1h'] || 0,
          windSpeed: d.wind.speed,
          description: d.weather?.[0]?.description || '',
        },
        location: { name: d.name, country: d.sys.country },
        source: 'OpenWeatherMap',
        confidence: 95,
      },
      success: true,
      source: 'OpenWeatherMap',
      confidence: 95,
      tried,
      failed,
    };
  } catch (err) {
    console.log(`❌ OpenWeatherMap failed: ${err.message}`);
    failed.push('OpenWeatherMap');
    return { data: null, success: false, source: null, confidence: 0, tried, failed, error: err.message };
  }
}

/**
 * Soil fetcher — OpenLandMap → SoilGrids → NASA POWER.
 * Unified chain matching soil.js's hierarchy.
 */
async function fetchSoilPhase1(lat, lon) {
  const tried = [];
  const failed = [];

  // 1. Try OpenLandMap (free, no key, very reliable)
  tried.push('OpenLandMap');
  try {
    console.log('🌐 Trying OpenLandMap API...');
    const OLM_BASE = 'https://api.openlandmap.org/query/point';
    const params = {
      lon: parseFloat(lon),
      lat: parseFloat(lat),
      layers: [
        'sol_ph.h2o_usda.4c1a2a_m_250m_b0..0cm_1950..2017_v0.2',
        'sol_sand.wfraction_usda.3a1a1a_m_250m_b0..0cm_1950..2017_v0.2',
        'sol_clay.wfraction_usda.3a1a1a_m_250m_b0..0cm_1950..2017_v0.2',
        'sol_organic.carbon_usda.6a1c_m_250m_b0..0cm_1950..2017_v0.2',
        'sol_nitrogen_usda.4h2_m_250m_b0..0cm_1950..2017_v0.2',
      ].join(','),
    };

    const resp = await axios.get(OLM_BASE, { params, timeout: API_TIMEOUT });
    const d = resp.data;

    const get = (key) => {
      const entry = Object.entries(d).find(([k]) => k.includes(key));
      return entry ? Number(entry[1]?.value ?? entry[1]) : null;
    };

    const phRaw = get('sol_ph');
    if (phRaw === null) throw new Error('OpenLandMap returned no data');

    const ph = phRaw / 10;
    const sand = get('sol_sand') ?? 40;
    const clay = get('sol_clay') ?? 25;
    const silt = Math.max(0, 100 - sand - clay);
    const soc = get('sol_organic') ?? 15;
    const nitrogen = get('sol_nitrogen') ?? 1.5;
    const moisture = Math.min(90, 25 + clay * 0.45 + soc * 1.2);

    console.log('✅ OpenLandMap success');
    const soilData = {
      ph: parseFloat(ph.toFixed(2)),
      nitrogen: nitrogen < 1 ? 'low' : nitrogen < 2.5 ? 'medium' : 'high',
      phosphorus: soc * 8 < 12 ? 'low' : soc * 8 < 25 ? 'medium' : 'high',
      potassium: clay < 20 ? 'low' : clay < 40 ? 'medium' : 'high',
      moisture: parseFloat(moisture.toFixed(1)),
      organicCarbon: parseFloat(soc.toFixed(1)),
      clayContent: parseFloat(clay.toFixed(1)),
      sandContent: parseFloat(sand.toFixed(1)),
      siltContent: parseFloat(silt.toFixed(1)),
      texture: determineSoilTexture(clay, sand, silt),
      source: 'OpenLandMap',
      confidence: 92,
    };
    return { data: soilData, success: true, source: 'OpenLandMap', confidence: 92, tried, failed };
  } catch (err) {
    console.log(`❌ OpenLandMap failed: ${err.message}`);
    failed.push('OpenLandMap');
  }

  // 2. Try SoilGrids API
  tried.push('SoilGrids');
  try {
    console.log('🌐 Trying SoilGrids API...');
    const response = await axios.get(`https://rest.isric.org/soilgrids/v2.0/properties/query`, {
      params: {
        lon: parseFloat(lon),
        lat: parseFloat(lat),
        property: ['phh2o', 'nitrogen', 'soc', 'clay', 'sand', 'silt'],
        depth: '0-5cm',
        value: 'mean'
      },
      timeout: API_TIMEOUT
    });

    if (response.data && response.data.properties) {
      console.log('✅ SoilGrids success');
      const props = response.data.properties;

      const ph = props.phh2o ? props.phh2o.layers[0].depths[0].values.mean / 10 : 6.5;
      const nitrogen = props.nitrogen ? props.nitrogen.layers[0].depths[0].values.mean : 1.5;
      const soc = props.soc ? props.soc.layers[0].depths[0].values.mean / 10 : 15;
      const clay = props.clay ? props.clay.layers[0].depths[0].values.mean : 25;
      const sand = props.sand ? props.sand.layers[0].depths[0].values.mean : 40;
      const silt = Math.max(0, 100 - clay - sand);

      const soilData = {
        ph: +ph.toFixed(2),
        nitrogen: nitrogen < 1 ? 'low' : nitrogen < 2.5 ? 'medium' : 'high',
        phosphorus: soc * 8 < 12 ? 'low' : soc * 8 < 25 ? 'medium' : 'high',
        potassium: clay < 20 ? 'low' : clay < 40 ? 'medium' : 'high',
        moisture: Math.min(90, 25 + clay * 0.45 + soc * 1.2),
        organicCarbon: +soc.toFixed(1),
        clayContent: +clay.toFixed(1),
        sandContent: +sand.toFixed(1),
        siltContent: +silt.toFixed(1),
        texture: determineSoilTexture(clay, sand, silt),
        source: 'SoilGrids',
        confidence: 90,
      };
      return { data: soilData, success: true, source: 'SoilGrids', confidence: 90, tried, failed };
    }
    throw new Error('SoilGrids returned empty data');
  } catch (err) {
    console.log(`❌ SoilGrids failed: ${err.message}`);
    failed.push('SoilGrids');
  }

  // 3. Try NASA POWER climate-derived
  tried.push('NASA POWER');
  try {
    console.log('🌐 Trying NASA POWER API...');
    const resp = await axios.get('https://power.larc.nasa.gov/api/temporal/climatology/point', {
      params: {
        parameters: 'T2M,PRECTOTCORR,RH2M',
        community: 'AG',
        longitude: parseFloat(lon),
        latitude: parseFloat(lat),
        format: 'JSON'
      },
      timeout: API_TIMEOUT,
    });

    const p = resp.data?.properties?.parameter;
    if (p) {
      console.log('✅ NASA POWER success — deriving soil from climate');
      const annualTemp = Object.values(p.T2M || {}).reduce((s, v) => s + v, 0) / 12;
      const annualRain = Object.values(p.PRECTOTCORR || {}).reduce((s, v) => s + v, 0);
      const annualHumid = Object.values(p.RH2M || {}).reduce((s, v) => s + v, 0) / 12;

      const ph = Math.max(4.5, Math.min(8.5, 7.2 - (annualRain / 3000) * 1.8));
      const clay = Math.min(55, 15 + (annualRain / 1000) * 12 + (annualHumid / 100) * 8);
      const sand = Math.max(15, 65 - clay * 0.8);
      const silt = Math.max(5, 100 - clay - sand);
      const soc = Math.min(40, 8 + (annualRain / 1000) * 6 - (annualTemp / 10) * 1.5);
      const moisture = Math.min(85, 25 + clay * 0.45 + soc * 1.2);
      const nitrogen = soc * 0.1;

      const soilData = {
        ph: +ph.toFixed(2),
        nitrogen: nitrogen < 1 ? 'low' : nitrogen < 2.5 ? 'medium' : 'high',
        phosphorus: soc * 8 < 12 ? 'low' : soc * 8 < 25 ? 'medium' : 'high',
        potassium: clay < 20 ? 'low' : clay < 40 ? 'medium' : 'high',
        moisture: +moisture.toFixed(1),
        organicCarbon: +soc.toFixed(1),
        clayContent: +clay.toFixed(1),
        sandContent: +sand.toFixed(1),
        siltContent: +silt.toFixed(1),
        texture: determineSoilTexture(clay, sand, silt),
        source: 'NASA POWER (climate-derived)',
        confidence: 75,
      };
      return { data: soilData, success: true, source: 'NASA POWER', confidence: 75, tried, failed };
    }
    throw new Error('NASA POWER returned no data');
  } catch (err) {
    console.log(`❌ NASA POWER failed: ${err.message}`);
    failed.push('NASA POWER');
  }

  // All 3 failed
  return { data: null, success: false, source: null, confidence: 0, tried, failed, error: 'All soil APIs failed' };
}

/**
 * Vegetation — biome-calibrated NDVI estimate (always succeeds).
 */
function fetchVegetationPhase1(lat, lon) {
  const seed = (Math.abs(lat * 1000) + Math.abs(lon * 1000)) % 100;
  const jitter = (seed % 15 - 7) / 100;
  const absLat = Math.abs(lat);
  let baseNdvi;

  if (lat > -5 && lat < 10 && lon > 28 && lon < 42)          baseNdvi = 0.62; // East Africa
  else if (absLat < 8 && lon > 95 && lon < 141)               baseNdvi = 0.78; // SE Asia / Indonesia
  else if (lat > -15 && lat < 5 && lon > -75 && lon < -45)    baseNdvi = 0.82; // Amazon
  else if (lat > 8 && lat < 20 && lon > 68 && lon < 85)       baseNdvi = 0.58; // South India / W.Ghats
  else if ((lat > 20 && lat < 35 && lon > 60 && lon < 80) || (lat > 15 && lat < 35 && lon > 35 && lon < 60)) baseNdvi = 0.18; // Arid
  else if (absLat < 10)                                        baseNdvi = 0.75;
  else if (absLat < 23.5)                                      baseNdvi = 0.55;
  else                                                         baseNdvi = 0.42;

  const ndvi = Math.max(0.05, Math.min(0.95, baseNdvi + jitter));
  const vegData = {
    ndvi: +ndvi.toFixed(3),
    evi: +(ndvi * 0.85).toFixed(3),
    coverage: Math.min(100, Math.round(ndvi * 110)),
    healthScore: Math.min(100, Math.round(ndvi * 105)),
    changeRate: +((seed % 10 - 3) / 10).toFixed(2),
    source: 'Biome-calibrated estimate',
    confidence: 80,
  };

  return {
    data: vegData,
    success: true,
    source: 'Biome-calibrated estimate',
    confidence: 80,
    tried: ['Biome-calibrated estimate'],
    failed: [],
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

// ─── Scoring ─────────────────────────────────────────────────────────────────
function calculateLandSuitabilityScore(weather, soil, vegetation) {
  const soilScore = calculateSoilScore(soil);
  const climateScore = calculateClimateScore(weather);
  const vegetationScore = calculateVegetationScore(vegetation);
  const overallScore = Math.round(vegetationScore * 0.4 + soilScore * 0.3 + climateScore * 0.3);
  return { overallScore, priority: determinePriority(vegetation, overallScore), componentScores: { soil: soilScore, climate: climateScore, vegetation: vegetationScore } };
}

function calculateSoilScore(soil) {
  let score = 0;
  if (soil.ph >= 6.0 && soil.ph <= 7.0) score += 25; else if (soil.ph >= 5.5 && soil.ph <= 7.5) score += 20; else if (soil.ph >= 5.0 && soil.ph <= 8.0) score += 15; else score += 10;
  const ns = { 'high': 25, 'medium': 18, 'low': 10 };
  score += ns[soil.nitrogen] || 15;
  score += (ns[soil.phosphorus] || 15) * 0.8;
  score += (ns[soil.potassium] || 15) * 0.7;
  if (soil.organicCarbon >= 3) score += 15; else if (soil.organicCarbon >= 2) score += 12; else if (soil.organicCarbon >= 1) score += 8; else score += 5;
  if (soil.moisture >= 60 && soil.moisture <= 80) score += 10; else if (soil.moisture >= 50 && soil.moisture <= 90) score += 8; else score += 5;
  return Math.min(100, Math.max(0, score));
}

function calculateClimateScore(weather) {
  if (!weather.current) return 50;
  const { temp, humidity, precipitation = 0, windSpeed = 0 } = weather.current;
  let score = 0;
  if (temp >= 22 && temp <= 30) score += 35; else if (temp >= 18 && temp <= 35) score += 25; else if (temp >= 15 && temp <= 40) score += 15; else score += 5;
  if (precipitation >= 800 && precipitation <= 1500) score += 35; else if (precipitation >= 600 && precipitation <= 2000) score += 25; else if (precipitation >= 400 && precipitation <= 2500) score += 15; else score += 5;
  if (humidity >= 60 && humidity <= 80) score += 20; else if (humidity >= 50 && humidity <= 90) score += 15; else score += 10;
  if (windSpeed < 3) score += 10; else if (windSpeed < 6) score += 7; else score += 3;
  return Math.min(100, Math.max(0, score));
}

function calculateVegetationScore(vegetation) {
  if (!vegetation.ndvi) return 50;
  let score = 0;
  const ndvi = vegetation.ndvi;
  if (ndvi >= 0.6) score += 40; else if (ndvi >= 0.4) score += 30; else if (ndvi >= 0.2) score += 20; else score += 10;
  if (vegetation.healthScore >= 70) score += 30; else if (vegetation.healthScore >= 50) score += 20; else if (vegetation.healthScore >= 30) score += 10; else score += 5;
  if (vegetation.coverage >= 60) score += 20; else if (vegetation.coverage >= 40) score += 15; else if (vegetation.coverage >= 20) score += 10; else score += 5;
  if (vegetation.changeRate > 2) score += 10; else if (vegetation.changeRate > 0) score += 7; else if (vegetation.changeRate > -2) score += 3;
  return Math.min(100, Math.max(0, score));
}

function determinePriority(vegetation, overallScore) {
  const ndvi = vegetation.ndvi || 0.5;
  if (ndvi < 0.3 && overallScore > 40) return 'High';
  if (ndvi < 0.5 && overallScore > 50) return 'Medium';
  if (ndvi > 0.7 || overallScore < 30) return 'Low';
  return 'Medium';
}

// ─── Main route ───────────────────────────────────────────────────────────────
router.post('/analyze', async (req, res) => {
  try {
    const { lat, lng, name, hectares } = req.body;
    if (!lat || !lng) return res.status(400).json({ error: 'Latitude and longitude are required' });

    const cacheKey = `site_${parseFloat(lat).toFixed(3)}_${parseFloat(lng).toFixed(3)}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`✓ Site: CACHED for ${lat}, ${lng}`);
      return res.json({ ...cached, cached: true });
    }

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`🌐 Site analysis for ${name} (${lat}, ${lng})...`);
    console.log(`${'═'.repeat(60)}`);

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 1: Try all real APIs in parallel
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n📡 PHASE 1: Parallel API calls...');

    const [weatherResult, soilResult, vegetationResult] = await Promise.all([
      fetchWeatherPhase1(parseFloat(lat), parseFloat(lng)),
      fetchSoilPhase1(parseFloat(lat), parseFloat(lng)),
      Promise.resolve(fetchVegetationPhase1(parseFloat(lat), parseFloat(lng))),
    ]);

    console.log(`\n📊 Phase 1 results:`);
    console.log(`   Weather:    ${weatherResult.success ? `✅ ${weatherResult.source}` : '❌ FAILED'}`);
    console.log(`   Soil:       ${soilResult.success ? `✅ ${soilResult.source}` : '❌ FAILED'}`);
    console.log(`   Vegetation: ${vegetationResult.success ? `✅ ${vegetationResult.source}` : '❌ FAILED'}`);

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 2: AI Chatbot fills FAILED gaps (with cross-API context)
    // ═══════════════════════════════════════════════════════════════════════
    let weather = weatherResult.data;
    let soil = soilResult.data;
    let vegetation = vegetationResult.data;

    let weatherFilledByChatbot = false;
    let soilFilledByChatbot = false;
    let vegetationFilledByChatbot = false;

    const needsAI = !weatherResult.success || !soilResult.success;

    if (needsAI) {
      console.log('\n🤖 PHASE 2: AI Chatbot filling gaps...');

      // Build cross-API context from whatever succeeded
      const contextData = {};
      if (soilResult.success) contextData.soil = soilResult.data;
      if (weatherResult.success) contextData.weather = weatherResult.data;
      if (vegetationResult.success) contextData.vegetation = vegetationResult.data;

      // Fill weather gap
      if (!weatherResult.success) {
        console.log('   → Generating weather via AI (with soil + vegetation context)...');
        try {
          weather = await intelligentFallbackService.generateWeatherData(
            parseFloat(lat), parseFloat(lng), contextData
          );
          weatherFilledByChatbot = true;
          console.log(`   ✅ AI weather generated (confidence: ${weather.confidence}%)`);
        } catch (err) {
          console.error(`   ❌ AI weather also failed: ${err.message}`);
          weather = intelligentFallbackService.getStaticWeatherFallback(parseFloat(lat), parseFloat(lng));
          weatherFilledByChatbot = true;
        }
      }

      // Fill soil gap
      if (!soilResult.success) {
        // Now we have weather data (either from API or AI), add it to context
        const soilContext = { ...contextData, weather };
        console.log('   → Generating soil via AI (with weather + vegetation context)...');
        try {
          soil = await intelligentFallbackService.generateSoilData(
            parseFloat(lat), parseFloat(lng), soilContext
          );
          soilFilledByChatbot = true;
          console.log(`   ✅ AI soil generated (confidence: ${soil.confidence}%)`);
        } catch (err) {
          console.error(`   ❌ AI soil also failed: ${err.message}`);
          soil = intelligentFallbackService.getStaticSoilFallback(parseFloat(lat), parseFloat(lng));
          soilFilledByChatbot = true;
        }
      }

      // Fill vegetation gap (shouldn't happen, but for completeness)
      if (!vegetationResult.success) {
        console.log('   → Generating vegetation via AI...');
        try {
          vegetation = await intelligentFallbackService.generateVegetationData(
            parseFloat(lat), parseFloat(lng), { weather, soil }
          );
          vegetationFilledByChatbot = true;
        } catch (err) {
          // Vegetation always has a static fallback
          vegetation = fetchVegetationPhase1(parseFloat(lat), parseFloat(lng)).data;
          vegetationFilledByChatbot = true;
        }
      }
    } else {
      console.log('\n✅ PHASE 2: Skipped — all APIs succeeded');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 3: All data collected — calculate scores
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n📐 PHASE 3: Calculating land suitability scores...');
    const landScoreResult = calculateLandSuitabilityScore(weather, soil, vegetation);

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 4: Query Plant Database for species recommendations
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n🌱 PHASE 4: Species recommendations from plant database...');

    let recommendedSpecies;
    let speciesSource = 'Plant Database';
    let speciesAiSupplemented = false;
    let speciesDbCount = INDIAN_TREE_SPECIES.length;

    try {
      recommendedSpecies = await speciesRecommendationEngine.getRecommendations({
        weather,
        soil,
        vegetation,
        location: { lat, lng, name, elevation: 300 },
        projectGoals: req.body.projectGoals || {}
      });

      console.log(`   ✅ Species engine returned ${recommendedSpecies.length} species`);

      // If engine returns less than 3 species, supplement with AI using plant DB
      if (recommendedSpecies.length < 3) {
        console.log('   ⚠️ Less than 3 species — supplementing with AI (constrained to plant DB)...');
        speciesAiSupplemented = true;
        try {
          const aiRecommendations = await intelligentFallbackService.getAISpeciesRecommendations(
            { lat, lng, name },
            weather,
            soil,
            vegetation,
            INDIAN_TREE_SPECIES  // Pass the full plant database so AI picks from known species
          );

          if (aiRecommendations.species && aiRecommendations.species.length > 0) {
            // Merge AI recommendations with engine results, avoiding duplicates
            const existingNames = new Set(recommendedSpecies.map(s => s.commonName));
            const aiSpecies = aiRecommendations.species
              .filter(s => !existingNames.has(s.commonName))
              .slice(0, 5 - recommendedSpecies.length)
              .map(s => ({
                ...s,
                matchScore: s.survivalProbability,
                source: 'AI Generated (from plant database)',
              }));
            recommendedSpecies = [...recommendedSpecies, ...aiSpecies];
            console.log(`   ✅ AI supplemented with ${aiSpecies.length} additional species`);
          }
        } catch (aiErr) {
          console.log(`   ❌ AI supplement failed: ${aiErr.message}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Species engine failed: ${error.message} — using AI recommendations`);
      speciesSource = 'AI Generated';
      speciesAiSupplemented = true;
      try {
        const aiRecommendations = await intelligentFallbackService.getAISpeciesRecommendations(
          { lat, lng, name },
          weather,
          soil,
          vegetation,
          INDIAN_TREE_SPECIES  // Always pass the plant database
        );

        if (aiRecommendations.species) {
          recommendedSpecies = aiRecommendations.species.map(sp => ({
            ...sp,
            matchScore: sp.survivalProbability,
            source: 'AI Generated (from plant database)',
          }));
          console.log(`   ✅ AI recommended ${recommendedSpecies.length} species`);
        } else {
          recommendedSpecies = [];
          console.log('   ❌ AI returned no species');
        }
      } catch (aiErr) {
        console.log(`   ❌ AI species also failed: ${aiErr.message}`);
        recommendedSpecies = [];
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 5: Assemble response with audit trail
    // ═══════════════════════════════════════════════════════════════════════
    console.log('\n📦 PHASE 5: Assembling response with audit trail...');

    const analysis = {
      location: { lat, lng, name },
      landScore: landScoreResult.overallScore,
      priority: landScoreResult.priority,
      componentScores: landScoreResult.componentScores,
      weather,
      soil,
      vegetation,
      recommendedSpecies,
      metadata: {
        analysisDate: new Date().toISOString(),
        dataSources: {
          weather: weather.source || 'Unknown',
          soil: soil.source || 'Unknown',
          vegetation: vegetation.source || 'Unknown',
        },
      },
      apiWorkflow: {
        weather: {
          tried: weatherResult.tried,
          succeeded: weatherResult.success ? weatherResult.source : (weatherFilledByChatbot ? null : null),
          failed: weatherResult.failed,
          filledByChatbot: weatherFilledByChatbot,
        },
        soil: {
          tried: soilResult.tried,
          succeeded: soilResult.success ? soilResult.source : null,
          failed: soilResult.failed,
          filledByChatbot: soilFilledByChatbot,
        },
        vegetation: {
          tried: vegetationResult.tried,
          succeeded: vegetationResult.success ? vegetationResult.source : null,
          failed: vegetationResult.failed,
          filledByChatbot: vegetationFilledByChatbot,
        },
        species: {
          source: speciesSource,
          count: recommendedSpecies.length,
          aiSupplemented: speciesAiSupplemented,
          databaseSpeciesCount: speciesDbCount,
        },
      },
    };

    cache.set(cacheKey, analysis);

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`✅ Site analysis complete — score: ${landScoreResult.overallScore}`);
    console.log(`   Weather:    ${weather.source} ${weatherFilledByChatbot ? '(AI)' : '(API)'}`);
    console.log(`   Soil:       ${soil.source} ${soilFilledByChatbot ? '(AI)' : '(API)'}`);
    console.log(`   Vegetation: ${vegetation.source}`);
    console.log(`   Species:    ${recommendedSpecies.length} from ${speciesSource}${speciesAiSupplemented ? ' + AI' : ''}`);
    console.log(`${'═'.repeat(60)}\n`);

    res.json(analysis);
  } catch (error) {
    console.error('Site analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze site' });
  }
});

export default router;
