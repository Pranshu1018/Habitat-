// API Configuration for Real Data Sources

export const API_CONFIG = {
  // OpenWeatherMap API (Free tier: 1000 calls/day)
  OPENWEATHER: {
    BASE_URL: 'https://api.openweathermap.org/data/2.5',
    API_KEY: import.meta.env.VITE_OPENWEATHER_API_KEY || 'demo',
  },
  
  // Copernicus Sentinel Hub (Requires registration)
  SENTINEL: {
    BASE_URL: 'https://services.sentinel-hub.com/api/v1',
    INSTANCE_ID: import.meta.env.VITE_SENTINEL_INSTANCE_ID || 'demo',
  },
  
  // SoilGrids REST API (Free, no key required)
  SOILGRIDS: {
    BASE_URL: 'https://rest.isric.org/soilgrids/v2.0',
  },
  
  // WorldClim API (Free, no key required)
  WORLDCLIM: {
    BASE_URL: 'https://www.worldclim.org/data',
  },
  
  // NASA POWER API (Free, no key required)
  NASA_POWER: {
    BASE_URL: 'https://power.larc.nasa.gov/api/temporal',
  },
  
  // Global Forest Watch API
  GFW: {
    BASE_URL: 'https://data-api.globalforestwatch.org',
  },
};

export const CACHE_DURATION = {
  WEATHER: 30 * 60 * 1000, // 30 minutes
  SOIL: 24 * 60 * 60 * 1000, // 24 hours
  SATELLITE: 7 * 24 * 60 * 60 * 1000, // 7 days
  CLIMATE: 30 * 24 * 60 * 60 * 1000, // 30 days
};
