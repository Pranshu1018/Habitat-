# Habitat - Comprehensive Interview Preparation Document

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [System Architecture & Data Flow](#system-architecture--data-flow)
4. [Backend Architecture](#backend-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [ML Model Implementation](#ml-model-implementation)
7. [Database Schema & Design](#database-schema--design)
8. [API Documentation](#api-documentation)
9. [Key Algorithms & Business Logic](#key-algorithms--business-logic)
10. [Data Sources & Integrations](#data-sources--integrations)
11. [Security & Performance](#security--performance)
12. [Deployment Strategy](#deployment-strategy)
13. [Technical Challenges & Solutions](#technical-challenges--solutions)
14. [Key Technical Terms](#key-technical-terms)

---

## Project Overview

### What is Habitat?
Habitat is an **end-to-end intelligent reforestation management platform** that guides forest restoration projects from site selection through decades of adaptive forest management. It uses real-time satellite data, ML risk prediction, and AI-driven decision support to maximize forest survival rates.

### Core Problem Solved
- **60-70% of planted saplings die within the first year** due to poor site selection, wrong species choice, and lack of follow-up care
- No unified tool connecting site analysis → planting → monitoring → intervention → reporting
- Field workers lack early warning systems for drought, pest outbreaks, or heat stress
- Carbon credit certification is complex and poorly understood

### Complete User Workflow
```
Landing → Planning → Planting → Monitoring → Prediction → Intervention → Reporting
```

### Key Features
- Interactive satellite map with site selection
- AI-powered species recommendation engine
- ML-based 8-day risk prediction system
- Real-time satellite vegetation monitoring (NDVI)
- Environmental simulation for risk assessment
- Kanban-style intervention tracking
- Carbon sequestration projection (20-year IPCC models)
- Carbon credit certification workflow (Verra VCS, Gold Standard, CCB)
- Real-time notification system
- AI chatbot for reforestation queries
- SMS alerts via Twilio integration

---

## Architecture & Tech Stack

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  Vite + TypeScript + Tailwind + shadcn/ui + Mapbox GL       │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST API
┌──────────────────────▼──────────────────────────────────────┐
│                  Backend (Node.js/Express)                   │
│  API Routes + Services + Caching + Rate Limiting            │
└──────┬──────────────────────────────────────────┬───────────┘
       │                                          │
       │ HTTP                                     │ HTTP
┌──────▼──────┐                          ┌───────▼────────┐
│  ML Service │                          │  Firebase DB   │
│  (Python/   │                          │  Realtime      │
│   Flask)    │                          │  Database      │
└─────────────┘                          └────────────────┘
       │
       │ External APIs
┌──────▼─────────────────────────────────────────────────────┐
│  OpenWeatherMap | SoilGrids | Sentinel Hub | NASA POWER    │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Frontend
| Technology | Purpose | Key Features |
|------------|---------|--------------|
| React 18 + TypeScript | UI Framework | Component-based, type safety |
| Vite | Build Tool | Fast HMR, optimized builds |
| Tailwind CSS + shadcn/ui | Styling | Utility-first, accessible components |
| Framer Motion | Animations | Smooth transitions, gestures |
| Mapbox GL JS | Maps | Interactive satellite maps |
| Recharts | Data Visualization | Charts, graphs |
| Firebase SDK | Database | Real-time sync, auth |
| TanStack Query | Data Fetching | Caching, synchronization |
| React Router v6 | Routing | Client-side routing |

#### Backend
| Technology | Purpose | Key Features |
|------------|---------|--------------|
| Node.js + Express | API Server | RESTful APIs, middleware |
| Helmet + CORS | Security | Headers, cross-origin |
| express-rate-limit | Rate Limiting | DDoS protection |
| Axios | HTTP Client | External API calls |
| node-cache | Caching | 30-min TTL, performance |
| Twilio | SMS Alerts | Critical notifications |
| Google Gemini / Groq | AI Chatbot | Conversational AI |

#### ML Service
| Technology | Purpose | Key Features |
|------------|---------|--------------|
| Python 3.11 | Runtime | ML ecosystem |
| Flask | HTTP Microservice | REST endpoints |
| scikit-learn | ML Framework | Gradient Boosting |
| NumPy + Pandas | Data Processing | Numerical computing |
| pickle | Model Serialization | Model persistence |

---

## System Architecture & Data Flow

### Complete Data Flow Diagram

```
User Action → Frontend Component → API Service → Backend Route → 
External APIs/ML Service → Data Processing → Response → Firebase → UI Update
```

### Site Analysis Flow (Planning Phase)

```
1. User selects location on Mapbox map
   ↓
2. Frontend sends POST /api/site/analyze with lat/lng
   ↓
3. Backend site.js route:
   a. Phase 1: Parallel API calls
      - OpenWeatherMap (weather)
      - OpenLandMap → SoilGrids → NASA POWER (soil)
      - Biome-calibrated estimate (vegetation/NDVI)
   ↓
4. Phase 2: AI Fallback (if APIs fail)
   - intelligentFallbackService generates data using Gemini/Groq
   - Cross-API context passed for accuracy
   ↓
5. Phase 3: Scoring
   - calculateLandSuitabilityScore()
   - Soil score (40%), Climate score (30%), Vegetation score (30%)
   ↓
6. Phase 4: Species Recommendation
   - speciesRecommendationEngine.getRecommendations()
   - Matches 20 Indian tree species against conditions
   - AI supplement if < 3 species returned
   ↓
7. Response with audit trail
   - Data sources, confidence scores, API workflow
   ↓
8. Frontend displays results + saves to Firebase
```

### Risk Prediction Flow (Prediction Phase)

```
1. User selects project in PredictionDashboard
   ↓
2. Frontend calls GET /api/management/predictions?lat=&lon=&days=8
   ↓
3. Backend management.js route:
   a. Fetch real data in parallel:
      - Weather forecast (8-day)
      - Soil data
      - Satellite vegetation (NDVI)
   ↓
4. Build ML features (11 features):
   - temp_max, temp_avg, precip_7d, precip_14d
   - humidity, soil_moisture, soil_ph
   - ndvi, ndvi_trend, tree_age, day_of_year
   ↓
5. Try ML Service (Python Flask on port 5001):
   - POST http://localhost:5001/predict/8day
   - Gradient Boosting model prediction
   ↓
6. Fallback to Rule Engine (if ML unavailable):
   - riskAnalysisEngine.calculateRiskScore()
   - Drought (35%), Heat Stress (25%), Water Scarcity (25%), Vegetation Decline (15%)
   ↓
7. Generate 8-day forecast with:
   - Risk score (0-100), risk level (HIGH/MEDIUM/LOW)
   - Primary cause, breakdown, recommended actions
   ↓
8. HIGH risk days trigger notifications in NotificationCenter
```

### Monitoring Flow (Monitoring Phase)

```
1. User selects project in MonitoringDashboard
   ↓
2. Firebase real-time subscription:
   - projectService.subscribeToProjects()
   - onValue() listener for live updates
   ↓
3. Fetch live metrics:
   - GET /api/satellite/vegetation (NDVI from Sentinel Hub)
   - GET /api/soil/data (soil health metrics)
   ↓
4. Calculate derived metrics:
   - Soil health score (pH, moisture, nutrients)
   - Survival rate (based on NDVI + soil)
   - Trend (up/stable/down)
   ↓
5. Display charts:
   - NDVI trend (6-month area chart)
   - Survival rate (bar chart)
   - Soil & climate metrics
   ↓
6. Health status indicator:
   - Healthy (≥80%), Warning (60-79%), Critical (<60%)
```

### Intervention Flow (Intervention Phase)

```
1. User creates intervention in InterventionDashboard
   ↓
2. Kanban board with 3 columns:
   - Planned → In Progress → Completed
   ↓
3. Firebase operations:
   - interventionService.createIntervention()
   - push() to /interventions collection
   ↓
4. Status updates:
   - Drag between columns OR arrow buttons
   - interventionService.updateInterventionStatus()
   ↓
5. Tracking:
   - Completion rate calculation
   - Total cost aggregation
```

---

## Backend Architecture

### Project Structure
```
backend/
├── src/
│   ├── routes/           # API route handlers
│   │   ├── weather.js    # OpenWeatherMap integration
│   │   ├── soil.js       # SoilGrids API
│   │   ├── satellite.js  # Sentinel Hub / NDVI
│   │   ├── site.js       # Comprehensive site analysis
│   │   ├── management.js # ML predictions + risk zones
│   │   ├── analytics.js  # Carbon + species analytics
│   │   ├── alerts.js     # Twilio SMS alerts
│   │   └── chatbot.js    # Gemini/Groq AI chat
│   ├── services/         # Business logic
│   │   ├── riskAnalysisEngine.js        # Rule-based risk scoring
│   │   ├── speciesRecommendationEngine.js  # Species matching
│   │   ├── intelligentFallbackService.js   # AI data generation
│   │   ├── geminiService.js              # Google Gemini AI
│   │   ├── groqService.js                # Groq AI
│   │   └── twilioService.js              # SMS notifications
│   ├── data/            # Static data
│   │   └── indian-species-database.js   # 20 Indian tree species
│   └── server.js        # Express app entry point
├── ml/
│   ├── forest_risk_model.py  # ML model training + prediction
│   ├── ml_server.py           # Flask microservice
│   └── risk_model.pkl         # Serialized model
└── package.json
```

### Server Configuration (server.js)

**Middleware Stack:**
1. **Helmet** - Security headers (CSP, XSS protection)
2. **Compression** - Gzip compression for responses
3. **CORS** - Cross-origin resource sharing
   - Allows Vercel domains automatically
   - Configurable via ALLOWED_ORIGINS env var
4. **Rate Limiting** - express-rate-limit
   - Window: 15 minutes (configurable)
   - Max requests: 100 (configurable)
5. **Body Parsing** - express.json(), express.urlencoded()

**Route Mounting:**
```javascript
/api/weather     → weatherRoutes
/api/soil        → soilRoutes
/api/satellite   → satelliteRoutes
/api/analytics   → analyticsRoutes
/api/site        → siteRoutes
/api/enterprise  → enterpriseRoutes
/api/realtime    → realtimeRoutes
/api/python-analysis → pythonAnalysisRoutes
/api/debug       → debugRoutes
/api/management  → managementRoutes
/api/alerts      → alertRoutes
/api/chatbot     → chatbotRoutes
```

### Key Route Implementations

#### 1. Site Analysis Route (site.js)

**Phase-Based Architecture:**

**Phase 1: Parallel API Fetching**
```javascript
const [weatherResult, soilResult, vegetationResult] = await Promise.all([
  fetchWeatherPhase1(lat, lon),      // OpenWeatherMap only
  fetchSoilPhase1(lat, lon),         // OpenLandMap → SoilGrids → NASA POWER
  fetchVegetationPhase1(lat, lon)   // Biome-calibrated (always succeeds)
]);
```

**Phase 2: AI Fallback**
- If APIs fail, `intelligentFallbackService` uses Gemini/Groq
- Cross-API context: successful API data informs AI generation
- Example: If soil fails but weather succeeds, AI uses weather to estimate soil

**Phase 3: Scoring**
```javascript
const landScoreResult = calculateLandSuitabilityScore(weather, soil, vegetation);
// Weighted: Vegetation (40%) + Soil (30%) + Climate (30%)
```

**Phase 4: Species Recommendation**
- `speciesRecommendationEngine.getRecommendations()`
- Scores 20 Indian tree species against conditions
- AI supplement if < 3 species returned

**Phase 5: Response Assembly**
- Full audit trail: tried APIs, succeeded, failed, AI-filled
- Confidence scores for each data source

#### 2. Risk Prediction Route (management.js)

**ML-First with Rule-Based Fallback:**
```javascript
let predictions = await get8DayPredictions(baseFeatures, forecast);
let modelUsed = 'ml';

if (!predictions) {
  // ML service unavailable → use rule engine
  modelUsed = 'rules';
  predictions = [];
  for (let i = 0; i < numDays; i++) {
    const risk = await riskAnalysisEngine.calculateRiskScore({...});
    predictions.push({...});
  }
}
```

**Feature Engineering:**
```javascript
const baseFeatures = {
  temp_max: avgTemp + 5,
  temp_avg: avgTemp,
  precip_7d: forecast.slice(0, 7).reduce(...),
  precip_14d: forecast.reduce(...),
  humidity: forecast[0]?.humidity || 65,
  soil_moisture: soil?.moisture || 60,
  soil_ph: soil?.ph || 6.5,
  ndvi: vegetation?.ndvi || 0.5,
  ndvi_trend: vegetation?.changeRate || 0,
  tree_age: 1,
  day_of_year: Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000)
};
```

#### 3. Weather Route (weather.js)

**Caching Strategy:**
```javascript
const cache = new NodeCache({ stdTTL: 1800 }); // 30 minutes
const cacheKey = `weather_${lat}_${lon}`;

if (nocache !== 'true') {
  const cached = cache.get(cacheKey);
  if (cached) return res.json({ ...cached, cached: true });
}
```

**Graceful Degradation:**
1. Try OpenWeatherMap API
2. On failure: fall back to location-aware mock data
3. Mock data is deterministic based on location (consistent for demos)

---

## Frontend Architecture

### Project Structure
```
frontend/src/
├── pages/                    # Route-level components
│   ├── Landing.tsx           # Home/marketing page
│   ├── PlanningDashboard.tsx # Site selection + analysis
│   ├── PlantingDashboard.tsx # Planting records
│   ├── MonitoringDashboard.tsx # Live forest health
│   ├── PredictionDashboard.tsx # ML risk predictions
│   ├── InterventionDashboard.tsx # Kanban interventions
│   └── ReportingDashboard.tsx # Impact + carbon credits
├── components/
│   ├── layout/
│   │   └── DashboardLayout.tsx # Sidebar + topbar shell
│   ├── analytics/
│   │   ├── CarbonProjectionChart.tsx  # 20-yr IPCC chart
│   │   ├── CarbonCertification.tsx    # VCS/GS/CCB workflow
│   │   └── CarbonSequestrationCard.tsx
│   ├── region/
│   │   ├── RegionDetailPanel.tsx
│   │   ├── RiskAlerts.tsx
│   │   └── HealthAnalytics.tsx
│   ├── NotificationCenter.tsx   # Bell icon + alerts
│   ├── MapView.tsx              # Mapbox GL wrapper
│   ├── Chatbot.tsx              # Gemini/Groq chat
│   └── Header.tsx
├── services/
│   ├── database/
│   │   └── projectService.ts    # Firebase CRUD + subscriptions
│   └── api/                     # Backend API wrappers
├── stores/
│   └── notificationStore.ts     # Global alert pub/sub
├── data/
│   └── mockData.ts              # 8 real-world region datasets
├── config/
│   └── firebase.ts              # Firebase init + anonymous auth
├── context/
│   └── ThemeContext.tsx         # Dark/light theme
└── App.tsx                      # Route definitions
```

### Key Components

#### 1. PlanningDashboard.tsx

**State Management:**
```typescript
const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
const [projectName, setProjectName] = useState('');
const [area, setArea] = useState(100);
const [analyzing, setAnalyzing] = useState(false);
const [result, setResult] = useState<AnalysisResult | null>(null);
const [simConds, setSimConds] = useState<SimConds>({...});
```

**Mapbox Integration:**
```typescript
const map = new mapboxgl.Map({
  container: 'planning-map',
  style: 'mapbox://styles/mapbox/satellite-streets-v12',
  center: [78.9629, 20.5937], // India center
  zoom: 4,
});
map.on('click', e => placePin(e.lngLat.lat, e.lngLat.lng, map));
```

**Environmental Simulation:**
- Sliders for: drought, heatwave, waterlogging, frost, strong winds
- Real-time score adjustment based on simulation
- Alert generation for severe conditions

#### 2. MonitoringDashboard.tsx

**Firebase Real-time Subscription:**
```typescript
useEffect(() => {
  const unsub = projectService.subscribeToProjects((all) => {
    setProjects(all);
    setSelected(prev => prev ? all.find(p => p.id === prev.id) : all[0]);
  });
  return () => unsub();
}, []);
```

**Metrics Calculation:**
```typescript
const fetchMetrics = async (project) => {
  const [veg, soil] = await Promise.all([
    fetch(`${API}/satellite/vegetation?lat=${lat}&lon=${lon}`),
    fetch(`${API}/soil/data?lat=${lat}&lon=${lon}`)
  ]);
  const ndvi = veg?.ndvi ?? 0.42 + Math.random() * 0.12;
  const soilHealth = calcSoilHealth(soil);
  const survival = Math.min(98, 72 + ndvi * 35 + Math.random() * 4);
  // ...
};
```

**Chart Components:**
- NDVI Trend: AreaChart with gradient fill
- Survival Rate: BarChart with rounded bars
- Using Recharts library

#### 3. ProjectService.ts (Firebase)

**Data Models:**
```typescript
interface Project {
  id?: string;
  name: string;
  location: { lat, lon, name, region };
  status: 'planning' | 'planting' | 'monitoring' | 'completed';
  createdAt: any;
  updatedAt: any;
  baseline?: { ndvi, soilMoisture, temperature, date };
  area?: number;
  landScore?: number;
  species?: any[];
  plantingDate?: string;
}
```

**CRUD Operations:**
```typescript
// Create
async createProject(projectData): Promise<string> {
  const newProjectRef = push(projectsRef);
  await set(newProjectRef, {
    ...projectData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return newProjectRef.key;
}

// Real-time Subscription
subscribeToProjects(callback): () => void {
  onValue(projectsRef, (snapshot) => {
    const projects = [];
    snapshot.forEach(child => projects.push({ id: child.key, ...child.val() }));
    callback(projects.sort(...));
  });
  return () => off(projectsRef);
}
```

---

## ML Model Implementation

### Model Architecture

**Algorithm:** Gradient Boosting Regressor (scikit-learn)
```python
model = Pipeline([
  ("scaler", StandardScaler()),
  ("gbr", GradientBoostingRegressor(
    n_estimators=150,
    max_depth=4,
    learning_rate=0.08,
    subsample=0.8,
    min_samples_leaf=15,
    random_state=42,
  ))
])
```

### Training Data Generation

**Synthetic Data Generation (8,000 samples):**
```python
def generate_training_data(n: int = 4000) -> pd.DataFrame:
  # Simulate Indian climate zones
  temp_avg = rng.uniform(15, 42, n)
  temp_max = temp_avg + rng.uniform(2, 8, n)
  precip_14d = rng.exponential(80, n).clip(0, 500)
  precip_7d = precip_14d * rng.uniform(0.3, 0.7, n)
  humidity = rng.uniform(25, 95, n)
  soil_moist = rng.uniform(15, 90, n)
  soil_ph = rng.uniform(4.5, 8.5, n)
  ndvi = rng.uniform(0.1, 0.85, n)
  ndvi_trend = rng.uniform(-8, 4, n)
  tree_age = rng.uniform(0.1, 10, n)
  doy = rng.integers(1, 366, n).astype(float)
```

**Rule-Based Risk Labeling:**
```python
# Drought component (0-35)
drought = np.zeros(n)
drought += np.where(precip_7d < 5, 35, np.where(precip_7d < 10, 25, ...))
drought += np.where(temp_avg > 35, 20, np.where(temp_avg > 32, 12, ...))
drought += np.where(soil_moist < 25, 20, np.where(soil_moist < 35, 12, ...))
risk += drought.clip(0, 35) * 0.35

# Heat stress component (0-30)
heat = np.zeros(n)
heat += np.where(temp_max > 42, 30, np.where(temp_max > 39, 22, ...))
risk += heat.clip(0, 30) * 0.25

# Water scarcity component (0-25)
water = np.zeros(n)
water += np.where(precip_14d < 10, 25, np.where(precip_14d < 25, 18, ...))
evap_idx = (temp_avg / 10) * (100 - humidity) / 100
water += np.where(evap_idx > 4, 15, ...)
risk += water.clip(0, 25) * 0.25

# Vegetation decline component (0-20)
veg = np.zeros(n)
veg += np.where(ndvi < 0.2, 20, np.where(ndvi < 0.3, 14, ...))
risk += veg.clip(0, 20) * 0.15
```

### Feature Engineering

**11 Input Features:**
1. `temp_max` - Max forecast temperature (°C)
2. `temp_avg` - Average temperature (°C)
3. `precip_7d` - Total precipitation last 7 days (mm)
4. `precip_14d` - Total precipitation last 14 days (mm)
5. `humidity` - Relative humidity (%)
6. `soil_moisture` - Soil moisture (%)
7. `soil_ph` - Soil pH
8. `ndvi` - Vegetation index (0-1)
9. `ndvi_trend` - NDVI change rate per period
10. `tree_age` - Age of plantation (years)
11. `day_of_year` - Seasonal factor (1-365)

### Prediction Pipeline

**Single-Day Prediction:**
```python
def predict_risk(features: dict) -> dict:
  model = load_model()
  row = pd.DataFrame([{col: features.get(col, 0.0) for col in FEATURE_COLS}])
  score = float(model.predict(row)[0])
  score = max(0.0, min(100.0, score))
  
  # Feature importance for breakdown
  gbr = model.named_steps["gbr"]
  imps = gbr.feature_importances_
  breakdown = {
    "drought": round((imps["precip_7d"] + imps["precip_14d"] + imps["soil_moisture"]) * score, 1),
    "heatStress": round((imps["temp_max"] + imps["temp_avg"]) * score, 1),
    "waterScarcity": round((imps["humidity"] + imps["precip_14d"]) * score * 0.5, 1),
    "vegetationDecline": round((imps["ndvi"] + imps["ndvi_trend"]) * score, 1),
  }
  
  return {
    "riskScore": round(score, 1),
    "riskLevel": classify_risk(score),
    "primaryCause": primary_labels[primary],
    "breakdown": breakdown,
    "confidence": 90
  }
```

**8-Day Forecast:**
```python
def predict_8_days(base_features: dict, forecast: list) -> list:
  results = []
  for i, day in enumerate(forecast[:8]):
    feats = dict(base_features)
    feats["temp_avg"] = float(day.get("temp", base_features.get("temp_avg", 28)))
    feats["temp_max"] = feats["temp_avg"] + 4.0
    feats["humidity"] = float(day.get("humidity", base_features.get("humidity", 65)))
    
    # Soil moisture degrades over time
    rain = float(day.get("precipitation", 0))
    feats["precip_7d"] = rain * 7
    feats["precip_14d"] = rain * 14
    feats["soil_moisture"] = max(15, base_features.get("soil_moisture", 60) - i * 2.5 + rain * 3)
    feats["ndvi"] = max(0.1, base_features.get("ndvi", 0.5) - i * 0.015)
    feats["ndvi_trend"] = -i * 0.5
    
    pred = predict_risk(feats)
    results.append({
      "day": i + 1,
      "date": (datetime.utcnow() + timedelta(days=i + 1)).isoformat(),
      "riskScore": pred["riskScore"],
      "riskLevel": pred["riskLevel"],
      "primaryCause": pred["primaryCause"],
      "breakdown": pred["breakdown"],
      "actions": get_actions(pred["riskLevel"], pred["primaryCause"])
    })
  return results
```

### Flask Microservice (ml_server.py)

**Endpoints:**
```python
@app.route("/health", methods=["GET"])
def health():
  return jsonify({"status": "ok", "model_exists": MODEL_PATH.exists()})

@app.route("/predict", methods=["POST"])
def predict():
  data = request.get_json(force=True)
  result = predict_risk(data.get("features", data))
  return jsonify(result)

@app.route("/predict/8day", methods=["POST"])
def predict_8day():
  data = request.get_json(force=True)
  base = data.get("base_features", {})
  forecast = data.get("forecast", [])
  predictions = predict_8_days(base, forecast)
  return jsonify({"predictions": predictions, "model": "GradientBoosting"})

@app.route("/train", methods=["POST"])
def retrain():
  train_model()
  return jsonify({"status": "trained", "model": str(MODEL_PATH)})
```

**Auto-Training on Startup:**
```python
if __name__ == "__main__":
  if not MODEL_PATH.exists():
    print("Training model on first start...")
    train_model()
  port = int(os.environ.get("ML_PORT", 5001))
  app.run(host="0.0.0.0", port=port, debug=False)
```

---

## Database Schema & Design

### Firebase Realtime Database Structure

```
habitat-firebase/
├── projects/
│   ├── {projectId}/
│   │   ├── name: string
│   │   ├── location: { lat, lon, name, region }
│   │   ├── status: 'planning' | 'planting' | 'monitoring' | 'completed'
│   │   ├── createdAt: timestamp
│   │   ├── updatedAt: timestamp
│   │   ├── baseline: { ndvi, soilMoisture, temperature, date }
│   │   ├── area: number
│   │   ├── landScore: number
│   │   ├── priority: string
│   │   ├── species: array
│   │   └── plantingDate: string
│   └── ...
├── plantingRecords/
│   ├── {recordId}/
│   │   ├── projectId: string
│   │   ├── speciesName: string
│   │   ├── scientificName: string
│   │   ├── quantity: number
│   │   ├── plantingDate: timestamp
│   │   ├── location: { lat, lon }
│   │   ├── plantedBy: string
│   │   └── notes: string
│   └── ...
├── monitoringRecords/
│   ├── {recordId}/
│   │   ├── projectId: string
│   │   ├── monitoringDate: timestamp
│   │   ├── survivalRate: number
│   │   ├── healthScore: number
│   │   ├── ndvi: number
│   │   ├── issues: array
│   │   ├── photos: array
│   │   └── notes: string
│   └── ...
├── predictions/
│   ├── {predictionId}/
│   │   ├── projectId: string
│   │   ├── predictionDate: timestamp
│   │   ├── predictedSurvivalRate: number
│   │   ├── riskFactors: array
│   │   ├── recommendations: array
│   │   └── confidence: number
│   └── ...
├── interventions/
│   ├── {interventionId}/
│   │   ├── projectId: string
│   │   ├── interventionDate: timestamp
│   │   ├── type: 'watering' | 'fertilization' | 'pest_control' | 'replanting' | 'other'
│   │   ├── description: string
│   │   ├── cost: number
│   │   └── status: 'planned' | 'in_progress' | 'completed'
│   └── ...
└── siteAnalyses/
    ├── {analysisId}/
    │   ├── projectId: string
    │   ├── analysisDate: timestamp
    │   ├── satellite: { ndvi, landCover, degradationLevel, priority }
    │   ├── soil: { ph, nitrogen, phosphorus, moisture, texture }
    │   ├── climate: { rainfall, temperature, seasonality }
    │   ├── suitabilityScore: number
    │   └── recommendedSpecies: array
    └── ...
```

### Data Relationships

**Project → PlantingRecords (1:N)**
- One project can have multiple planting records
- Linked via `projectId`

**Project → MonitoringRecords (1:N)**
- One project can have multiple monitoring records
- Linked via `projectId`

**Project → Interventions (1:N)**
- One project can have multiple interventions
- Linked via `projectId`

**Project → Predictions (1:N)**
- One project can have multiple predictions over time
- Linked via `projectId`

**Project → SiteAnalyses (1:N)**
- One project can have multiple site analyses
- Linked via `projectId`

### Firebase Configuration

**Anonymous Authentication:**
```typescript
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';
import { signInAnonymously, getAuth } from 'firebase/auth';

const firebaseConfig = {
  databaseURL: "https://habitat-platform-default-rtdb.firebaseio.com",
  // ... other config
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

export const authReady = signInAnonymously(auth).then(() => {
  console.log('Firebase auth ready');
});
```

**Real-time Subscriptions:**
```typescript
subscribeToProjects(callback: (projects: Project[]) => void): () => void {
  const projectsRef = ref(db, 'projects');
  
  authReady.then(() => {
    onValue(projectsRef, (snapshot) => {
      const projects = [];
      if (snapshot.exists()) {
        snapshot.forEach(child => projects.push({ id: child.key, ...child.val() }));
      }
      callback(projects.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    });
  });
  
  return () => off(projectsRef);
}
```

---

## API Documentation

### Base URL
```
http://localhost:3001/api
```

### Health Check
```
GET /health
→ { status: "healthy", timestamp: "...", uptime: 123.4 }
```

### Weather APIs

**Current Weather**
```
GET /api/weather/current?lat={lat}&lon={lon}&nocache={true|false}
→ {
  current: { temp, humidity, precipitation, windSpeed },
  location: { name, country },
  source: "OpenWeatherMap API" | "mock",
  cached: true|false,
  cacheInfo: "..."
}
```

**8-Day Forecast**
```
GET /api/weather/forecast?lat={lat}&lon={lon}
→ {
  forecast: [
    { date, temp, precipitation, humidity },
    ...
  ],
  timestamp: "...",
  cached: true|false
}
```

### Soil APIs

**Soil Data**
```
GET /api/soil/data?lat={lat}&lon={lon}
→ {
  ph: number,
  nitrogen: 'low'|'medium'|'high',
  phosphorus: 'low'|'medium'|'high',
  potassium: 'low'|'medium'|'high',
  moisture: number,
  organicCarbon: number,
  clayContent: number,
  sandContent: number,
  siltContent: number,
  texture: string,
  source: "OpenLandMap" | "SoilGrids" | "NASA POWER",
  confidence: number
}
```

### Satellite APIs

**Vegetation/NDVI**
```
GET /api/satellite/vegetation?lat={lat}&lon={lon}
→ {
  ndvi: number,
  evi: number,
  coverage: number,
  healthScore: number,
  changeRate: number,
  source: "Biome-calibrated estimate" | "Sentinel Hub",
  confidence: number
}
```

### Site Analysis APIs

**Comprehensive Site Analysis**
```
POST /api/site/analyze
Body: { lat, lng, name, hectares, projectGoals? }
→ {
  location: { lat, lng, name },
  landScore: number (0-100),
  priority: 'High'|'Medium'|'Low',
  componentScores: { soil, climate, vegetation },
  weather: { current, location, source, confidence },
  soil: { ph, nitrogen, phosphorus, moisture, ... },
  vegetation: { ndvi, healthScore, coverage, ... },
  recommendedSpecies: [
    {
      commonName, scientificName, family,
      survivalProbability, matchScore,
      reasoning, pros, cons, carePlan,
      expectedOutcomes, economicValue,
      characteristics: { growthRate, maturityYears, maxHeight, carbonSequestration }
    },
    ...
  ],
  metadata: {
    analysisDate,
    dataSources: { weather, soil, vegetation }
  },
  apiWorkflow: {
    weather: { tried, succeeded, failed, filledByChatbot },
    soil: { tried, succeeded, failed, filledByChatbot },
    vegetation: { tried, succeeded, failed, filledByChatbot },
    species: { source, count, aiSupplemented, databaseSpeciesCount }
  }
}
```

### Management APIs

**8-Day Risk Predictions**
```
GET /api/management/predictions?lat={lat}&lon={lon}&days=8
→ {
  location: { lat, lon },
  timestamp: "...",
  forecastPeriod: "8 days",
  model: "ml" | "rules",
  dataQuality: { weather, soil, vegetation },
  predictions: [
    {
      day: number,
      date: string,
      riskScore: number (0-100),
      riskLevel: 'HIGH'|'MEDIUM'|'LOW',
      primaryCause: 'Drought'|'Heat Stress'|'Water Scarcity'|'Vegetation Decline',
      breakdown: { drought, heatStress, waterScarcity, vegetationDecline },
      weather: { temp, precipitation, humidity },
      actions: string[],
      confidence: number
    },
    ...
  ],
  summary: {
    averageRisk: number,
    highestRisk: number,
    criticalDays: number,
    mediumDays: number,
    lowDays: number
  }
}
```

**Management Dashboard Data**
```
GET /api/management/dashboard?lat={lat}&lon={lon}
→ {
  location: { lat, lon },
  timestamp: "...",
  overallHealth: number (0-100),
  riskAssessment: {
    finalRiskScore, riskLevel, primaryCause,
    timeToImpact, recommendedActions, breakdown, confidence
  },
  vegetationHealth: { ndvi, ndviStatus, healthScore, coverage, trend, trendStatus },
  soilQuality: { score, qualityLevel, factors, ph, moisture, organicCarbon, nitrogen, texture },
  riskZones: [{ id, name, riskLevel, area, reason, action }],
  alerts: [{ id, severity, title, message, action, timestamp }],
  weather: { temperature, humidity, precipitation, windSpeed },
  rawData: { weather, soil, vegetation }
}
```

**Risk Zones**
```
GET /api/management/risk-zones?lat={lat}&lon={lon}&radius=1000
→ {
  location: { lat, lon },
  radius: number,
  zones: [
    { id, lat, lon, riskScore, riskLevel, area }
  ],
  summary: { high, medium, low }
}
```

**Scenario Simulation**
```
POST /api/management/simulate
Body: { lat, lon, scenario: { type, species?, treeAge?, plantingDensity? } }
→ {
  scenario: string,
  location: { lat, lon },
  riskAssessment: { finalRiskScore, riskLevel, primaryCause, ... },
  modifiedData: { weather, soil, vegetation },
  comparison: { message }
}
```

### Analytics APIs

**Carbon Analytics**
```
GET /api/analytics/carbon?lat={lat}&lon={lon}
→ {
  currentSequestration: number,
  projectedSequestration: number,
  ipccScenarios: {
    ssp126: { year2025, year2030, year2050, year2100 },
    ssp245: { year2025, year2030, year2050, year2100 },
    ssp585: { year2025, year2030, year2050, year2100 }
  }
}
```

### Alert APIs

**SMS Alert**
```
POST /api/alerts/sms
Body: { phone, message, severity }
→ { success: true|false, messageId?: string }
```

### Chatbot APIs

**AI Chat**
```
POST /api/chatbot/chat
Body: { message, context? }
→ {
  response: string,
  source: "Gemini" | "Groq",
  confidence: number
}
```

---

## Key Algorithms & Business Logic

### 1. Land Suitability Scoring Algorithm

**Formula:**
```
Overall Score = (Vegetation Score × 0.4) + (Soil Score × 0.3) + (Climate Score × 0.3)
```

**Soil Score Calculation (0-100):**
```javascript
function calculateSoilScore(soil) {
  let score = 0;
  
  // pH (25 points)
  if (soil.ph >= 6.0 && soil.ph <= 7.0) score += 25;
  else if (soil.ph >= 5.5 && soil.ph <= 7.5) score += 20;
  else if (soil.ph >= 5.0 && soil.ph <= 8.0) score += 15;
  else score += 10;
  
  // Nitrogen (25 points)
  const ns = { 'high': 25, 'medium': 18, 'low': 10 };
  score += ns[soil.nitrogen] || 15;
  
  // Phosphorus (20 points)
  score += (ns[soil.phosphorus] || 15) * 0.8;
  
  // Potassium (17.5 points)
  score += (ns[soil.potassium] || 15) * 0.7;
  
  // Organic Carbon (15 points)
  if (soil.organicCarbon >= 3) score += 15;
  else if (soil.organicCarbon >= 2) score += 12;
  else if (soil.organicCarbon >= 1) score += 8;
  else score += 5;
  
  // Moisture (10 points)
  if (soil.moisture >= 60 && soil.moisture <= 80) score += 10;
  else if (soil.moisture >= 50 && soil.moisture <= 90) score += 8;
  else score += 5;
  
  return Math.min(100, Math.max(0, score));
}
```

**Climate Score Calculation (0-100):**
```javascript
function calculateClimateScore(weather) {
  let score = 0;
  const { temp, humidity, precipitation, windSpeed } = weather.current;
  
  // Temperature (35 points)
  if (temp >= 22 && temp <= 30) score += 35;
  else if (temp >= 18 && temp <= 35) score += 25;
  else if (temp >= 15 && temp <= 40) score += 15;
  else score += 5;
  
  // Precipitation (35 points)
  if (precipitation >= 800 && precipitation <= 1500) score += 35;
  else if (precipitation >= 600 && precipitation <= 2000) score += 25;
  else if (precipitation >= 400 && precipitation <= 2500) score += 15;
  else score += 5;
  
  // Humidity (20 points)
  if (humidity >= 60 && humidity <= 80) score += 20;
  else if (humidity >= 50 && humidity <= 90) score += 15;
  else score += 10;
  
  // Wind Speed (10 points)
  if (windSpeed < 3) score += 10;
  else if (windSpeed < 6) score += 7;
  else score += 3;
  
  return Math.min(100, Math.max(0, score));
}
```

**Vegetation Score Calculation (0-100):**
```javascript
function calculateVegetationScore(vegetation) {
  let score = 0;
  const { ndvi, healthScore, coverage, changeRate } = vegetation;
  
  // NDVI (40 points)
  if (ndvi >= 0.6) score += 40;
  else if (ndvi >= 0.4) score += 30;
  else if (ndvi >= 0.2) score += 20;
  else score += 10;
  
  // Health Score (30 points)
  if (healthScore >= 70) score += 30;
  else if (healthScore >= 50) score += 20;
  else if (healthScore >= 30) score += 10;
  else score += 5;
  
  // Coverage (20 points)
  if (coverage >= 60) score += 20;
  else if (coverage >= 40) score += 15;
  else if (coverage >= 20) score += 10;
  else score += 5;
  
  // Change Rate (10 points)
  if (changeRate > 2) score += 10;
  else if (changeRate > 0) score += 7;
  else if (changeRate > -2) score += 3;
  
  return Math.min(100, Math.max(0, score));
}
```

### 2. Risk Analysis Engine (Rule-Based)

**Risk Score Calculation:**
```javascript
const weights = {
  drought: 0.35,
  heatStress: 0.25,
  waterScarcity: 0.25,
  vegetationDecline: 0.15
};

const finalScore = Math.round(
  droughtScore * weights.drought +
  heatStressScore * weights.heatStress +
  waterScarcityScore * weights.waterScarcity +
  vegetationDeclineScore * weights.vegetationDecline
);
```

**Drought Risk (0-100):**
```javascript
function calculateDroughtRisk(weather, soil) {
  let score = 0;
  
  // Rainfall deficit (0-40 points)
  const avgRainfall = weather.forecast
    ? weather.forecast.slice(0, 14).reduce((sum, day) => sum + (day.precipitation || 0), 0) / 14
    : weather.current?.precipitation || 2;
  
  if (avgRainfall < 1) score += 40;
  else if (avgRainfall < 2) score += 30;
  else if (avgRainfall < 3) score += 20;
  else if (avgRainfall < 5) score += 10;
  
  // Temperature stress (0-30 points)
  const avgTemp = weather.current?.temp || 25;
  if (avgTemp > 35) score += 30;
  else if (avgTemp > 32) score += 20;
  else if (avgTemp > 30) score += 10;
  
  // Soil moisture (0-30 points)
  const moisture = soil.moisture || 60;
  if (moisture < 30) score += 30;
  else if (moisture < 40) score += 20;
  else if (moisture < 50) score += 10;
  
  return Math.min(100, score);
}
```

**Heat Stress Risk (0-100):**
```javascript
function calculateHeatStressRisk(weather, species, treeAge) {
  let score = 0;
  
  const maxTemp = weather.forecast
    ? Math.max(...weather.forecast.slice(0, 7).map(d => d.temp || 25))
    : weather.current?.temp || 25;
  
  // Base temperature stress (0-50 points)
  if (maxTemp > 40) score += 50;
  else if (maxTemp > 38) score += 40;
  else if (maxTemp > 35) score += 30;
  else if (maxTemp > 33) score += 20;
  else if (maxTemp > 30) score += 10;
  
  // Age factor (0-25 points)
  if (treeAge < 1) score += 25;
  else if (treeAge < 2) score += 15;
  else if (treeAge < 3) score += 10;
  
  // Humidity factor (0-25 points)
  const humidity = weather.current?.humidity || 65;
  if (humidity < 30) score += 25;
  else if (humidity < 40) score += 15;
  else if (humidity < 50) score += 10;
  
  return Math.min(100, score);
}
```

**Risk Classification:**
```javascript
function classifyRisk(score) {
  if (score >= 70) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}
```

### 3. Species Recommendation Engine

**Compatibility Scoring:**
```javascript
function calculateSpeciesCompatibility(species, conditions) {
  let score = 0;
  const factors = [];
  
  // Temperature compatibility
  const tempMatch = conditions.temperature >= species.requirements.temperature.min &&
                   conditions.temperature <= species.requirements.temperature.max;
  if (tempMatch) {
    score += 25;
    factors.push({ name: 'Temperature', match: 'optimal' });
  }
  
  // Rainfall compatibility
  const rainMatch = conditions.rainfall >= species.requirements.rainfall.min &&
                   conditions.rainfall <= species.requirements.rainfall.max;
  if (rainMatch) {
    score += 25;
    factors.push({ name: 'Rainfall', match: 'optimal' });
  }
  
  // pH compatibility
  const phMatch = conditions.ph >= species.requirements.phRange.min &&
                 conditions.ph <= species.requirements.phRange.max;
  if (phMatch) {
    score += 20;
    factors.push({ name: 'Soil pH', match: 'optimal' });
  }
  
  // Soil type compatibility
  const soilMatch = conditions.soilType === species.requirements.soilType ||
                   species.requirements.soilType === 'all';
  if (soilMatch) {
    score += 15;
    factors.push({ name: 'Soil Type', match: 'compatible' });
  }
  
  // Drought tolerance bonus
  if (species.requirements.droughtTolerance === 'high' && conditions.rainfall < 800) {
    score += 15;
    factors.push({ name: 'Drought Tolerance', match: 'optimal' });
  }
  
  return { compatibility: score, factors };
}
```

**Priority Bonus Calculation:**
```javascript
function calculatePriorityBonus(species, conditions, projectGoals) {
  let bonus = 0;
  
  // Fast growth for degraded areas
  if (conditions.degradationLevel === 'severe' && 
      species.characteristics.growthRate === 'very_fast') {
    bonus += 15;
  }
  
  // Carbon sequestration priority
  if (projectGoals.carbonCredits && 
      species.characteristics.carbonSequestration > 12) {
    bonus += 8;
  }
  
  // Biodiversity priority
  if (projectGoals.biodiversity && 
      species.characteristics.ecologicalValue > 8) {
    bonus += 8;
  }
  
  // Nitrogen fixing for poor soils
  if (species.characteristics.nitrogenFixing && conditions.ph < 6.0) {
    bonus += 12;
  }
  
  return bonus;
}
```

**Final Score:**
```javascript
const finalScore = compatibility.compatibility + priorityBonus - riskPenalty;
```

### 4. Soil Texture Classification

**USDA Texture Triangle:**
```javascript
function determineSoilTexture(clay, sand, silt) {
  if (clay > 40) return 'Clay';
  if (sand > 70) return 'Sandy';
  if (silt > 50) return 'Silty';
  if (clay > 27 && sand > 20) return 'Clay Loam';
  if (sand > 52 && clay < 20) return 'Sandy Loam';
  return 'Loam';
}
```

### 5. NDVI Biome Calibration

**Location-Aware NDVI Estimation:**
```javascript
function fetchVegetationPhase1(lat, lon) {
  const seed = (Math.abs(lat * 1000) + Math.abs(lon * 1000)) % 100;
  const jitter = (seed % 15 - 7) / 100;
  const absLat = Math.abs(lat);
  let baseNdvi;
  
  // Biome-specific base values
  if (lat > -5 && lat < 10 && lon > 28 && lon < 42)          // East Africa
    baseNdvi = 0.62;
  else if (absLat < 8 && lon > 95 && lon < 141)               // SE Asia / Indonesia
    baseNdvi = 0.78;
  else if (lat > -15 && lat < 5 && lon > -75 && lon < -45)    // Amazon
    baseNdvi = 0.82;
  else if (lat > 8 && lat < 20 && lon > 68 && lon < 85)       // South India / W.Ghats
    baseNdvi = 0.58;
  else if ((lat > 20 && lat < 35 && lon > 60 && lon < 80) || 
           (lat > 15 && lat < 35 && lon > 35 && lon < 60))    // Arid
    baseNdvi = 0.18;
  else if (absLat < 10)                                        // Equatorial
    baseNdvi = 0.75;
  else if (absLat < 23.5)                                      // Tropical
    baseNdvi = 0.55;
  else                                                         // Temperate
    baseNdvi = 0.42;
  
  const ndvi = Math.max(0.05, Math.min(0.95, baseNdvi + jitter));
  
  return {
    ndvi: +ndvi.toFixed(3),
    evi: +(ndvi * 0.85).toFixed(3),
    coverage: Math.min(100, Math.round(ndvi * 110)),
    healthScore: Math.min(100, Math.round(ndvi * 105)),
    changeRate: +((seed % 10 - 3) / 10).toFixed(2),
    source: 'Biome-calibrated estimate',
    confidence: 80
  };
}
```

---

## Data Sources & Integrations

### 1. OpenWeatherMap API

**Purpose:** Current weather and 8-day forecast

**Endpoints Used:**
- `GET /data/2.5/weather` - Current weather
- `GET /data/2.5/forecast` - 5-day/3-hour forecast (extended to 8 days)

**Data Retrieved:**
```javascript
{
  current: {
    temp: number,           // Temperature in Celsius
    humidity: number,       // Relative humidity %
    precipitation: number,  // Rainfall in mm (last 1 hour)
    windSpeed: number       // Wind speed in m/s
  },
  location: {
    name: string,           // City name
    country: string        // Country code
  }
}
```

**Caching:** 30-minute TTL using node-cache

**Fallback:** Location-aware deterministic mock data

### 2. SoilGrids API (ISRIC)

**Purpose:** Global soil properties data

**Endpoint:**
```
GET https://rest.isric.org/soilgrids/v2.0/properties/query
```

**Parameters:**
```javascript
{
  lon: number,
  lat: number,
  property: ['phh2o', 'nitrogen', 'soc', 'clay', 'sand', 'silt'],
  depth: '0-5cm',
  value: 'mean'
}
```

**Data Retrieved:**
```javascript
{
  ph: number,              // Soil pH (divided by 10)
  nitrogen: number,        // Nitrogen content
  soc: number,            // Soil organic carbon (divided by 10)
  clay: number,           // Clay content %
  sand: number,           // Sand content %
  silt: number            // Calculated silt content %
}
```

**Fallback Chain:**
1. OpenLandMap (free, no key required)
2. SoilGrids API
3. NASA POWER (climate-derived soil estimates)

### 3. OpenLandMap API

**Purpose:** Alternative soil data source (free, no API key)

**Endpoint:**
```
GET https://api.openlandmap.org/query/point
```

**Parameters:**
```javascript
{
  lon: number,
  lat: number,
  layers: [
    'sol_ph.h2o_usda.4c1a2a_m_250m_b0..0cm_1950..2017_v0.2',
    'sol_sand.wfraction_usda.3a1a1a_m_250m_b0..0cm_1950..2017_v0.2',
    'sol_clay.wfraction_usda.3a1a1a_m_250m_b0..0cm_1950..2017_v0.2',
    'sol_organic.carbon_usda.6a1c_m_250m_b0..0cm_1950..2017_v0.2',
    'sol_nitrogen_usda.4h2_m_250m_b0..0cm_1950..2017_v0.2'
  ]
}
```

### 4. NASA POWER API

**Purpose:** Climate-derived soil estimates (fallback)

**Endpoint:**
```
GET https://power.larc.nasa.gov/api/temporal/climatology/point
```

**Parameters:**
```javascript
{
  parameters: 'T2M,PRECTOTCORR,RH2M',
  community: 'AG',
  longitude: number,
  latitude: number,
  format: 'JSON'
}
```

**Soil Derivation Formulas:**
```javascript
const ph = Math.max(4.5, Math.min(8.5, 7.2 - (annualRain / 3000) * 1.8));
const clay = Math.min(55, 15 + (annualRain / 1000) * 12 + (annualHumid / 100) * 8);
const sand = Math.max(15, 65 - clay * 0.8);
const soc = Math.min(40, 8 + (annualRain / 1000) * 6 - (annualTemp / 10) * 1.5);
const moisture = Math.min(85, 25 + clay * 0.45 + soc * 1.2);
```

### 5. Sentinel Hub API

**Purpose:** Real-time satellite imagery and NDVI (optional)

**Note:** Requires paid subscription, currently using biome-calibrated estimates as fallback

**Data Retrieved:**
```javascript
{
  ndvi: number,           // Normalized Difference Vegetation Index
  evi: number,           // Enhanced Vegetation Index
  landCover: string,     // Land cover classification
  degradationLevel: string,
  priority: 'high'|'medium'|'low'
}
```

### 6. Firebase Realtime Database

**Purpose:** Project data storage and real-time synchronization

**Features:**
- Anonymous authentication
- Real-time data synchronization via `onValue()`
- Server timestamps via `serverTimestamp()`
- Automatic offline support

**Collections:**
- `projects` - Project metadata
- `plantingRecords` - Planting data
- `monitoringRecords` - Monitoring data
- `predictions` - ML predictions
- `interventions` - Intervention tracking
- `siteAnalyses` - Site analysis results

### 7. Google Gemini API

**Purpose:** AI chatbot and intelligent fallback data generation

**Usage:**
- Chatbot responses for reforestation queries
- Fallback data generation when external APIs fail
- Species recommendation supplementation

### 8. Groq API

**Purpose:** Alternative AI provider (fallback to Gemini)

**Usage:**
- Chatbot responses
- AI data generation

### 9. Twilio API

**Purpose:** SMS alerts for critical risk notifications

**Usage:**
- Send SMS when risk level is HIGH
- Critical intervention reminders

---

## Security & Performance

### Security Measures

**1. Helmet.js**
- Sets security-related HTTP headers
- CSP (Content Security Policy)
- XSS Protection
- HSTS (HTTP Strict Transport Security)

**2. CORS Configuration**
```javascript
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
app.use(cors({
  origin: (origin, callback) => {
    // Allow Vercel domains automatically
    const isVercel = /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin);
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0.1)(:\d+)?$/.test(origin);
    
    if (isVercel || isLocalhost || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

**3. Rate Limiting**
```javascript
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);
```

**4. Trust Proxy**
```javascript
app.set('trust proxy', 1); // Required for Render.com, Heroku
```

**5. Environment Variables**
- API keys never hardcoded
- Loaded via dotenv at runtime
- Separate .env.example for documentation

### Performance Optimization

**1. Caching Strategy**
```javascript
const cache = new NodeCache({ stdTTL: 1800 }); // 30 minutes
```

**2. Parallel API Calls**
```javascript
const [weatherResult, soilResult, vegetationResult] = await Promise.all([
  fetchWeatherPhase1(lat, lon),
  fetchSoilPhase1(lat, lon),
  fetchVegetationPhase1(lat, lon)
]);
```

**3. Response Compression**
```javascript
app.use(compression());
```

**4. Firebase Real-time Subscriptions**
- Avoids polling
- Push-based updates
- Automatic connection management

**5. TanStack Query Caching**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});
```

**6. Code Splitting**
- React Router lazy loading
- Vite automatic chunking

---

## Deployment Strategy

### Frontend Deployment (Vercel)

**Configuration:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

**Environment Variables:**
- `VITE_API_URL` - Backend API URL
- `VITE_MAPBOX_TOKEN` - Mapbox access token
- `VITE_OPENWEATHER_API_KEY` - OpenWeatherMap API key
- `VITE_SENTINEL_INSTANCE_ID` - Sentinel Hub instance ID

**Process:**
1. Push code to GitHub
2. Import repository in Vercel
3. Set root directory to `frontend`
4. Configure environment variables
5. Deploy

### Backend Deployment (Render)

**Configuration:**
```yaml
# render.yaml
services:
  - type: web
    name: habitat-backend
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
```

**Environment Variables:**
- `NODE_ENV` - production
- `OPENWEATHER_API_KEY` - Weather API key
- `ALLOWED_ORIGINS` - Frontend URL (e.g., https://habitat.vercel.app)
- `ML_SERVICE_URL` - ML service URL (if deployed separately)
- `GEMINI_API_KEY` - Google Gemini API key
- `GROQ_API_KEY` - Groq API key
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `TWILIO_PHONE_NUMBER` - Twilio phone number

**Process:**
1. Push code to GitHub
2. Import repository in Render
3. Set root directory to `backend`
4. Configure environment variables
5. Deploy

**Note:** Render free tier sleeps after 15 min inactivity. Frontend handles this with mock data fallbacks.

### ML Service Deployment (Optional)

**Options:**
1. Render (separate service)
2. Railway
3. AWS EC2
4. Google Cloud Run

**Configuration:**
```yaml
# render.yaml for ML service
services:
  - type: web
    name: habitat-ml
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: python ml/ml_server.py
    envVars:
      - key: ML_PORT
        value: 5001
```

**requirements.txt:**
```
flask
scikit-learn
numpy
pandas
```

### Firebase Configuration

**Database Rules:**
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

**Note:** Currently using open rules for demo. Production should implement proper authentication rules.

---

## Technical Challenges & Solutions

### Challenge 1: API Reliability

**Problem:** External APIs (OpenWeatherMap, SoilGrids) can be unreliable or require paid subscriptions.

**Solution:**
- Multi-tier fallback chain (OpenLandMap → SoilGrids → NASA POWER)
- AI-powered fallback using Gemini/Groq with cross-API context
- Location-aware deterministic mock data for consistent demos
- 30-minute caching to reduce API calls

### Challenge 2: Real-time Data Synchronization

**Problem:** Multiple users need to see updates across different dashboards.

**Solution:**
- Firebase Realtime Database with `onValue()` subscriptions
- Automatic push-based updates
- TanStack Query for client-side caching
- Optimistic UI updates

### Challenge 3: ML Service Availability

**Problem:** Python ML service may be offline or slow to respond.

**Solution:**
- ML-first architecture with rule-based fallback
- 4-second timeout for ML service calls
- Rule engine (`riskAnalysisEngine.js`) implements same logic as ML
- Transparent fallback (users see model used in response)

### Challenge 4: Species Recommendation Accuracy

**Problem:** Limited species database vs. real-world biodiversity.

**Solution:**
- Curated database of 20 Indian native tree species
- Multi-factor compatibility scoring (temperature, rainfall, pH, soil type)
- AI supplementation when < 3 species returned
- AI constrained to known species database (no hallucinations)

### Challenge 5: Cross-Origin Resource Sharing

**Problem:** Frontend (Vercel) and backend (Render) on different domains.

**Solution:**
- Dynamic CORS configuration
- Automatic Vercel domain allowance via regex
- Configurable ALLOWED_ORIGINS environment variable
- Credentials support for cookies/auth

### Challenge 6: Rate Limiting and Cost Management

**Problem:** External APIs have rate limits and costs.

**Solution:**
- 30-minute response caching using node-cache
- Rate limiting on backend (100 requests per 15 minutes)
- Cache bypass option via `nocache` query parameter
- Mock data fallback to avoid API costs during development

### Challenge 7: Mobile Responsiveness

**Problem:** Complex dashboards need to work on mobile devices.

**Solution:**
- Tailwind CSS responsive utilities
- shadcn/ui responsive components
- Collapsible sidebar
- Touch-friendly map interactions

### Challenge 8: Data Visualization Performance

**Problem:** Large datasets can slow down chart rendering.

**Solution:**
- Recharts for efficient SVG rendering
- Data aggregation (6-month history instead of full history)
- Lazy loading of chart components
- Memoization of chart data

---

## Key Technical Terms

### Frontend Terms

- **React 18** - UI library with concurrent features
- **TypeScript** - Typed superset of JavaScript
- **Vite** - Next-generation build tool with fast HMR
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Accessible component library built on Radix UI
- **Framer Motion** - Animation library for React
- **Mapbox GL JS** - Interactive map library
- **Recharts** - Charting library for React
- **TanStack Query** - Data fetching and caching library
- **React Router v6** - Client-side routing
- **Firebase SDK** - Google's backend-as-a-service platform

### Backend Terms

- **Node.js** - JavaScript runtime for server-side code
- **Express** - Minimal web framework for Node.js
- **Helmet** - Security header middleware
- **CORS** - Cross-Origin Resource Sharing
- **Rate Limiting** - API request throttling
- **Axios** - HTTP client for Node.js
- **node-cache** - In-memory caching
- **Twilio** - SMS API service

### ML Terms

- **Gradient Boosting** - Ensemble ML algorithm
- **scikit-learn** - Machine learning library for Python
- **Flask** - Micro web framework for Python
- **Feature Engineering** - Creating input features from raw data
- **Model Serialization** - Saving trained models (pickle)
- **Synthetic Data** - Artificially generated training data
- **Feature Importance** - Contribution of each feature to predictions
- **Cross-Validation** - Model evaluation technique

### Data Science Terms

- **NDVI** - Normalized Difference Vegetation Index (vegetation health)
- **EVI** - Enhanced Vegetation Index
- **Soil pH** - Acidity/alkalinity of soil
- **Organic Carbon** - Carbon content in soil
- **Texture Classification** - Soil composition (clay, sand, silt)
- **Biome Calibration** - Adjusting estimates based on ecological regions

### Database Terms

- **Firebase Realtime Database** - NoSQL cloud database
- **Real-time Synchronization** - Automatic data updates
- **Anonymous Authentication** - Userless authentication
- **Server Timestamp** - Server-generated timestamps
- **onValue()** - Firebase real-time listener

### Architecture Terms

- **Microservices** - Separate services for different functions
- **REST API** - Representational State Transfer API
- **Graceful Degradation** - Fallback when features fail
- **Audit Trail** - Record of data sources and transformations
- **Multi-tier Fallback** - Chain of fallback options
- **Cross-API Context** - Using data from one API to inform another

### Environmental Terms

- **Reforestation** - Restoring forests on deforested land
- **Carbon Sequestration** - Capturing and storing atmospheric CO2
- **NDVI** - Vegetation health index (-1 to 1)
- **IPCC Scenarios** - Climate change projection scenarios (SSP1-2.6, SSP2-4.5, SSP5-8.5)
- **Carbon Credits** - Tradable certificates for carbon reduction
- **Verra VCS** - Verified Carbon Standard certification
- **Gold Standard** - Carbon credit certification standard
- **CCB Standards** - Climate, Community & Biodiversity standards

---

## Summary

Habitat is a comprehensive full-stack reforestation management platform that integrates:

- **Frontend:** React + TypeScript + Vite with modern UI components
- **Backend:** Node.js + Express with multi-tier API integration
- **ML Service:** Python + Flask + scikit-learn for risk prediction
- **Database:** Firebase Realtime Database for project data
- **External APIs:** OpenWeatherMap, SoilGrids, NASA POWER, Sentinel Hub
- **AI Integration:** Google Gemini and Groq for intelligent fallbacks
- **Maps:** Mapbox GL JS for interactive satellite maps
- **Charts:** Recharts for data visualization

The platform follows a complete workflow from site selection through monitoring, prediction, intervention, and reporting, with robust fallback mechanisms to ensure reliability even when external services are unavailable.

---

**Document Version:** 1.0  
**Last Updated:** July 2026  
**Project:** Habitat - Adaptive Reforestation Management Platform  
**Author:** Technical Documentation
