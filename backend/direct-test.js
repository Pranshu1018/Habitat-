// Direct test to bypass any path issues
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Direct .env test');
console.log('Current directory:', __dirname);
console.log('Parent directory:', path.dirname(__dirname));

// Try to read .env directly
const envPath = path.join(__dirname, '.env');
console.log('Trying to read:', envPath);

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('✅ .env file read successfully');
  console.log('File content preview:');
  console.log(envContent.split('\n').slice(0, 20).join('\n'));
  
  // Parse OPENWEATHER_API_KEY manually
  const lines = envContent.split('\n');
  const apiLine = lines.find(line => line.startsWith('OPENWEATHER_API_KEY='));
  if (apiLine) {
    const apiKey = apiLine.split('=')[1];
    console.log('🔑 Found API key:', apiKey);
    console.log('🔑 Key length:', apiKey.length);
  } else {
    console.log('❌ OPENWEATHER_API_KEY not found in .env');
  }
} catch (error) {
  console.log('❌ Error reading .env:', error.message);
}
