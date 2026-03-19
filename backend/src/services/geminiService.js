import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

class GeminiChatService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.initialized = false;
  }

  initialize() {
    if (this.initialized) return;
    
    // Load API key here (after dotenv has loaded)
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.log('⚠️ Gemini API key not configured - Chatbot disabled');
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      // Use gemini-pro which is more widely available
      this.model = this.genAI.getGenerativeModel({ 
        model: 'gemini-pro',
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      });
      this.initialized = true;
      console.log('✅ Gemini AI chatbot initialized with gemini-pro');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini:', error.message);
    }
  }

  async fetchContextData(location) {
    const { lat, lon } = location;
    const contextData = {};

    try {
      // Fetch weather data
      const weatherRes = await axios.get(`http://localhost:3001/api/weather?lat=${lat}&lon=${lon}`);
      contextData.weather = weatherRes.data;
    } catch (error) {
      console.log('Weather data fetch failed:', error.message);
    }

    try {
      // Fetch soil data
      const soilRes = await axios.get(`http://localhost:3001/api/soil?lat=${lat}&lon=${lon}`);
      contextData.soil = soilRes.data;
    } catch (error) {
      console.log('Soil data fetch failed:', error.message);
    }

    try {
      // Fetch satellite/vegetation data
      const satRes = await axios.get(`http://localhost:3001/api/satellite/vegetation?lat=${lat}&lon=${lon}`);
      contextData.vegetation = satRes.data;
    } catch (error) {
      console.log('Vegetation data fetch failed:', error.message);
    }

    return contextData;
  }

  formatContextForAI(contextData) {
    let context = 'You are a forest habitat expert assistant. Here is the current data:\n\n';

    if (contextData.weather) {
      context += `WEATHER DATA:\n`;
      context += `- Temperature: ${contextData.weather.temperature}°C\n`;
      context += `- Humidity: ${contextData.weather.humidity}%\n`;
      context += `- Conditions: ${contextData.weather.description}\n`;
      context += `- Rainfall: ${contextData.weather.rainfall || 0}mm\n\n`;
    }

    if (contextData.soil) {
      context += `SOIL DATA:\n`;
      context += `- pH: ${contextData.soil.ph}\n`;
      context += `- Organic Carbon: ${contextData.soil.organicCarbon}%\n`;
      context += `- Nitrogen: ${contextData.soil.nitrogen} g/kg\n`;
      context += `- Clay: ${contextData.soil.clay}%\n`;
      context += `- Sand: ${contextData.soil.sand}%\n\n`;
    }

    if (contextData.vegetation) {
      context += `VEGETATION DATA:\n`;
      context += `- NDVI: ${contextData.vegetation.ndvi}\n`;
      context += `- Vegetation Health: ${contextData.vegetation.health}\n`;
      context += `- Coverage: ${contextData.vegetation.coverage}%\n\n`;
    }

    context += `Based on this data, answer the user's question in a helpful, concise way. Focus on practical insights and recommendations.`;

    return context;
  }

  async chat(userMessage, location) {
    this.initialize();

    if (!this.initialized) {
      return {
        success: false,
        message: 'Chatbot is not configured. Please add GEMINI_API_KEY to .env file.',
        demo: true
      };
    }

    try {
      // Fetch real-time data from APIs
      const contextData = await this.fetchContextData(location);
      
      // Format context for AI
      const systemContext = this.formatContextForAI(contextData);
      
      // Create prompt with context
      const fullPrompt = `${systemContext}\n\nUser Question: ${userMessage}`;

      // Get AI response
      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const aiMessage = response.text();

      return {
        success: true,
        message: aiMessage,
        contextUsed: {
          hasWeather: !!contextData.weather,
          hasSoil: !!contextData.soil,
          hasVegetation: !!contextData.vegetation
        }
      };

    } catch (error) {
      console.error('Gemini chat error:', error);
      return {
        success: false,
        message: 'Sorry, I encountered an error processing your request.',
        error: error.message
      };
    }
  }
}

export default new GeminiChatService();
