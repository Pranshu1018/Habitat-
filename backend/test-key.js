// Simple API key test in backend directory
import dotenv from 'dotenv';
dotenv.config();

console.log('🔑 API Key Test');
console.log('OPENWEATHER_API_KEY:', process.env.OPENWEATHER_API_KEY);
console.log('Length:', process.env.OPENWEATHER_API_KEY?.length);

// Test the key directly
import axios from 'axios';

async function testKey() {
  try {
    const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        lat: 1.37,
        lon: 32.29,
        appid: process.env.OPENWEATHER_API_KEY,
        units: 'metric'
      }
    });
    
    console.log('✅ SUCCESS! Real weather data:');
    console.log('Temperature:', response.data.main.temp, '°C');
    console.log('Humidity:', response.data.main.humidity, '%');
    console.log('Location:', response.data.name);
    
  } catch (error) {
    console.log('❌ ERROR:', error.response?.data?.message || error.message);
  }
}

testKey();
