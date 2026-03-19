#!/usr/bin/env node

/**
 * Habitat Platform Setup Script
 * Helps users configure the application
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setup() {
  console.log('\n🌳 Welcome to Habitat Platform Setup\n');
  console.log('This script will help you configure your environment.\n');

  // Check if .env already exists
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');

  if (fs.existsSync(envPath)) {
    const overwrite = await question('.env file already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('\nSetup cancelled. Your existing .env file was not modified.\n');
      rl.close();
      return;
    }
  }

  console.log('\n📝 API Configuration\n');
  console.log('You can skip any API key by pressing Enter.');
  console.log('The application will use fallback data for skipped APIs.\n');

  // OpenWeatherMap API Key
  console.log('1. OpenWeatherMap API Key');
  console.log('   Get your free key at: https://openweathermap.org/api');
  const weatherKey = await question('   Enter API key (or press Enter to skip): ');

  // Mapbox Token
  console.log('\n2. Mapbox Token (Optional)');
  console.log('   Get your token at: https://account.mapbox.com/');
  const mapboxToken = await question('   Enter token (or press Enter to use default): ');

  // Sentinel Hub
  console.log('\n3. Sentinel Hub Instance ID (Optional)');
  console.log('   Get your instance at: https://www.sentinel-hub.com/');
  const sentinelId = await question('   Enter instance ID (or press Enter to skip): ');

  // Create .env file
  let envContent = '# Habitat Platform Environment Variables\n\n';
  
  if (weatherKey) {
    envContent += `# OpenWeatherMap API Key\nVITE_OPENWEATHER_API_KEY=${weatherKey}\n\n`;
  } else {
    envContent += `# OpenWeatherMap API Key (not configured - using fallback data)\n# VITE_OPENWEATHER_API_KEY=your_key_here\n\n`;
  }

  if (mapboxToken) {
    envContent += `# Mapbox Token\nVITE_MAPBOX_TOKEN=${mapboxToken}\n\n`;
  } else {
    envContent += `# Mapbox Token (using default)\n# VITE_MAPBOX_TOKEN=your_token_here\n\n`;
  }

  if (sentinelId) {
    envContent += `# Sentinel Hub Instance ID\nVITE_SENTINEL_INSTANCE_ID=${sentinelId}\n\n`;
  } else {
    envContent += `# Sentinel Hub Instance ID (optional)\n# VITE_SENTINEL_INSTANCE_ID=your_instance_id_here\n\n`;
  }

  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ Configuration saved to .env\n');

  // Summary
  console.log('📊 Configuration Summary:');
  console.log(`   OpenWeatherMap: ${weatherKey ? '✓ Configured' : '✗ Not configured (using fallback)'}`);
  console.log(`   Mapbox: ${mapboxToken ? '✓ Configured' : '○ Using default'}`);
  console.log(`   Sentinel Hub: ${sentinelId ? '✓ Configured' : '○ Not configured'}`);

  console.log('\n🚀 Next Steps:');
  console.log('   1. Run: npm install');
  console.log('   2. Run: npm run dev');
  console.log('   3. Open: http://localhost:5173');
  console.log('\n💡 Tip: Run "npm run test:apis" to test API connectivity\n');

  rl.close();
}

setup().catch(error => {
  console.error('\n❌ Setup failed:', error.message);
  rl.close();
  process.exit(1);
});
