# Habitat Platform - Backend API

Express.js backend API for the Habitat Adaptive Reforestation Management Platform.

## 🚀 Quick Start

### Installation

```bash
cd backend
npm install
```

### Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your API keys
```

### Running the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3001`

## 📡 API Endpoints

### Health Check
```
GET /health
```

### Weather Endpoints
```
GET /api/weather/current?lat={lat}&lon={lon}
GET /api/weather/forecast?lat={lat}&lon={lon}
```

### Soil Endpoints
```
GET /api/soil/data?lat={lat}&lon={lon}
```

### Satellite Endpoints
```
GET /api/satellite/vegetation?lat={lat}&lon={lon}
```

### Analytics Endpoints
```
POST /api/analytics/carbon
POST /api/analytics/risks
POST /api/analytics/species
```

### Site Analysis
```
POST /api/site/analyze
Body: { lat, lon, name, hectares }
```

## 🔧 Environment Variables

```env
PORT=3001
NODE_ENV=development
OPENWEATHER_API_KEY=your_key_here
ALLOWED_ORIGINS=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── routes/
│   │   ├── weather.js       # Weather API routes
│   │   ├── soil.js          # Soil data routes
│   │   ├── satellite.js     # Satellite data routes
│   │   ├── analytics.js     # Analytics routes
│   │   └── site.js          # Site analysis routes
│   └── server.js            # Main server file
├── package.json
└── .env.example
```

## 🔒 Security Features

- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - Prevent abuse
- **Compression** - Response compression

## 🧪 Testing

```bash
# Test health endpoint
curl http://localhost:3001/health

# Test weather endpoint
curl "http://localhost:3001/api/weather/current?lat=14&lon=75"
```

## 📊 Caching

- Weather data: 30 minutes
- Soil data: 24 hours
- Satellite data: 7 days

## 🚀 Deployment

### Using PM2

```bash
npm install -g pm2
pm2 start src/server.js --name habitat-backend
pm2 save
pm2 startup
```

### Using Docker

```bash
docker build -t habitat-backend .
docker run -p 3001:3001 habitat-backend
```

## 📝 API Response Format

### Success Response
```json
{
  "data": { ... },
  "timestamp": "2026-02-04T10:30:00.000Z",
  "cached": false
}
```

### Error Response
```json
{
  "error": {
    "message": "Error description",
    "status": 500
  }
}
```

## 🔗 External APIs Used

- **OpenWeatherMap** - Weather data
- **SoilGrids** - Soil properties
- **NASA POWER** - Climate data

## 📄 License

MIT License - Built for global reforestation
