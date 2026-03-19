// Real-Time Data Integration Service
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// 1. OpenWeatherMap - Weather & Climate
export const weatherService = {
  async getCurrentWeather(lat: number, lon: number) {
    try {
      const response = await axios.get(`${API_BASE_URL}/weather/current`, {
        params: { lat, lon }
      });
      return response.data;
    } catch (error) {
      console.error('Weather API error:', error);
      throw error;
    }
  },

  async getForecast(lat: number, lon: number) {
    try {
      const response = await axios.get(`${API_BASE_URL}/weather/forecast`, {
        params: { lat, lon }
      });
      return response.data;
    } catch (error) {
      console.error('Forecast API error:', error);
      throw error;
    }
  }
};

// 2. NASA POWER - Historical Climate (FREE, NO KEY)
export const climateService = {
  async getHistoricalClimate(lat: number, lon: number) {
    try {
      const response = await axios.get(`${API_BASE_URL}/climate/historical`, {
        params: { lat, lon }
      });
      return response.data;
    } catch (error) {
      console.error('Climate API error:', error);
      throw error;
    }
  }
};

// 3. SoilGrids - Soil Data (FREE, NO KEY)
export const soilService = {
  async getSoilData(lat: number, lon: number) {
    try {
      const response = await axios.get(`${API_BASE_URL}/soil/data`, {
        params: { lat, lon }
      });
      return response.data;
    } catch (error) {
      console.error('Soil API error:', error);
      throw error;
    }
  }
};

// 4. Sentinel Hub - Satellite Imagery & NDVI
export const satelliteService = {
  async getVegetationData(lat: number, lon: number) {
    try {
      const response = await axios.get(`${API_BASE_URL}/satellite/vegetation`, {
        params: { lat, lon }
      });
      return response.data;
    } catch (error) {
      console.error('Satellite API error:', error);
      throw error;
    }
  },

  async getNDVI(lat: number, lon: number, startDate: string, endDate: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/satellite/ndvi`, {
        params: { lat, lon, startDate, endDate }
      });
      return response.data;
    } catch (error) {
      console.error('NDVI API error:', error);
      throw error;
    }
  }
};

// 5. Global Forest Watch - Deforestation Alerts
export const forestWatchService = {
  async getDeforestationAlerts(lat: number, lon: number, radius: number = 5000) {
    try {
      const response = await axios.get(`${API_BASE_URL}/forest/alerts`, {
        params: { lat, lon, radius }
      });
      return response.data;
    } catch (error) {
      console.error('Forest Watch API error:', error);
      throw error;
    }
  }
};

// 6. Comprehensive Site Analysis (All APIs Combined)
export const comprehensiveAnalysis = {
  async analyzeSite(lat: number, lon: number, name: string) {
    try {
      // Parallel API calls for faster response
      const [weather, climate, soil, vegetation] = await Promise.allSettled([
        weatherService.getCurrentWeather(lat, lon),
        climateService.getHistoricalClimate(lat, lon),
        soilService.getSoilData(lat, lon),
        satelliteService.getVegetationData(lat, lon)
      ]);

      return {
        location: { lat, lon, name },
        weather: weather.status === 'fulfilled' ? weather.value : null,
        climate: climate.status === 'fulfilled' ? climate.value : null,
        soil: soil.status === 'fulfilled' ? soil.value : null,
        vegetation: vegetation.status === 'fulfilled' ? vegetation.value : null,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Comprehensive analysis error:', error);
      throw error;
    }
  }
};

// 7. Real-Time Monitoring Updates
export const monitoringService = {
  async getLatestMetrics(projectId: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/monitoring/latest`, {
        params: { projectId }
      });
      return response.data;
    } catch (error) {
      console.error('Monitoring API error:', error);
      throw error;
    }
  },

  async updateMetrics(projectId: string, metrics: any) {
    try {
      const response = await axios.post(`${API_BASE_URL}/monitoring/update`, {
        projectId,
        ...metrics
      });
      return response.data;
    } catch (error) {
      console.error('Monitoring update error:', error);
      throw error;
    }
  }
};

// 8. Risk Prediction Engine
export const riskPredictionService = {
  async predictRisks(projectId: string, lat: number, lon: number) {
    try {
      const response = await axios.post(`${API_BASE_URL}/prediction/risks`, {
        projectId,
        lat,
        lon
      });
      return response.data;
    } catch (error) {
      console.error('Risk prediction error:', error);
      throw error;
    }
  },

  async simulateScenario(scenario: 'drought' | 'heatwave' | 'pest', projectId: string) {
    try {
      const response = await axios.post(`${API_BASE_URL}/prediction/simulate`, {
        scenario,
        projectId
      });
      return response.data;
    } catch (error) {
      console.error('Simulation error:', error);
      throw error;
    }
  }
};

export default {
  weather: weatherService,
  climate: climateService,
  soil: soilService,
  satellite: satelliteService,
  forestWatch: forestWatchService,
  comprehensive: comprehensiveAnalysis,
  monitoring: monitoringService,
  riskPrediction: riskPredictionService
};