#!/usr/bin/env node

/**
 * API Connectivity Test Script
 * Tests all external API connections
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(process.cwd(), '.env');
const env = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#][^=]+)=(.+)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim();
    }
  });
}

const OPENWEATHER_KEY = env.VITE_OPENWEATHER_API_KEY || 'demo';

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    }).on('error', reject).on('timeout', () => reject(new Error('Timeout')));
  });
}

async function testOpenWeather() {
  console.log('\n🌤️  Testing OpenWeatherMap API...');
  
  if (OPENWEATHER_KEY === 'demo') {
    console.log('   ⚠️  API key not configured');
    console.log('   ℹ️  Set VITE_OPENWEATHER_API_KEY in .env file');
    return false;
  }

  try {
    const start = Date.now();
    const result = await httpsGet(
      `https://api.openweathermap.org/data/2.5/weather?lat=14&lon=75&appid=${OPENWEATHER_KEY}&units=metric`
    );
    const time = Date.now() - start;

    if (result.status === 200) {
      console.log(`   ✅ Connected successfully (${time}ms)`);
      console.log(`   📊 Temperature: ${result.data.main.temp}°C`);
      console.log(`   📊 Humidity: ${result.data.main.humidity}%`);
      return true;
    } else if (result.status === 401) {
      console.log('   ❌ Invalid API key');
      console.log('   ℹ️  Check your VITE_OPENWEATHER_API_KEY');
      return false;
    } else {
      console.log(`   ❌ HTTP ${result.status}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Connection failed: ${error.message}`);
    return false;
  }
}

async function testSoilGrids() {
  console.log('\n🌱 Testing SoilGrids API...');
  
  try {
    const start = Date.now();
    const result = await httpsGet(
      'https://rest.isric.org/soilgrids/v2.0/properties/query?lon=75&lat=14&property=phh2o&depth=0-5cm&value=mean'
    );
    const time = Date.now() - start;

    if (result.status === 200) {
      console.log(`   ✅ Connected successfully (${time}ms)`);
      console.log('   📊 Soil data available');
      return true;
    } else {
      console.log(`   ❌ HTTP ${result.status}`);
      return false;
    }
  } catch (error) {
    console.log(`   ⚠️  Connection failed: ${error.message}`);
    console.log('   ℹ️  Will use fallback data');
    return false;
  }
}

async function testNASAPower() {
  console.log('\n🛰️  Testing NASA POWER API...');
  
  try {
    const start = Date.now();
    const result = await httpsGet(
      'https://power.larc.nasa.gov/api/temporal/daily/point?parameters=ALLSKY_SFC_SW_DWN&community=AG&longitude=75&latitude=14&start=20240101&end=20240107&format=JSON'
    );
    const time = Date.now() - start;

    if (result.status === 200) {
      console.log(`   ✅ Connected successfully (${time}ms)`);
      console.log('   📊 Climate data available');
      return true;
    } else {
      console.log(`   ❌ HTTP ${result.status}`);
      return false;
    }
  } catch (error) {
    console.log(`   ⚠️  Connection failed: ${error.message}`);
    console.log('   ℹ️  Will use fallback data');
    return false;
  }
}

async function runTests() {
  console.log('\n🌳 Habitat Platform - API Connectivity Test\n');
  console.log('═══════════════════════════════════════════\n');

  const results = {
    openweather: await testOpenWeather(),
    soilgrids: await testSoilGrids(),
    nasa: await testNASAPower(),
  };

  console.log('\n═══════════════════════════════════════════\n');
  console.log('📊 Summary:\n');

  const total = Object.keys(results).length;
  const success = Object.values(results).filter(Boolean).length;

  console.log(`   Total APIs tested: ${total}`);
  console.log(`   Successful: ${success}`);
  console.log(`   Failed/Skipped: ${total - success}\n`);

  if (success === total) {
    console.log('✅ All systems operational!');
    console.log('   The platform will use real data from all sources.\n');
  } else if (success > 0) {
    console.log('⚠️  Partial connectivity');
    console.log('   The platform will use a mix of real and fallback data.\n');
  } else {
    console.log('⚠️  No API connectivity');
    console.log('   The platform will use fallback data only.\n');
  }

  console.log('💡 Tips:');
  if (!results.openweather) {
    console.log('   • Get OpenWeatherMap API key: https://openweathermap.org/api');
    console.log('   • Run: npm run setup');
  }
  console.log('   • Check your internet connection');
  console.log('   • Review SETUP_GUIDE.md for detailed instructions\n');

  process.exit(success > 0 ? 0 : 1);
}

runTests().catch(error => {
  console.error('\n❌ Test failed:', error.message);
  process.exit(1);
});
