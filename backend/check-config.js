#!/usr/bin/env node

/**
 * Configuration Checker for Habitat Backend
 * Run this to verify environment variables are properly set
 */

import dotenv from 'dotenv';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env if it exists
const envPath = path.join(__dirname, '.env');
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

console.log('\n🔍 Habitat Backend Configuration Check\n');
console.log('=' .repeat(60));

// Check categories
const checks = {
  'Server Configuration': [
    { name: 'NODE_ENV', required: false, value: process.env.NODE_ENV || 'development' },
    { name: 'PORT', required: false, value: process.env.PORT || '3001' },
  ],
  'Weather & Climate APIs': [
    { name: 'OPENWEATHER_API_KEY', required: true, value: process.env.OPENWEATHER_API_KEY },
  ],
  'AI & Chatbot': [
    { name: 'GROQ_API_KEY', required: true, value: process.env.GROQ_API_KEY },
  ],
  'Satellite Imagery': [
    { name: 'SENTINEL_CLIENT_ID', required: false, value: process.env.SENTINEL_CLIENT_ID },
    { name: 'SENTINEL_CLIENT_SECRET', required: false, value: process.env.SENTINEL_CLIENT_SECRET },
  ],
  'SMS Alerts (Twilio)': [
    { name: 'TWILIO_ACCOUNT_SID', required: false, value: process.env.TWILIO_ACCOUNT_SID },
    { name: 'TWILIO_AUTH_TOKEN', required: false, value: process.env.TWILIO_AUTH_TOKEN },
    { name: 'TWILIO_PHONE_NUMBER', required: false, value: process.env.TWILIO_PHONE_NUMBER },
    { name: 'OFFICER_PHONE_NUMBER', required: false, value: process.env.OFFICER_PHONE_NUMBER },
  ],
  'CORS & Security': [
    { name: 'ALLOWED_ORIGINS', required: false, value: process.env.ALLOWED_ORIGINS },
  ],
};

let hasErrors = false;
let hasWarnings = false;

for (const [category, items] of Object.entries(checks)) {
  console.log(`\n📦 ${category}`);
  console.log('-'.repeat(60));
  
  for (const item of items) {
    const status = item.value 
      ? '✓' 
      : item.required 
        ? '✗' 
        : '⚠️';
    
    const statusColor = item.value 
      ? '\x1b[32m' 
      : item.required 
        ? '\x1b[31m' 
        : '\x1b[33m';
    
    const resetColor = '\x1b[0m';
    
    // Mask sensitive values
    let displayValue = 'Not set';
    if (item.value) {
      if (item.name.includes('KEY') || item.name.includes('SECRET') || item.name.includes('TOKEN')) {
        displayValue = `${item.value.substring(0, 8)}...${item.value.substring(item.value.length - 4)}`;
      } else {
        displayValue = item.value;
      }
    }
    
    console.log(`  ${statusColor}${status}${resetColor} ${item.name.padEnd(30)} ${displayValue}`);
    
    if (!item.value && item.required) {
      hasErrors = true;
    } else if (!item.value && !item.required) {
      hasWarnings = true;
    }
  }
}

console.log('\n' + '='.repeat(60));
console.log('\n📊 Summary:');

if (hasErrors) {
  console.log('\x1b[31m✗ ERRORS: Required environment variables are missing!\x1b[0m');
  console.log('  The following are REQUIRED for core functionality:');
  console.log('  • OPENWEATHER_API_KEY - For weather data');
  console.log('  • GROQ_API_KEY - For AI chatbot');
}

if (hasWarnings) {
  console.log('\x1b[33m⚠️  WARNINGS: Optional features not configured\x1b[0m');
  console.log('  The app will work with mock/fallback data for:');
  console.log('  • Sentinel Hub - Satellite imagery');
  console.log('  • Twilio - SMS alerts');
}

if (!hasErrors && !hasWarnings) {
  console.log('\x1b[32m✓ All configuration complete!\x1b[0m');
}

console.log('\n' + '='.repeat(60));

// Free APIs info
console.log('\n✅ Free APIs (No Configuration Required):');
console.log('  • SoilGrids - Soil data');
console.log('  • NASA POWER - Climate data');
console.log('  • OpenLandMap - Land classification');

// Platform-specific instructions
console.log('\n📚 Configuration Instructions:\n');

if (existsSync(envPath)) {
  console.log('  Local Development:');
  console.log(`  → Edit: ${envPath}`);
} else {
  console.log('  Local Development:');
  console.log('  → Copy .env.example to .env');
  console.log('  → Add your API keys to .env');
}

console.log('\n  Render.com Deployment:');
console.log('  1. Go to dashboard.render.com');
console.log('  2. Select your service → Environment tab');
console.log('  3. Add missing environment variables');
console.log('  4. Save and redeploy');

console.log('\n  See RENDER_DEPLOYMENT.md for detailed instructions\n');

// Exit with error code if required vars missing
process.exit(hasErrors ? 1 : 0);
