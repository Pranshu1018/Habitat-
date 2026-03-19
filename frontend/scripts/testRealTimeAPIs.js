// API Testing Script - Test all real-time data sources
import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend
dotenv.config({ path: join(__dirname, '../backend/.env') });

const API_BASE = 'http://localhost:3001/api';
const TEST_LOCATION = { lat: 14.0, lon: 75.5, name: 'Western Ghats' };

console.log('\n🧪 HABITAT API Testing Suite\n');
console.log('='.repeat(60));

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to test API
async function testAPI(name, url, params = {}) {
  try {
    console.log(`\n📡 Testing: ${name}`);
    console.log(`   URL: ${url}`);
    
    const startTime = Date.now();
    const response = await axios.get(url, { 
      params,
      timeout: 15000 
    });
    const duration = Date.now() - startTime;
    
    console.log(`   ✅ SUCCESS (${duration}ms)`);
    console.log(`   Data source: ${response.data.source || 'Unknown'}`);
    console.log(`   Cached: ${response.data.cached || false}`);
    
    results.passed++;
    results.tests.push({ name, status: 'PASS', duration, data: response.data });
    
    return response.data;
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}`);
    
    results.failed++;
    results.tests.push({ name, status: 'FAIL', error: error.message });
    
    return null;
  }
}

// Main test suite
async function runTests() {
  console.log('\n🔍 Checking Backend Server...');
  
  try {
    await axios.get('http://localhost:3001/health', { timeout: 5000 });
    console.log('✅ Backend server is running\n');
  } catch (error) {
    console.log('❌ Backend server is NOT running!');
    console.log('   Please start it with: cd backend && npm run dev\n');
    process.exit(1);
  }

  console.log('🌍 Test Location:', TEST_LOCATION.name);
  console.log(`   Coordinates: ${TEST_LOCATION.lat}, ${TEST_LOCATION.lon}\n`);
  console.log('='.repeat(60));

  // Test 1: OpenWeatherMap - Current Weather
  await testAPI(
    'OpenWeatherMap - Current Weather',
    `${API_BASE}/weather/current`,
    { lat: TEST_LOCATION.lat, lon: TEST_LOCATION.lon }
  );

  // Test 2: OpenWeatherMap - 7-Day Forecast
  await testAPI(
    'OpenWeatherMap - 7-Day Forecast',
    `${API_BASE}/weather/forecast`,
    { lat: TEST_LOCATION.lat, lon: TEST_LOCATION.lon }
  );

  // Test 3: NASA POWER - Historical Climate
  await testAPI(
    'NASA POWER - Historical Climate (FREE)',
    `${API_BASE}/climate/historical`,
    { lat: TEST_LOCATION.lat, lon: TEST_LOCATION.lon }
  );

  // Test 4: SoilGrids - Soil Data
  await testAPI(
    'SoilGrids - Soil Properties (FREE)',
    `${API_BASE}/soil/detailed`,
    { lat: TEST_LOCATION.lat, lon: TEST_LOCATION.lon }
  );

  // Test 5: Sentinel Hub - NDVI (if configured)
  const sentinelConfigured = process.env.SENTINEL_CLIENT_ID && process.env.SENTINEL_CLIENT_SECRET;
  if (sentinelConfigured) {
    console.log('\n🛰️  Sentinel Hub credentials found - testing satellite data...');
    await testAPI(
      'Sentinel Hub - NDVI & Vegetation',
      `${API_BASE}/satellite/ndvi-realtime`,
      { 
        lat: TEST_LOCATION.lat, 
        lon: TEST_LOCATION.lon,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      }
    );
  } else {
    console.log('\n🛰️  Sentinel Hub - SKIPPED (credentials not configured)');
    console.log('   Add SENTINEL_CLIENT_ID and SENTINEL_CLIENT_SECRET to backend/.env');
    results.tests.push({ name: 'Sentinel Hub', status: 'SKIP', reason: 'Not configured' });
  }

  // Test 6: Global Forest Watch (if configured)
  const gfwConfigured = process.env.GFW_API_KEY;
  if (gfwConfigured) {
    console.log('\n🌲 Global Forest Watch API key found - testing...');
    await testAPI(
      'Global Forest Watch - Deforestation Alerts',
      `${API_BASE}/forest/deforestation`,
      { lat: TEST_LOCATION.lat, lon: TEST_LOCATION.lon, radius: 5000 }
    );
  } else {
    console.log('\n🌲 Global Forest Watch - SKIPPED (API key not configured)');
    console.log('   Add GFW_API_KEY to backend/.env for deforestation alerts');
    results.tests.push({ name: 'Global Forest Watch', status: 'SKIP', reason: 'Not configured' });
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 TEST SUMMARY\n');
  console.log(`   Total Tests: ${results.passed + results.failed}`);
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   ⏭️  Skipped: ${results.tests.filter(t => t.status === 'SKIP').length}`);

  // Print detailed results
  console.log('\n📋 DETAILED RESULTS:\n');
  results.tests.forEach((test, index) => {
    const icon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⏭️';
    console.log(`   ${index + 1}. ${icon} ${test.name}`);
    if (test.status === 'PASS') {
      console.log(`      Duration: ${test.duration}ms`);
      console.log(`      Source: ${test.data?.source || 'Unknown'}`);
    } else if (test.status === 'FAIL') {
      console.log(`      Error: ${test.error}`);
    } else if (test.status === 'SKIP') {
      console.log(`      Reason: ${test.reason}`);
    }
  });

  // Configuration recommendations
  console.log('\n💡 RECOMMENDATIONS:\n');
  
  if (results.failed === 0 && results.passed > 0) {
    console.log('   🎉 All configured APIs are working perfectly!');
  }
  
  if (!sentinelConfigured) {
    console.log('   📡 Add Sentinel Hub credentials for real satellite imagery');
    console.log('      Sign up: https://www.sentinel-hub.com/');
  }
  
  if (!gfwConfigured) {
    console.log('   🌲 Add Global Forest Watch API key for deforestation alerts');
    console.log('      Sign up: https://www.globalforestwatch.org/');
  }

  if (results.passed >= 4) {
    console.log('\n   ✨ Your system has enough data sources for a complete demo!');
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Testing complete!\n');

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Test suite failed:', error.message);
  process.exit(1);
});
