import Groq from 'groq-sdk';
import axios from 'axios';

const SYSTEM_PROMPT = `You are an expert forest and reforestation AI assistant for the Habitat platform, specializing in Indian native tree species and tropical/subtropical ecosystems.

CORE EXPERTISE:
- Indian native tree species (Sal, Teak, Neem, Bamboo, Arjun, etc.)
- Tropical and subtropical forest ecosystems
- Soil-climate-species matching for Indian conditions
- Regional forest types (Western Ghats, Central India, Arid zones, Himalayan foothills)
- Monsoon-dependent reforestation strategies
- Carbon sequestration in Indian species
- Forest Survey of India guidelines

RESPONSE GUIDELINES:
1. ALWAYS analyze the provided site data carefully (temperature, pH, NDVI)
2. Base ALL recommendations on the SPECIFIC parameters given
3. Different parameters = Different species recommendations
4. Explain WHY each species is suitable for THESE specific conditions
5. Consider Indian monsoon patterns, soil types, and climate zones
6. Mention survival rates, growth rates, and care requirements
7. Be specific and technical, not generic

CRITICAL: Never give the same recommendations for different site conditions. 
Temperature 30°C + pH 6.8 is VERY different from Temperature 25°C + pH 4.8.

When recommending species, explain:
- Why this temperature range suits the species
- Why this pH level is compatible
- How NDVI indicates restoration potential
- Expected survival rate for THESE specific conditions
- Specific care needs for THIS site`;

class GroqChatService {
  constructor() {
    this.client = null;
  }

  getClient() {
    if (!this.client) {
      const key = process.env.GROQ_API_KEY;
      if (!key) throw new Error('GROQ_API_KEY not configured');
      this.client = new Groq({ apiKey: key });
    }
    return this.client;
  }

  async fetchContext(location) {
    const { lat, lon } = location;
    const PORT = process.env.PORT || 3001;
    const base = `http://localhost:${PORT}/api`;
    const ctx = {};

    const [w, s, v] = await Promise.allSettled([
      axios.get(`${base}/weather/current`, { params: { lat, lon }, timeout: 3000 }),
      axios.get(`${base}/soil/data`, { params: { lat, lon }, timeout: 3000 }),
      axios.get(`${base}/satellite/vegetation`, { params: { lat, lon }, timeout: 3000 }),
    ]);

    if (w.status === 'fulfilled') ctx.weather = w.value.data;
    if (s.status === 'fulfilled') ctx.soil = s.value.data;
    if (v.status === 'fulfilled') ctx.vegetation = v.value.data;
    return ctx;
  }

  buildContextBlock(ctx) {
    const lines = [];
    
    if (ctx.weather?.current) {
      const c = ctx.weather.current;
      lines.push(`CURRENT WEATHER:`);
      lines.push(`- Temperature: ${c.temp}°C`);
      lines.push(`- Humidity: ${c.humidity}%`);
      lines.push(`- Precipitation: ${c.precipitation}mm/day`);
      lines.push(`- Wind Speed: ${c.windSpeed}m/s`);
    }
    
    if (ctx.soil) {
      lines.push(`\nSOIL CONDITIONS:`);
      lines.push(`- pH: ${ctx.soil.ph} (${ctx.soil.ph < 6 ? 'Acidic' : ctx.soil.ph > 7 ? 'Alkaline' : 'Neutral'})`);
      lines.push(`- Moisture: ${ctx.soil.moisture}%`);
      lines.push(`- Organic Carbon: ${ctx.soil.organicCarbon}g/kg`);
      lines.push(`- Nitrogen: ${ctx.soil.nitrogen}`);
      lines.push(`- Texture: ${ctx.soil.texture}`);
    }
    
    if (ctx.vegetation) {
      lines.push(`\nVEGETATION ANALYSIS:`);
      lines.push(`- NDVI: ${ctx.vegetation.ndvi} (${ctx.vegetation.ndvi < 0.3 ? 'Degraded' : ctx.vegetation.ndvi < 0.6 ? 'Moderate' : 'Dense vegetation'})`);
      lines.push(`- Health Score: ${ctx.vegetation.healthScore}%`);
      lines.push(`- Coverage: ${ctx.vegetation.coverage}%`);
      lines.push(`- Change Rate: ${ctx.vegetation.changeRate}%/month`);
    }
    
    if (lines.length) {
      lines.unshift(`===== SITE-SPECIFIC DATA FOR THIS LOCATION =====`);
      lines.push(`\n=================================================`);
      lines.push(`\nUSER QUESTION:`);
    }
    
    return lines.join('\n');
  }

  async chat(userMessage, location) {
    try {
      const ctx = await this.fetchContext(location);
      const contextBlock = this.buildContextBlock(ctx);

      const completion = await this.getClient().chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `${contextBlock}${userMessage}` },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      });

      return {
        success: true,
        message: completion.choices[0].message.content,
        model: completion.model,
      };
    } catch (err) {
      console.error('Groq chat error:', err.message);
      return {
        success: false,
        message: 'Sorry, I encountered an error. Please try again.',
        error: err.message,
      };
    }
  }
}

export default new GroqChatService();
