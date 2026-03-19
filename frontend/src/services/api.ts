// Frontend API Service - Connects to Backend
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.message);
    return Promise.reject(error);
  }
);

export const weatherAPI = {
  getCurrent: (lat: number, lon: number) =>
    api.get('/weather/current', { params: { lat, lon } }),
  
  getForecast: (lat: number, lon: number) =>
    api.get('/weather/forecast', { params: { lat, lon } }),
};

export const soilAPI = {
  getData: (lat: number, lon: number) =>
    api.get('/soil/data', { params: { lat, lon } }),
};

export const satelliteAPI = {
  getVegetation: (lat: number, lon: number) =>
    api.get('/satellite/vegetation', { params: { lat, lon } }),
};

export const analyticsAPI = {
  calculateCarbon: (data: any) =>
    api.post('/analytics/carbon', data),
  
  assessRisks: (data: any) =>
    api.post('/analytics/risks', data),
  
  matchSpecies: (data: any) =>
    api.post('/analytics/species', data),
};

export const siteAPI = {
  analyze: (data: { lat: number; lng: number; name: string; hectares: number }) =>
    api.post('/site/analyze', data),
  
  analyzeCompleteSite: (data: { lat: number; lng: number; name: string; hectares: number }) =>
    api.post('/site/analyze', data),
};

export default api;
