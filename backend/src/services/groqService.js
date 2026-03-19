import Groq from 'groq-sdk';
import axios from 'axios';

const SYSTEM_PROMPT = `You are an expert forest and reforestation AI assistant for the Habitat platform.
You specialize in:
- Forest health assessment and monitoring
- Reforestation planning and species selection
- Soil analysis and improvement strategies
- Climate risk assessment for forests
- NDVI and vegetation health interpretation
- Carbon sequestration calculations
- Biodiversity and ecological restoration

When given environmental data (weather, soil, vegetation), provide specific, actionable insights.
Keep responses concise, practical, and data-driven. Use metric units.
If data is unavailable, provide general best-practice guidance for Indian forest ecosystems.`;

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
      lines.push(`WEATHER: Temp ${c.temp}°C, Humidity ${c.humidity}%, Precip ${c.precipitation}mm, Wind ${c.windSpeed}m/s`);
    }
    if (ctx.soil) {
      lines.push(`SOIL: pH ${ctx.soil.ph}, Moisture ${ctx.soil.moisture}%, OC ${ctx.soil.organicCarbon}g/kg, N ${ctx.soil.nitrogen}`);
    }
    if (ctx.vegetation) {
      lines.push(`VEGETATION: NDVI ${ctx.vegetation.ndvi}, Health ${ctx.vegetation.healthScore}%, Coverage ${ctx.vegetation.coverage}%`);
    }
    return lines.length ? `Current site data:\n${lines.join('\n')}\n\n` : '';
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
