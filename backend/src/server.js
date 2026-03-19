import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

// Load .env FIRST before any other imports
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

// Now import everything else
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import weatherRoutes from './routes/weather.js';
import soilRoutes from './routes/soil.js';
import satelliteRoutes from './routes/satellite.js';
import analyticsRoutes from './routes/analytics.js';
import siteRoutes from './routes/site.js';
import enterpriseRoutes from './routes/enterprise.js';
import realtimeRoutes from './routes/realtime.js';
import pythonAnalysisRoutes from './routes/python-analysis.js';
import debugRoutes from './routes/debug.js';
import managementRoutes from './routes/management.js';
import alertRoutes from './routes/alerts.js';
import chatbotRoutes from './routes/chatbot.js';

// Log API key status
console.log('🔑 API Keys Status:');
console.log('  .env file:', existsSync(envPath) ? '✓ Found' : '✗ Not found');
console.log('  OpenWeather:', process.env.OPENWEATHER_API_KEY ? '✓ Loaded' : '✗ Missing');
console.log('  Sentinel Hub:', process.env.SENTINEL_CLIENT_ID ? '✓ Loaded' : '✗ Missing');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:8081', 'http://127.0.0.1:55056'];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Render health checks)
    if (!origin) return callback(null, true);

    // Allow any vercel.app subdomain automatically
    const isVercel = /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin);

    if (isVercel || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/weather', weatherRoutes);
app.use('/api/soil', soilRoutes);
app.use('/api/satellite', satelliteRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/site', siteRoutes);
app.use('/api/enterprise', enterpriseRoutes);
app.use('/api', realtimeRoutes); // Real-time data routes
app.use('/api/python-analysis', pythonAnalysisRoutes); // Python analyzer with real APIs
app.use('/api/debug', debugRoutes); // Debug routes to see raw API data
app.use('/api/management', managementRoutes); // Management dashboard with risk analysis
app.use('/api/alerts', alertRoutes); // SMS alert system
app.use('/api/chatbot', chatbotRoutes); // AI chatbot with Gemini

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      status: err.status || 500
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      status: 404
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🌳 Habitat Backend API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app;
