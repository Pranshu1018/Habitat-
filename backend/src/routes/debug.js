// Debug route to display full raw API responses
import express from 'express';
import axios from 'axios';

const router = express.Router();

// Display full raw weather data from OpenWeatherMap
router.get('/weather/raw', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

    if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY === 'demo') {
      return res.status(400).json({ error: 'OpenWeatherMap API key not configured' });
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`🌐 FETCHING RAW WEATHER DATA FROM OPENWEATHERMAP`);
    console.log(`📍 Location: ${lat}, ${lon}`);
    console.log(`🔑 API Key: ${OPENWEATHER_API_KEY.substring(0, 8)}...`);
    console.log(`${'='.repeat(80)}\n`);

    // Fetch current weather
    const currentResponse = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        lat,
        lon,
        appid: OPENWEATHER_API_KEY,
        units: 'metric'
      },
      timeout: 10000
    });

    console.log('✅ RAW CURRENT WEATHER RESPONSE:');
    console.log(JSON.stringify(currentResponse.data, null, 2));
    console.log('\n');

    // Fetch forecast
    const forecastResponse = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
      params: {
        lat,
        lon,
        appid: OPENWEATHER_API_KEY,
        units: 'metric'
      },
      timeout: 10000
    });

    console.log('✅ RAW FORECAST RESPONSE (showing first 5 entries):');
    console.log(JSON.stringify({
      ...forecastResponse.data,
      list: forecastResponse.data.list.slice(0, 5)
    }, null, 2));
    console.log(`\n... and ${forecastResponse.data.list.length - 5} more forecast entries\n`);

    res.json({
      message: 'Raw API data fetched successfully - check backend console for full output',
      summary: {
        current: {
          location: currentResponse.data.name,
          country: currentResponse.data.sys.country,
          coordinates: currentResponse.data.coord,
          temperature: currentResponse.data.main.temp,
          feelsLike: currentResponse.data.main.feels_like,
          humidity: currentResponse.data.main.humidity,
          pressure: currentResponse.data.main.pressure,
          weather: currentResponse.data.weather,
          wind: currentResponse.data.wind,
          clouds: currentResponse.data.clouds,
          visibility: currentResponse.data.visibility,
          timestamp: new Date(currentResponse.data.dt * 1000).toISOString()
        },
        forecast: {
          totalEntries: forecastResponse.data.list.length,
          city: forecastResponse.data.city,
          firstFiveEntries: forecastResponse.data.list.slice(0, 5).map(item => ({
            datetime: item.dt_txt,
            temp: item.main.temp,
            feelsLike: item.main.feels_like,
            humidity: item.main.humidity,
            weather: item.weather,
            wind: item.wind,
            clouds: item.clouds,
            precipitation: item.rain || item.snow || null
          }))
        }
      },
      fullDataInConsole: true
    });

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    res.status(500).json({ 
      error: error.message,
      details: error.response?.data
    });
  }
});

// Display full raw soil data from SoilGrids
router.get('/soil/raw', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`🌐 FETCHING RAW SOIL DATA FROM SOILGRIDS`);
    console.log(`📍 Location: ${lat}, ${lon}`);
    console.log(`${'='.repeat(80)}\n`);

    const properties = ['phh2o', 'nitrogen', 'soc', 'bdod', 'clay', 'sand'];
    const results = {};

    for (const prop of properties) {
      try {
        console.log(`Fetching ${prop}...`);
        const response = await axios.get('https://rest.isric.org/soilgrids/v2.0/properties/query', {
          params: {
            lon: parseFloat(lon),
            lat: parseFloat(lat),
            property: prop,
            depth: '0-5cm',
            value: 'mean'
          },
          timeout: 10000,
          headers: {
            'Accept': 'application/json'
          }
        });

        results[prop] = response.data;
        console.log(`✅ ${prop.toUpperCase()} RESPONSE:`);
        console.log(JSON.stringify(response.data, null, 2));
        console.log('\n');
      } catch (error) {
        console.error(`❌ Failed to fetch ${prop}:`, error.message);
        results[prop] = { error: error.message };
      }
    }

    res.json({
      message: 'Raw soil data fetched - check backend console for full output',
      summary: {
        location: { lat: parseFloat(lat), lon: parseFloat(lon) },
        properties: Object.keys(results).map(prop => ({
          property: prop,
          success: !results[prop].error,
          value: results[prop].properties?.layers?.[0]?.depths?.[0]?.values?.mean || 'N/A'
        }))
      },
      fullDataInConsole: true
    });

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Display full raw NASA POWER climate data
router.get('/climate/raw', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`🌐 FETCHING RAW CLIMATE DATA FROM NASA POWER`);
    console.log(`📍 Location: ${lat}, ${lon}`);
    console.log(`${'='.repeat(80)}\n`);

    const response = await axios.get('https://power.larc.nasa.gov/api/temporal/climatology/point', {
      params: {
        parameters: 'T2M,PRECTOTCORR,RH2M,WS2M',
        community: 'AG',
        longitude: lon,
        latitude: lat,
        format: 'JSON'
      },
      timeout: 15000
    });

    console.log('✅ RAW NASA POWER RESPONSE:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('\n');

    const data = response.data.properties.parameter;

    res.json({
      message: 'Raw NASA POWER data fetched - check backend console for full output',
      summary: {
        location: {
          lat: parseFloat(lat),
          lon: parseFloat(lon)
        },
        parameters: {
          temperature: {
            description: 'Temperature at 2 Meters (°C)',
            monthlyData: data.T2M,
            annual: Object.values(data.T2M).reduce((a, b) => a + b, 0) / 12
          },
          precipitation: {
            description: 'Precipitation (mm/day)',
            monthlyData: data.PRECTOTCORR,
            annual: Object.values(data.PRECTOTCORR).reduce((a, b) => a + b, 0)
          },
          humidity: {
            description: 'Relative Humidity at 2 Meters (%)',
            monthlyData: data.RH2M,
            annual: Object.values(data.RH2M).reduce((a, b) => a + b, 0) / 12
          },
          windSpeed: {
            description: 'Wind Speed at 2 Meters (m/s)',
            monthlyData: data.WS2M,
            annual: Object.values(data.WS2M).reduce((a, b) => a + b, 0) / 12
          }
        },
        metadata: response.data.header
      },
      fullDataInConsole: true
    });

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Fetch all data at once
router.get('/all/raw', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`🌐 FETCHING ALL RAW DATA FROM ALL APIS`);
    console.log(`📍 Location: ${lat}, ${lon}`);
    console.log(`${'='.repeat(80)}\n`);

    const results = {
      weather: null,
      soil: null,
      climate: null,
      errors: []
    };

    // Fetch weather
    try {
      const weatherResponse = await axios.get(`http://localhost:${process.env.PORT || 3001}/api/debug/weather/raw`, {
        params: { lat, lon }
      });
      results.weather = weatherResponse.data;
    } catch (error) {
      results.errors.push({ api: 'weather', error: error.message });
    }

    // Fetch soil
    try {
      const soilResponse = await axios.get(`http://localhost:${process.env.PORT || 3001}/api/debug/soil/raw`, {
        params: { lat, lon }
      });
      results.soil = soilResponse.data;
    } catch (error) {
      results.errors.push({ api: 'soil', error: error.message });
    }

    // Fetch climate
    try {
      const climateResponse = await axios.get(`http://localhost:${process.env.PORT || 3001}/api/debug/climate/raw`, {
        params: { lat, lon }
      });
      results.climate = climateResponse.data;
    } catch (error) {
      results.errors.push({ api: 'climate', error: error.message });
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`✅ ALL DATA FETCHED - CHECK CONSOLE OUTPUT ABOVE`);
    console.log(`${'='.repeat(80)}\n`);

    res.json({
      message: 'All raw data fetched - check backend console for complete output',
      location: { lat: parseFloat(lat), lon: parseFloat(lon) },
      results,
      note: 'Full raw JSON responses are printed in the backend console'
    });

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
