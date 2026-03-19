import express from 'express';
import axios from 'axios';
import NodeCache from 'node-cache';

const router = express.Router();
const cache = new NodeCache({ stdTTL: 1800 }); // 30 min

// ─── Weather fetcher (OpenWeatherMap) ────────────────────────────────────────
async function fetchWeather(lat, lon) {
  const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

  if (!OPENWEATHER_API_KEY) {
    console.log('⚠️  No OpenWeatherMap key — using location-aware mock');
    return getMockWeather(lat, lon);
  }

  try {
    const res = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: { lat, lon, appid: OPENWEATHER_API_KEY, units: 'metric' },
      timeout: 6000,
    });
    const d = res.data;
    return {
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
    };
  } catch (err) {
    console.log('❌ OpenWeatherMap failed:', err.message, '— using mock');
    return getMockWeather(lat, lon);
  }
}

function getMockWeather(lat, lon) {
  const absLat = Math.abs(lat);
  // Unique seed per location
  const seed = ((Math.abs(lat * 137.5) + Math.abs(lon * 97.3)) % 100) / 100;

  let temp, humidity, precip, windSpeed;

  // East Africa (Uganda region: lat ~1, lon ~34)
  if (lat > -5 && lat < 10 && lon > 28 && lon < 42) {
    temp = 22 + seed * 4;
    humidity = 72 + seed * 10;
    precip = 3 + seed * 3;
    windSpeed = 2 + seed * 2;
  }
  // Southeast Asia / Indonesia (lat ~0.5, lon ~116)
  else if (absLat < 8 && lon > 95 && lon < 141) {
    temp = 27 + seed * 3;
    humidity = 82 + seed * 8;
    precip = 6 + seed * 4;
    windSpeed = 1.5 + seed * 1.5;
  }
  // Amazon / Brazil (lat ~-3, lon ~-60)
  else if (lat > -15 && lat < 5 && lon > -75 && lon < -45) {
    temp = 26 + seed * 3;
    humidity = 85 + seed * 7;
    precip = 7 + seed * 5;
    windSpeed = 1 + seed * 2;
  }
  // South Asia / India (lat ~14, lon ~75)
  else if (lat > 8 && lat < 35 && lon > 68 && lon < 97) {
    temp = 28 + seed * 5;
    humidity = 60 + seed * 15;
    precip = 2 + seed * 4;
    windSpeed = 2.5 + seed * 2;
  }
  // Arid / desert
  else if (absLat > 20 && absLat < 35) {
    temp = 33 + seed * 5;
    humidity = 20 + seed * 15;
    precip = seed * 0.5;
    windSpeed = 3 + seed * 3;
  }
  // Equatorial generic
  else if (absLat < 10) {
    temp = 26 + seed * 3;
    humidity = 80 + seed * 8;
    precip = 5 + seed * 4;
    windSpeed = 1.5 + seed * 2;
  }
  // Tropical
  else if (absLat < 23.5) {
    temp = 24 + seed * 5;
    humidity = 65 + seed * 12;
    precip = 2 + seed * 3;
    windSpeed = 2 + seed * 2;
  }
  // Temperate
  else {
    temp = 15 + seed * 8;
    humidity = 55 + seed * 15;
    precip = 1 + seed * 2;
    windSpeed = 3 + seed * 3;
  }

  return {
    current: {
      temp: parseFloat(temp.toFixed(1)),
      feelsLike: parseFloat((temp - 1.5).toFixed(1)),
      humidity: Math.round(humidity),
      precipitation: parseFloat(precip.toFixed(1)),
      windSpeed: parseFloat(windSpeed.toFixed(1)),
      description: humidity > 75 ? 'humid conditions' : 'partly cloudy',
    },
    location: { name: 'Site Location', country: '' },
    source: 'location-calibrated estimate',
    mock: true,
  };
}

// ─── Soil fetcher (OpenLandMap → SoilGrids → NASA POWER) ────────────────────
async function fetchSoil(lat, lon) {
  // 1. OpenLandMap
  try {
    const OLM_BASE = 'https://api.openlandmap.org/query/point';
    const params = {
      lon: parseFloat(lon), lat: parseFloat(lat),
      layers: [
        'sol_ph.h2o_usda.4c1a2a_m_250m_b0..0cm_1950..2017_v0.2',
        'sol_sand.wfraction_usda.3a1a1a_m_250m_b0..0cm_1950..2017_v0.2',
        'sol_clay.wfraction_usda.3a1a1a_m_250m_b0..0cm_1950..2017_v0.2',
        'sol_organic.carbon_usda.6a1c_m_250m_b0..0cm_1950..2017_v0.2',
        'sol_nitrogen_usda.4h2_m_250m_b0..0cm_1950..2017_v0.2',
      ].join(','),
    };
    const resp = await axios.get(OLM_BASE, { params, timeout: 10000 });
    const d = resp.data;
    const get = (key) => {
      const entry = Object.entries(d).find(([k]) => k.includes(key));
      return entry ? Number(entry[1]?.value ?? entry[1]) : null;
    };
    const phRaw = get('sol_ph');
    if (phRaw === null) throw new Error('no data');
    const ph = phRaw / 10;
    const sand = get('sol_sand') ?? 40;
    const clay = get('sol_clay') ?? 25;
    const silt = Math.max(0, 100 - sand - clay);
    const soc = get('sol_organic') ?? 15;
    const nitrogen = get('sol_nitrogen') ?? 1.5;
    const moisture = Math.min(90, 25 + clay * 0.45 + soc * 1.2);
    const cn = (v, lo, hi) => v < lo ? 'low' : v < hi ? 'medium' : 'high';
    return { ph: +ph.toFixed(2), nitrogen: cn(nitrogen,1,2.5), phosphorus: cn(soc*8,12,25), potassium: cn(clay,20,40), moisture: +moisture.toFixed(1), organicCarbon: +soc.toFixed(1), clayContent: +clay.toFixed(1), sandContent: +sand.toFixed(1), siltContent: +silt.toFixed(1), texture: determineSoilTexture(clay,sand,silt), source: 'OpenLandMap' };
  } catch {}

  // 2. NASA POWER climate-derived
  try {
    const resp = await axios.get('https://power.larc.nasa.gov/api/temporal/climatology/point', {
      params: { parameters: 'T2M,PRECTOTCORR,RH2M', community: 'AG', longitude: parseFloat(lon), latitude: parseFloat(lat), format: 'JSON' },
      timeout: 12000,
    });
    const p = resp.data?.properties?.parameter;
    if (!p) throw new Error('no data');
    const annualTemp  = Object.values(p.T2M||{}).reduce((s,v)=>s+v,0)/12;
    const annualRain  = Object.values(p.PRECTOTCORR||{}).reduce((s,v)=>s+v,0);
    const annualHumid = Object.values(p.RH2M||{}).reduce((s,v)=>s+v,0)/12;
    const ph    = Math.max(4.5, Math.min(8.5, 7.2-(annualRain/3000)*1.8));
    const clay  = Math.min(55, 15+(annualRain/1000)*12+(annualHumid/100)*8);
    const sand  = Math.max(15, 65-clay*0.8);
    const silt  = Math.max(5, 100-clay-sand);
    const soc   = Math.min(40, 8+(annualRain/1000)*6-(annualTemp/10)*1.5);
    const moisture = Math.min(85, 25+clay*0.45+soc*1.2);
    const nitrogen = soc*0.1;
    const cn = (v,lo,hi) => v<lo?'low':v<hi?'medium':'high';
    return { ph:+ph.toFixed(2), nitrogen:cn(nitrogen,1,2.5), phosphorus:cn(soc*8,12,25), potassium:cn(clay,20,40), moisture:+moisture.toFixed(1), organicCarbon:+soc.toFixed(1), clayContent:+clay.toFixed(1), sandContent:+sand.toFixed(1), siltContent:+silt.toFixed(1), texture:determineSoilTexture(clay,sand,silt), source:'NASA POWER (climate-derived)' };
  } catch {}

  // 3. Static fallback
  const absLat = Math.abs(lat);
  const isTropical = absLat < 23.5;
  return { ph: isTropical?6.2:6.6, nitrogen:'medium', phosphorus:'low', potassium:'medium', moisture: isTropical?62:52, organicCarbon: isTropical?16:12, clayContent: isTropical?28:22, sandContent: isTropical?38:45, siltContent:34, texture:'Loam', source:'Static Fallback' };
}

function determineSoilTexture(clay, sand, silt) {
  if (clay>40) return 'Clay';
  if (sand>70) return 'Sandy';
  if (silt>50) return 'Silty';
  if (clay>27&&sand>20) return 'Clay Loam';
  if (sand>52&&clay<20) return 'Sandy Loam';
  return 'Loam';
}

// ─── Vegetation (biome-calibrated NDVI) ──────────────────────────────────────
function getVegetation(lat, lon) {
  const seed = (Math.abs(lat * 1000) + Math.abs(lon * 1000)) % 100;
  const jitter = (seed % 15 - 7) / 100;
  const absLat = Math.abs(lat);
  let baseNdvi;

  if (lat>-5&&lat<10&&lon>28&&lon<42)          baseNdvi = 0.62; // East Africa
  else if (absLat<8&&lon>95&&lon<141)           baseNdvi = 0.78; // SE Asia / Indonesia
  else if (lat>-15&&lat<5&&lon>-75&&lon<-45)   baseNdvi = 0.82; // Amazon
  else if (lat>8&&lat<20&&lon>68&&lon<85)       baseNdvi = 0.58; // South India / W.Ghats
  else if ((lat>20&&lat<35&&lon>60&&lon<80)||(lat>15&&lat<35&&lon>35&&lon<60)) baseNdvi = 0.18; // Arid
  else if (absLat<10)                           baseNdvi = 0.75;
  else if (absLat<23.5)                         baseNdvi = 0.55;
  else                                          baseNdvi = 0.42;

  const ndvi = Math.max(0.05, Math.min(0.95, baseNdvi + jitter));
  return {
    ndvi: +ndvi.toFixed(3),
    evi: +(ndvi*0.85).toFixed(3),
    coverage: Math.min(100, Math.round(ndvi*110)),
    healthScore: Math.min(100, Math.round(ndvi*105)),
    changeRate: +((seed%10-3)/10).toFixed(2),
    source: 'Biome-calibrated estimate',
  };
}

// ─── Scoring ─────────────────────────────────────────────────────────────────
function calculateLandSuitabilityScore(weather, soil, vegetation) {
  const soilScore = calculateSoilScore(soil);
  const climateScore = calculateClimateScore(weather);
  const vegetationScore = calculateVegetationScore(vegetation);
  const overallScore = Math.round(vegetationScore*0.4 + soilScore*0.3 + climateScore*0.3);
  return { overallScore, priority: determinePriority(vegetation, overallScore), componentScores: { soil: soilScore, climate: climateScore, vegetation: vegetationScore } };
}

function calculateSoilScore(soil) {
  let score = 0;
  if (soil.ph>=6.0&&soil.ph<=7.0) score+=25; else if (soil.ph>=5.5&&soil.ph<=7.5) score+=20; else if (soil.ph>=5.0&&soil.ph<=8.0) score+=15; else score+=10;
  const ns = {'high':25,'medium':18,'low':10};
  score += ns[soil.nitrogen]||15;
  score += (ns[soil.phosphorus]||15)*0.8;
  score += (ns[soil.potassium]||15)*0.7;
  if (soil.organicCarbon>=3) score+=15; else if (soil.organicCarbon>=2) score+=12; else if (soil.organicCarbon>=1) score+=8; else score+=5;
  if (soil.moisture>=60&&soil.moisture<=80) score+=10; else if (soil.moisture>=50&&soil.moisture<=90) score+=8; else score+=5;
  return Math.min(100, Math.max(0, score));
}

function calculateClimateScore(weather) {
  if (!weather.current) return 50;
  const { temp, humidity, precipitation=0, windSpeed=0 } = weather.current;
  let score = 0;
  if (temp>=22&&temp<=30) score+=35; else if (temp>=18&&temp<=35) score+=25; else if (temp>=15&&temp<=40) score+=15; else score+=5;
  if (precipitation>=800&&precipitation<=1500) score+=35; else if (precipitation>=600&&precipitation<=2000) score+=25; else if (precipitation>=400&&precipitation<=2500) score+=15; else score+=5;
  if (humidity>=60&&humidity<=80) score+=20; else if (humidity>=50&&humidity<=90) score+=15; else score+=10;
  if (windSpeed<3) score+=10; else if (windSpeed<6) score+=7; else score+=3;
  return Math.min(100, Math.max(0, score));
}

function calculateVegetationScore(vegetation) {
  if (!vegetation.ndvi) return 50;
  let score = 0;
  const ndvi = vegetation.ndvi;
  if (ndvi>=0.6) score+=40; else if (ndvi>=0.4) score+=30; else if (ndvi>=0.2) score+=20; else score+=10;
  if (vegetation.healthScore>=70) score+=30; else if (vegetation.healthScore>=50) score+=20; else if (vegetation.healthScore>=30) score+=10; else score+=5;
  if (vegetation.coverage>=60) score+=20; else if (vegetation.coverage>=40) score+=15; else if (vegetation.coverage>=20) score+=10; else score+=5;
  if (vegetation.changeRate>2) score+=10; else if (vegetation.changeRate>0) score+=7; else if (vegetation.changeRate>-2) score+=3;
  return Math.min(100, Math.max(0, score));
}

function determinePriority(vegetation, overallScore) {
  const ndvi = vegetation.ndvi||0.5;
  if (ndvi<0.3&&overallScore>40) return 'High';
  if (ndvi<0.5&&overallScore>50) return 'Medium';
  if (ndvi>0.7||overallScore<30) return 'Low';
  return 'Medium';
}

// ─── Species recommendations ─────────────────────────────────────────────────
function getSpeciesRecommendations(soil, weather, vegetation) {
  const db = [
    { name:'Neem', scientificName:'Azadirachta indica', phRange:[5.5,7.5], rainfall:'medium', droughtTolerance:'high', growthRate:'fast', maturityYears:5, height:15, carbonSequestration:8.5, biodiversityValue:7 },
    { name:'Acacia Senegal', scientificName:'Acacia senegal', phRange:[6.0,8.5], rainfall:'low', droughtTolerance:'very_high', growthRate:'medium', maturityYears:4, height:8, carbonSequestration:6.2, biodiversityValue:6 },
    { name:'Baobab', scientificName:'Adansonia digitata', phRange:[5.0,7.0], rainfall:'low', droughtTolerance:'very_high', growthRate:'slow', maturityYears:20, height:25, carbonSequestration:12.0, biodiversityValue:9 },
    { name:'Moringa', scientificName:'Moringa oleifera', phRange:[6.0,8.0], rainfall:'low', droughtTolerance:'high', growthRate:'very_fast', maturityYears:2, height:12, carbonSequestration:4.5, biodiversityValue:5 },
    { name:'Teak', scientificName:'Tectona grandis', phRange:[6.0,7.5], rainfall:'high', droughtTolerance:'low', growthRate:'medium', maturityYears:20, height:30, carbonSequestration:15.0, biodiversityValue:4 },
    { name:'Bamboo', scientificName:'Bambusa vulgaris', phRange:[5.5,7.0], rainfall:'high', droughtTolerance:'medium', growthRate:'very_fast', maturityYears:3, height:20, carbonSequestration:10.0, biodiversityValue:7 },
    { name:'African Mahogany', scientificName:'Khaya senegalensis', phRange:[5.5,7.5], rainfall:'medium', droughtTolerance:'medium', growthRate:'medium', maturityYears:15, height:25, carbonSequestration:13.0, biodiversityValue:8 },
  ];

  const precip = weather.current?.precipitation || 0;
  const humidity = weather.current?.humidity || 60;
  const droughtRisk = precip<400||humidity<40 ? 'high' : precip<800||humidity<60 ? 'medium' : 'low';
  const tolLevels = {'low':1,'medium':2,'high':3,'very_high':4};
  const riskLevels = {'low':1,'medium':2,'high':3};

  return db.map(sp => {
    const phOk = soil.ph && sp.phRange[0]<=soil.ph && soil.ph<=sp.phRange[1];
    const droughtOk = tolLevels[sp.droughtTolerance] >= riskLevels[droughtRisk];
    const rainfallOk = sp.rainfall==='low' ? precip<800 : sp.rainfall==='medium' ? precip>=600&&precip<=1500 : precip>1200;
    const tempOk = weather.current?.temp >= 15 && weather.current?.temp <= 40;

    const survival = Math.min(0.95,
      (phOk?0.30:0.05) + (rainfallOk?0.25:0.05) + (droughtOk?0.25:0.05) + (tempOk?0.15:0.05)
    );
    const growthBonus = {'very_fast':0.1,'fast':0.08,'medium':0.05,'slow':0.02}[sp.growthRate]||0;
    const matchScore = survival + growthBonus + Math.min(0.1,sp.carbonSequestration/100);

    return {
      ...sp,
      survivalProbability: Math.round(survival*100),
      matchScore: Math.round(matchScore*100),
      reason: survival>0.8 ? `Excellent match — ${Math.round(survival*100)}% survival` : survival>0.6 ? `Good match — ${Math.round(survival*100)}% survival` : `Moderate match — ${Math.round(survival*100)}% survival`,
      pros: [phOk&&'Optimal soil pH',rainfallOk&&'Suitable rainfall',droughtOk&&'Good drought tolerance',(sp.growthRate==='fast'||sp.growthRate==='very_fast')&&'Fast growth'].filter(Boolean),
      cons: [!phOk&&'Soil pH may need amendment',!rainfallOk&&'Rainfall not ideal',!droughtOk&&'May struggle in drought',sp.maturityYears>10&&'Long time to maturity'].filter(Boolean),
    };
  })
  .filter(sp => sp.survivalProbability > 30)
  .sort((a,b) => b.matchScore - a.matchScore)
  .slice(0,5);
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

    console.log(`🌐 Site analysis for ${name} (${lat}, ${lng})...`);

    // Fetch all data in parallel — no self HTTP calls
    const [weather, soil] = await Promise.all([
      fetchWeather(parseFloat(lat), parseFloat(lng)),
      fetchSoil(parseFloat(lat), parseFloat(lng)),
    ]);
    const vegetation = getVegetation(parseFloat(lat), parseFloat(lng));

    const landScoreResult = calculateLandSuitabilityScore(weather, soil, vegetation);
    const recommendedSpecies = getSpeciesRecommendations(soil, weather, vegetation);

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
        dataSources: { weather: weather.source, soil: soil.source, vegetation: vegetation.source },
      },
    };

    cache.set(cacheKey, analysis);
    console.log(`✅ Site analysis complete — score: ${landScoreResult.overallScore}`);
    res.json(analysis);
  } catch (error) {
    console.error('Site analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze site' });
  }
});

export default router;
