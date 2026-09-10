/**
 * Intelligent Fallback Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Uses Groq AI (llama-3.3-70b-versatile) to fill data gaps when external APIs
 * fail. Accepts cross-API context so the AI can give more accurate estimates.
 *
 * Fallback hierarchy:
 *   1. Groq AI with full context prompt  (confidence ~70-85%)
 *   2. Static latitude-based estimates   (confidence ~50%)
 */

import Groq from 'groq-sdk';

class IntelligentFallbackService {
  constructor() {
    this.client = null;
  }

  getClient() {
    if (!this.client) {
      const key = process.env.GROQ_API_KEY;
      if (!key) {
        console.warn('⚠️  GROQ_API_KEY not set — AI fallback disabled');
        return null;
      }
      this.client = new Groq({ apiKey: key });
    }
    return this.client;
  }

  // ─── Weather ───────────────────────────────────────────────────────────────

  /**
   * Generate weather data when OpenWeatherMap fails.
   * @param {number} lat
   * @param {number} lon
   * @param {Object} contextData  - Data from APIs that DID succeed (soil, vegetation)
   */
  async generateWeatherData(lat, lon, contextData = {}) {
    const client = this.getClient();
    if (!client) return this.getStaticWeatherFallback(lat, lon);

    const month = new Date().toLocaleString('default', { month: 'long' });

    // Build cross-API context section
    let contextSection = '';
    if (contextData.soil) {
      const s = contextData.soil;
      contextSection += `
SOIL CONTEXT (from successful API call):
- pH: ${s.ph ?? 'unknown'}
- Moisture: ${s.moisture ?? 'unknown'}%
- Texture: ${s.texture ?? 'unknown'}
- Organic Carbon: ${s.organicCarbon ?? 'unknown'} g/kg
Note: High soil moisture suggests recent rainfall. Low moisture + sandy texture → likely arid zone.
`;
    }
    if (contextData.vegetation) {
      const v = contextData.vegetation;
      contextSection += `
VEGETATION CONTEXT (biome-calibrated estimate):
- NDVI: ${v.ndvi ?? 'unknown'} (>0.6 = dense vegetation, <0.2 = bare/arid)
- Health Score: ${v.healthScore ?? 'unknown'}%
- Coverage: ${v.coverage ?? 'unknown'}%
Note: High NDVI strongly implies adequate rainfall. Low NDVI in tropics → degraded/dry.
`;
    }

    const prompt = `You are a meteorological expert. Generate accurate current weather estimates for a location based on geographic position, season, and cross-API context.

LOCATION: Latitude ${lat}, Longitude ${lon}
SEASON: ${month} (Northern Hemisphere context — apply for India/South Asia)

${contextSection}

INSTRUCTIONS:
1. Consider the region's typical climate (Indian climate zones: tropical wet, tropical dry, semi-arid, arid, temperate Himalayan)
2. Factor in monsoon seasonality (Jun-Sep = southwest monsoon; Oct-Dec = northeast monsoon)
3. Use soil moisture and NDVI as calibration signals for rainfall
4. Be realistic — if the location is Rajasthan desert, don't give tropical values

Return ONLY valid JSON with no explanation:
{
  "temperature": <number, Celsius>,
  "humidity": <number, 0-100>,
  "precipitation": <number, mm/hour current>,
  "windSpeed": <number, m/s>,
  "description": <string, brief weather description>,
  "confidence": <number, 0-100, your confidence in this estimate>
}`;

    try {
      const completion = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 400
      });

      const raw = completion.choices[0].message.content.trim();
      // Strip markdown code fences if present
      const jsonStr = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '');
      const w = JSON.parse(jsonStr);

      console.log(`✨ AI weather generated (confidence: ${w.confidence}%) — lat:${lat} lon:${lon}`);
      return {
        current: {
          temp: w.temperature,
          feelsLike: w.temperature - 1.5,
          humidity: w.humidity,
          precipitation: w.precipitation,
          windSpeed: w.windSpeed,
          description: w.description
        },
        location: { name: 'AI Estimated', country: '' },
        source: 'Groq AI (weather API unavailable)',
        confidence: w.confidence || 72,
        aiGenerated: true
      };
    } catch (err) {
      console.error('❌ AI weather generation failed:', err.message);
      return this.getStaticWeatherFallback(lat, lon);
    }
  }

  // ─── Soil ──────────────────────────────────────────────────────────────────

  /**
   * Generate soil data when all soil APIs fail.
   * @param {number} lat
   * @param {number} lon
   * @param {Object} contextData  - Data from APIs that DID succeed (weather, vegetation)
   */
  async generateSoilData(lat, lon, contextData = {}) {
    const client = this.getClient();
    if (!client) return this.getStaticSoilFallback(lat, lon);

    let contextSection = '';
    if (contextData.weather) {
      const w = contextData.weather.current || contextData.weather;
      contextSection += `
WEATHER CONTEXT (from successful API call):
- Temperature: ${w.temp ?? 'unknown'}°C
- Humidity: ${w.humidity ?? 'unknown'}%
- Current Precipitation: ${w.precipitation ?? 'unknown'} mm/hr
Note: High humidity + warm temperature → likely laterite or clay-heavy soil.
      Arid climate → sandy or alkaline soil.
`;
    }
    if (contextData.vegetation) {
      const v = contextData.vegetation;
      contextSection += `
VEGETATION CONTEXT (biome-calibrated estimate):
- NDVI: ${v.ndvi ?? 'unknown'} (>0.6 = healthy, <0.2 = degraded)
- Coverage: ${v.coverage ?? 'unknown'}%
- Health Score: ${v.healthScore ?? 'unknown'}%
Note: Low NDVI often correlates with poor organic carbon and degraded soil.
`;
    }

    const prompt = `You are a soil scientist. Generate accurate soil property estimates for a location based on geographic position and cross-API context.

LOCATION: Latitude ${lat}, Longitude ${lon}
REGIONAL CONTEXT: Consider Indian soil classifications:
  - Alluvial soils: Gangetic plains (pH 7-8.5, N: medium-high)
  - Black cotton (Vertisols): Deccan plateau, Maharashtra (pH 7.5-8.5, clay-heavy)
  - Red soils: Peninsular India (pH 5.5-7, lateritic)
  - Laterite soils: Western Ghats, NE India (pH 4.5-6, low fertility)
  - Desert/Arid soils: Rajasthan (pH 8-9.5, sandy, saline)
  - Forest soils: Himalayan foothills (pH 5-6.5, organic-rich)

${contextSection}

Return ONLY valid JSON, no explanation:
{
  "ph": <number, 4.0-9.5>,
  "nitrogen": <"low"|"medium"|"high">,
  "phosphorus": <"low"|"medium"|"high">,
  "potassium": <"low"|"medium"|"high">,
  "moisture": <number, 0-100>,
  "organicCarbon": <number, 1-40 g/kg>,
  "texture": <"Sandy"|"Loamy"|"Clay"|"Silty"|"Sandy Loam"|"Clay Loam"|"Loam">,
  "clayContent": <number, 0-100>,
  "sandContent": <number, 0-100>,
  "siltContent": <number, 0-100>,
  "confidence": <number, 0-100>
}`;

    try {
      const completion = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 500
      });

      const raw = completion.choices[0].message.content.trim();
      const jsonStr = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '');
      const s = JSON.parse(jsonStr);

      console.log(`✨ AI soil generated (confidence: ${s.confidence}%) — lat:${lat} lon:${lon}`);
      return {
        ph: s.ph,
        nitrogen: s.nitrogen,
        phosphorus: s.phosphorus,
        potassium: s.potassium,
        moisture: s.moisture,
        organicCarbon: s.organicCarbon,
        texture: s.texture,
        clayContent: s.clayContent,
        sandContent: s.sandContent,
        siltContent: s.siltContent,
        source: 'Groq AI (soil APIs unavailable)',
        confidence: s.confidence || 70,
        aiGenerated: true
      };
    } catch (err) {
      console.error('❌ AI soil generation failed:', err.message);
      return this.getStaticSoilFallback(lat, lon);
    }
  }

  // ─── Species Recommendations ───────────────────────────────────────────────

  /**
   * Get species recommendations using AI, constrained to the plant database.
   * @param {Object} location   - { lat, lng, name }
   * @param {Object} weather    - full weather response from site analysis
   * @param {Object} soil       - full soil response from site analysis
   * @param {Object} vegetation - full vegetation data
   * @param {Array}  plantDatabase - INDIAN_TREE_SPECIES array (pass so AI picks from known species)
   */
  async getAISpeciesRecommendations(location, weather, soil, vegetation, plantDatabase = []) {
    const client = this.getClient();
    if (!client) return { error: 'AI service unavailable', fallback: 'basic' };

    // Build a compact species catalogue for the prompt
    const catalogue = plantDatabase.length > 0
      ? plantDatabase.map((s, i) =>
          `${i + 1}. ${s.commonName} (${s.scientificName})
     pH: ${s.requirements.phRange.min}–${s.requirements.phRange.max} | ` +
          `Rainfall: ${s.requirements.rainfall.min}–${s.requirements.rainfall.max}mm | ` +
          `Temp: ${s.requirements.temperature.min}–${s.requirements.temperature.max}°C | ` +
          `Drought: ${s.requirements.droughtTolerance} | ` +
          `Growth: ${s.characteristics.growthRate} | ` +
          `Biome: ${s.biome}`
        ).join('\n')
      : 'No database provided — use your expert knowledge of Indian native species.';

    const prompt = `You are an expert Indian forest ecologist. Based on the site conditions below, select and rank the TOP 5 most suitable species FROM THE PLANT DATABASE provided.

━━━ SITE CONDITIONS ━━━
Location: ${location.name || 'Unknown'} (${location.lat}, ${location.lng})
Temperature: ${weather?.current?.temp ?? 'unknown'}°C
Humidity: ${weather?.current?.humidity ?? 'unknown'}%
Soil pH: ${soil?.ph ?? 'unknown'}
Soil Texture: ${soil?.texture ?? 'unknown'}
Soil Nitrogen: ${soil?.nitrogen ?? 'unknown'}
Soil Moisture: ${soil?.moisture ?? 'unknown'}%
Annual Rainfall estimate: ${Math.round((weather?.current?.precipitation || 0) * 24 * 120 + ((weather?.current?.humidity || 65) - 50) * 20)}mm
NDVI: ${vegetation?.ndvi ?? 'unknown'} (${(vegetation?.ndvi || 0) < 0.3 ? 'degraded land' : (vegetation?.ndvi || 0) < 0.6 ? 'moderate vegetation' : 'healthy vegetation'})

━━━ AVAILABLE PLANT DATABASE (select ONLY from these) ━━━
${catalogue}

━━━ INSTRUCTIONS ━━━
1. ONLY select species from the numbered list above
2. Rank by suitability (best match first)
3. For each, explain WHY it matches THIS SPECIFIC location's conditions
4. Give realistic survival probability (0–100%)
5. Consider NDVI — if low, prioritise fast-growing pioneer species

Return ONLY valid JSON:
{
  "species": [
    {
      "commonName": "<exact name from database>",
      "scientificName": "<exact scientific name from database>",
      "survivalProbability": <number 0-100>,
      "reasoning": "<specific reason why this species fits THESE exact site conditions>",
      "pros": ["<advantage 1>", "<advantage 2>", "<advantage 3>"],
      "cons": ["<limitation 1>", "<limitation 2>"],
      "careRequirements": "<brief practical care instructions for this species at this site>",
      "expectedGrowth": "<growth rate and maturity timeline>"
    }
  ],
  "confidence": <number 0-100>
}`;

    try {
      const completion = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 2500
      });

      const raw = completion.choices[0].message.content.trim();
      const jsonStr = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '');
      const result = JSON.parse(jsonStr);

      console.log(`✨ AI species recommendations: ${result.species?.length} species (confidence: ${result.confidence}%)`);
      return {
        species: result.species || [],
        confidence: result.confidence || 78,
        source: 'Groq AI (constrained to plant database)',
        aiGenerated: true
      };
    } catch (err) {
      console.error('❌ AI species recommendation failed:', err.message);
      return { error: err.message, fallback: 'basic' };
    }
  }

  // ─── Static Fallbacks (last resort) ───────────────────────────────────────

  getStaticWeatherFallback(lat, lon) {
    const absLat = Math.abs(lat);
    const seed = ((Math.abs(lat * 137.5) + Math.abs(lon * 97.3)) % 100) / 100;
    let temp, humidity, precip, windSpeed;

    if (lat > 8 && lat < 35 && lon > 68 && lon < 97) {
      // Indian subcontinent — regional awareness
      if (lat > 25 && lon < 78) { // NW India / Rajasthan
        temp = 30 + seed * 8; humidity = 25 + seed * 20; precip = seed * 0.5; windSpeed = 3 + seed * 3;
      } else if (lat < 15 && lon < 78) { // South India / Western Ghats
        temp = 26 + seed * 4; humidity = 75 + seed * 10; precip = 3 + seed * 4; windSpeed = 2 + seed * 2;
      } else { // Rest of India
        temp = 28 + seed * 5; humidity = 60 + seed * 15; precip = 2 + seed * 3; windSpeed = 2.5 + seed * 2;
      }
    } else if (absLat < 10) {
      temp = 27 + seed * 3; humidity = 80 + seed * 8; precip = 5 + seed * 4; windSpeed = 1.5 + seed * 2;
    } else if (absLat < 23.5) {
      temp = 26 + seed * 5; humidity = 65 + seed * 12; precip = 2 + seed * 3; windSpeed = 2 + seed * 2;
    } else {
      temp = 20 + seed * 8; humidity = 55 + seed * 15; precip = 1 + seed * 2; windSpeed = 3 + seed * 3;
    }

    return {
      current: {
        temp: parseFloat(temp.toFixed(1)),
        feelsLike: parseFloat((temp - 1.5).toFixed(1)),
        humidity: Math.round(humidity),
        precipitation: parseFloat(precip.toFixed(1)),
        windSpeed: parseFloat(windSpeed.toFixed(1)),
        description: humidity > 75 ? 'humid conditions' : 'partly cloudy'
      },
      location: { name: 'Site Location', country: '' },
      source: 'Static fallback (all APIs unavailable)',
      confidence: 50,
      mock: true
    };
  }

  getStaticSoilFallback(lat, lon) {
    const absLat = Math.abs(lat);
    const isTropical = absLat < 23.5;
    const isArid = (lat > 20 && lat < 35 && lon > 60 && lon < 78);

    if (isArid) {
      return { ph: 8.2, nitrogen: 'low', phosphorus: 'low', potassium: 'medium', moisture: 18,
               organicCarbon: 4, clayContent: 12, sandContent: 72, siltContent: 16, texture: 'Sandy',
               source: 'Static fallback (all APIs unavailable)', confidence: 45, mock: true };
    }
    return { ph: isTropical ? 6.2 : 6.6, nitrogen: 'medium', phosphorus: 'low', potassium: 'medium',
             moisture: isTropical ? 62 : 52, organicCarbon: isTropical ? 16 : 12,
             clayContent: isTropical ? 28 : 22, sandContent: isTropical ? 38 : 45, siltContent: 34,
             texture: 'Loam', source: 'Static fallback (all APIs unavailable)', confidence: 50, mock: true };
  }
}

export default new IntelligentFallbackService();
