import express from 'express';
import axios from 'axios';
import NodeCache from 'node-cache';

const router = express.Router();
const cache = new NodeCache({ stdTTL: 1800 }); // 30 minutes

const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Get current weather
router.get('/current', async (req, res, next) => {
  try {
    const { lat, lon, nocache } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const cacheKey = `weather_${lat}_${lon}`;
    
    // Check if cache bypass is requested
    if (nocache !== 'true') {
      const cached = cache.get(cacheKey);
      
      if (cached) {
        console.log(`✓ Weather: Returning CACHED data for ${lat}, ${lon} (30min cache)`);
        return res.json({ ...cached, cached: true, cacheInfo: 'Data from cache (30min TTL)' });
      }
    } else {
      console.log(`🔄 Weather: Cache bypass requested for ${lat}, ${lon}`);
    }

    console.log(`🌐 Weather: Fetching REAL data from OpenWeatherMap for ${lat}, ${lon}...`);

    // Access API key from process.env at runtime (not at import time)
    const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

    if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY === 'demo') {
      console.log('⚠️  Using mock weather data - OpenWeatherMap API key not configured');
      return res.json(getMockWeatherData(parseFloat(lat), parseFloat(lon)));
    }

    try {
      const response = await axios.get(`${BASE_URL}/weather`, {
        params: {
          lat,
          lon,
          appid: OPENWEATHER_API_KEY,
          units: 'metric'
        },
        timeout: 5000
      });

      console.log('✅ Real weather data fetched successfully from OpenWeatherMap');
      const weatherData = {
        current: {
          temp: response.data.main.temp,
          humidity: response.data.main.humidity,
          precipitation: response.data.rain?.['1h'] || 0,
          windSpeed: response.data.wind.speed,
        },
        location: {
          name: response.data.name,
          country: response.data.sys.country
        },
        cached: false,
        cacheInfo: 'Fresh data from OpenWeatherMap API',
        source: 'OpenWeatherMap API'
      };

      cache.set(cacheKey, weatherData);
      return res.json(weatherData);

    } catch (error) {
      console.log('❌ OpenWeatherMap API Error:', error.response?.data?.message || error.message);
      console.log('🔄 Falling back to mock data...');
      return res.json({
        ...getMockWeatherData(parseFloat(lat), parseFloat(lon)),
        apiError: true,
        errorMessage: error.response?.data?.message || error.message
      });
    }
  } catch (error) {
    console.error('Weather route error:', error.message);
    res.json(getMockWeatherData(parseFloat(lat), parseFloat(lon)));
  }
});

// Get forecast
router.get('/forecast', async (req, res, next) => {
  try {
    const { lat, lon, nocache } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const cacheKey = `forecast_${lat}_${lon}`;
    
    // Check if cache bypass is requested
    if (nocache !== 'true') {
      const cached = cache.get(cacheKey);
      
      if (cached) {
        console.log(`✓ Forecast: Returning CACHED data for ${lat}, ${lon} (30min cache)`);
        return res.json({ ...cached, cached: true, cacheInfo: 'Data from cache (30min TTL)' });
      }
    } else {
      console.log(`🔄 Forecast: Cache bypass requested for ${lat}, ${lon}`);
    }

    console.log(`🌐 Forecast: Fetching REAL data from OpenWeatherMap for ${lat}, ${lon}...`);

    // Access API key from process.env at runtime
    const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

    if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY === 'demo') {
      console.log('⚠️  Using mock forecast data - OpenWeatherMap API key not configured');
      return res.json({ forecast: getMockForecast(parseFloat(lat), parseFloat(lon)), mock: true });
    }

    const response = await axios.get(`${BASE_URL}/forecast`, {
      params: {
        lat,
        lon,
        appid: OPENWEATHER_API_KEY,
        units: 'metric'
      },
      timeout: 5000
    });

    console.log('✅ Real forecast data fetched successfully from OpenWeatherMap');
    const forecast = response.data.list.slice(0, 28).map(item => ({
      date: item.dt_txt,
      temp: item.main.temp,
      precipitation: item.rain?.['3h'] || 0,
      humidity: item.main.humidity,
    }));

    const forecastData = { 
      forecast, 
      timestamp: new Date().toISOString(),
      cached: false,
      cacheInfo: 'Fresh data from OpenWeatherMap API'
    };
    cache.set(cacheKey, forecastData);
    res.json(forecastData);
  } catch (error) {
    console.error('Forecast API error:', error.message);
    res.json({ forecast: getMockForecast(parseFloat(lat), parseFloat(lon)) });
  }
});

// Mock data functions
function getMockWeatherData(lat, lon) {
  // Location-aware deterministic mock (only used if OpenWeatherMap fails)
  const absLat = Math.abs(lat);
  const seed = (Math.abs(lat * 100) + Math.abs(lon * 100)) % 10;

  let temp, humidity, precip;

  // Arid/desert (Rajasthan, Middle East)
  if (lat > 20 && lat < 35 && lon > 60 && lon < 80) {
    temp = 32 + seed * 0.3;
    humidity = 25 + seed;
    precip = 0;
  }
  // Humid tropical (Western Ghats, NE India)
  else if (absLat < 15 && lon > 70 && lon < 100) {
    temp = 27 + seed * 0.2;
    humidity = 78 + seed * 0.5;
    precip = 4 + seed * 0.3;
  }
  // Bengal delta / Sundarbans
  else if (lat > 20 && lat < 24 && lon > 87 && lon < 92) {
    temp = 28 + seed * 0.2;
    humidity = 82 + seed * 0.3;
    precip = 5 + seed * 0.4;
  }
  // Equatorial
  else if (absLat < 10) {
    temp = 27 + seed * 0.2;
    humidity = 80 + seed * 0.3;
    precip = 5 + seed * 0.3;
  }
  // Tropical
  else if (absLat < 23.5) {
    temp = 24 + seed * 0.3;
    humidity = 65 + seed;
    precip = 2 + seed * 0.2;
  }
  // Subtropical/temperate
  else {
    temp = 18 + seed * 0.4;
    humidity = 55 + seed;
    precip = 1 + seed * 0.1;
  }

  return {
    current: {
      temp: parseFloat(temp.toFixed(1)),
      humidity: Math.round(humidity),
      precipitation: parseFloat(precip.toFixed(1)),
      windSpeed: parseFloat((2.5 + seed * 0.2).toFixed(1)),
    },
    location: { name: 'Sample Location', country: 'IN' },
    mock: true,
    timestamp: new Date().toISOString()
  };
}

function getMockForecast(lat = 20, lon = 78) {
  const forecast = [];
  const now = new Date();
  const absLat = Math.abs(lat);

  // Base climate by location
  let baseTemp = absLat < 10 ? 27 : absLat < 23.5 ? 24 : 18;
  let basePrecip = absLat < 10 ? 5 : absLat < 23.5 ? 2 : 1;
  let baseHumid = absLat < 10 ? 80 : absLat < 23.5 ? 65 : 55;

  // Arid override
  if (lat > 20 && lat < 35 && lon > 60 && lon < 80) {
    baseTemp = 33; basePrecip = 0; baseHumid = 25;
  }

  for (let i = 0; i < 28; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    const dayVar = Math.sin(i * 0.4) * 2; // smooth variation
    forecast.push({
      date: date.toISOString(),
      temp: parseFloat((baseTemp + dayVar).toFixed(1)),
      precipitation: parseFloat(Math.max(0, basePrecip + Math.sin(i * 0.7) * 1.5).toFixed(1)),
      humidity: Math.round(Math.max(20, baseHumid + Math.sin(i * 0.5) * 5)),
    });
  }
  return forecast;
}

// Cache management endpoints
router.get('/cache/stats', (req, res) => {
  const keys = cache.keys();
  res.json({
    totalCached: keys.length,
    keys: keys,
    ttl: '30 minutes'
  });
});

router.delete('/cache/clear', (req, res) => {
  const keyCount = cache.keys().length;
  cache.flushAll();
  console.log('🗑️  Weather cache cleared');
  res.json({ 
    message: 'Weather cache cleared',
    clearedKeys: keyCount
  });
});

export default router;
