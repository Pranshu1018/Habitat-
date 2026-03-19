# � Habitat — Adaptive Reforestation Management Platfrorm

> An end-to-end intelligent platform that guides reforestation projects from site selection through decades of adaptive forest management — powered by real-time satellite data, ML risk prediction, and AI-driven decision support.

[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61dafb?logo=react)](https://react.dev)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?logo=node.js)](https://nodejs.org)
[![ML](https://img.shields.io/badge/ML-Python%20%2B%20Scikit--learn-f7931e?logo=python)](https://scikit-learn.org)
[![Database](https://img.shields.io/badge/Database-Firebase%20Realtime%20DB-ffca28?logo=firebase)](https://firebase.google.com)
[![Maps](https://img.shields.io/badge/Maps-Mapbox%20GL-000000?logo=mapbox)](https://mapbox.com)

---

## � Table of Contents

- [What is Habitat?](#-what-is-habitat)
- [The Problem We Solve](#-the-problem-we-solve)
- [Live Demo](#-live-demo)
- [Full Workflow](#-full-workflow)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [ML Model](#-ml-model)
- [Data Sources](#-data-sources)
- [Deployment](#-deployment)
- [Screenshots](#-screenshots)

---

## 🌍 What is Habitat?

Habitat is a full-stack reforestation intelligence platform that manages the **complete lifecycle** of a forest restoration project:

```
Plan → Plant → Monitor → Predict → Intervene → Report
```

Most reforestation efforts fail because planting is treated as a one-time event. Habitat treats it as a continuous, data-driven process — using satellite imagery, weather forecasts, soil science, and machine learning to keep forests alive and thriving long after the saplings go in the ground.

---

## 🔥 The Problem We Solve

- **60–70% of planted saplings die within the first year** due to poor site selection, wrong species choice, and lack of follow-up care
- Field workers have no early warning system for drought, pest outbreaks, or heat stress
- Carbon credit certification is complex and poorly understood
- There's no unified tool connecting site analysis → planting → monitoring → intervention → reporting

Habitat solves all of this in one platform.

---

## 🚀 Live Demo

| Service | URL |
|---------|-----|
| Frontend | _Deploy to Vercel (see [Deployment](#-deployment))_ |
| Backend API | _Deploy to Render (see [Deployment](#-deployment))_ |

---

## 🔄 Full Workflow

Here's exactly how a user moves through the platform from day one:

### Step 1 — Landing Page (`/`)
The entry point. Shows global reforestation stats, a before/after forest slider, and feature highlights. Click **"Start Analysis"** to begin.

### Step 2 — Planning Dashboard (`/planning`)
**Where & what to plant.**

1. Click anywhere on the satellite map to drop a pin
2. Or pick a quick location (Western Ghats, Aravalli, Sundarbans, etc.)
3. Set the project area in hectares
4. Click **Analyze Site** — the system fetches:
   - Live weather data (OpenWeatherMap)
   - Soil properties (SoilGrids — pH, nitrogen, phosphorus, potassium, moisture)
   - Vegetation index / NDVI (Sentinel Hub satellite)
5. Get back a **Land Suitability Score (0–100)**, priority rating, and top species recommendations
6. Optionally run the **Environmental Simulation** panel — drag sliders for drought, heatwave, waterlogging, frost, and strong winds to see how conditions affect species survival
7. Click **Save Project** → stored in Firebase Realtime Database

### Step 3 — Planting Dashboard (`/planting`)
**What did we plant.**

1. Select your saved project
2. Set the planting date
3. Add planting zones (Zone A, Zone B, etc.) with species and quantities
4. Add field notes
5. Save the planting record → updates project status to `monitoring`

### Step 4 — Monitoring Dashboard (`/monitoring`)
**Is the forest healthy?**

1. Select a project — live data is fetched from satellite + soil APIs
2. See current **NDVI** (vegetation health index), **soil health score**, **survival rate**, and **trend** (up/stable/down)
3. View a 6-month NDVI and survival rate history chart
4. Soil metrics: pH, moisture, nitrogen, phosphorus, potassium
5. Climate metrics: temperature, humidity, precipitation
6. Hit **Refresh** to pull the latest satellite data

### Step 5 — Prediction Dashboard (`/prediction`)
**What will go wrong?**

1. Select a project
2. The system calls the **ML microservice** (Python/Flask + Gradient Boosting model) for an **8-day risk forecast**
3. Each day shows: risk score (0–100), risk level (HIGH/MEDIUM/LOW), primary cause, weather breakdown, and recommended actions
4. Run **scenario simulations**: Drought (30 days no rain), Heatwave (45°C for 7 days), Pest Outbreak (locust swarm), Storm (Category 3 cyclone)
5. HIGH risk days automatically push a **notification alert** to the bell icon in the top bar
6. Falls back to rule-based engine if ML service is offline

### Step 6 — Intervention Dashboard (`/intervention`)
**What should we do?**

1. Select a project
2. View a **Kanban board** with three columns: Planned → In Progress → Completed
3. Create interventions: Watering, Fertilization, Pest Control, Replanting, Other
4. Set description, cost, and date
5. Drag cards between columns (or use the arrow button) to update status
6. Track completion rate and total cost

### Step 7 — Reporting Dashboard (`/reporting`)
**What impact have we created?**

1. Live KPIs: trees planted, hectares restored, CO₂ sequestered, survival rate, economic value, farmers benefited
2. **Carbon Sequestration Timeline** — actual vs target chart (2021–2026)
3. **20-Year IPCC Carbon Projection** — interactive chart showing cumulative CO₂ under three IPCC AR6 scenarios:
   - SSP1-2.6 (Optimistic — low emissions)
   - SSP2-4.5 (Baseline — intermediate)
   - SSP5-8.5 (Pessimistic — high emissions)
4. **Carbon Credit Certification Workflow** — step-by-step checklist for:
   - Verra VCS (Verified Carbon Standard)
   - Gold Standard
   - CCB Standards (Climate, Community & Biodiversity)
5. SDG alignment progress (SDG 13, 15, 1, 8)
6. Species mix donut chart, survival trend, monthly planting activity
7. **Export Report** — downloads a full HTML impact report (printable as PDF)

### Notification Center (all pages)
The 🔔 bell icon in the top bar shows real-time alerts:
- HIGH risk predictions from the ML model
- Survival rate drops below threshold
- Carbon milestones reached
- Overdue interventions
- Click to mark read, mark all read, or clear all

### Land Health Analytics (`/land-health`)
Deep-dive analytics for a selected region:
- Ecological composition breakdown
- Carbon sequestration card with timeline
- Social impact metrics (farmers, jobs, communities)
- Health timeline

### Global Dashboard (`/dashboard`)
Bird's-eye view across all monitored regions worldwide — interactive map with region cards, analytics strip, and region detail panel.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🗺️ Interactive satellite map | Mapbox GL with satellite-streets style, click-to-pin site selection |
| 🌱 AI species matching | Recommends native species based on soil, climate, and NDVI |
| 🤖 ML risk prediction | Gradient Boosting model trained on 8,000 samples, 11 features |
| 📡 Real-time satellite data | NDVI from Sentinel Hub, fallback to NASA POWER |
| 🌦️ Weather integration | 8-day forecast from OpenWeatherMap |
| 🪨 Soil intelligence | pH, N/P/K, moisture from SoilGrids API |
| 📊 Carbon projection | 20-year IPCC AR6 scenario modeling |
| 🏆 Certification workflow | Verra VCS, Gold Standard, CCB step-by-step checklist |
| 🔔 Alert notifications | In-app notification center with severity levels |
| 📋 Kanban interventions | Drag-and-drop intervention tracking |
| 📄 PDF report export | Full impact report with KPIs, charts, SDG alignment |
| 🌙 Dark/light theme | Full theme support across all pages |
| 🔥 Firebase real-time sync | All projects and records sync live across sessions |
| 💬 AI Chatbot | Gemini/Groq powered assistant for reforestation queries |
| 📱 SMS alerts | Twilio integration for critical risk notifications |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 18 + TypeScript | UI framework |
| Vite | Build tool |
| Tailwind CSS + shadcn/ui | Styling and components |
| Framer Motion | Animations |
| Mapbox GL JS | Interactive maps |
| Recharts | Data visualization |
| Firebase SDK | Realtime database + auth |
| TanStack Query | Data fetching and caching |
| React Router v6 | Client-side routing |

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js + Express | API server |
| Helmet + CORS | Security |
| express-rate-limit | Rate limiting |
| Axios | External API calls |
| node-cache | Response caching |
| Twilio | SMS alerts |
| Google Gemini / Groq | AI chatbot |

### ML Service
| Technology | Purpose |
|-----------|---------|
| Python 3.11 | Runtime |
| Flask | HTTP microservice |
| scikit-learn | Gradient Boosting model |
| NumPy + Pandas | Data processing |
| pickle | Model serialization |

---

## 📁 Project Structure

```
habitat/
├── frontend/                    # React + TypeScript app
│   ├── src/
│   │   ├── pages/               # Route-level page components
│   │   │   ├── Landing.tsx      # Home / marketing page
│   │   │   ├── PlanningDashboard.tsx
│   │   │   ├── PlantingDashboard.tsx
│   │   │   ├── MonitoringDashboard.tsx
│   │   │   ├── PredictionDashboard.tsx
│   │   │   ├── InterventionDashboard.tsx
│   │   │   ├── ReportingDashboard.tsx
│   │   │   └── LandHealthAnalytics.tsx
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   └── DashboardLayout.tsx  # Sidebar + topbar shell
│   │   │   ├── analytics/
│   │   │   │   ├── CarbonProjectionChart.tsx  # 20-yr IPCC chart
│   │   │   │   ├── CarbonCertification.tsx    # VCS/GS/CCB workflow
│   │   │   │   ├── CarbonSequestrationCard.tsx
│   │   │   │   ├── EcologicalCompositionCard.tsx
│   │   │   │   └── SocialImpactCard.tsx
│   │   │   ├── region/
│   │   │   │   ├── RegionDetailPanel.tsx
│   │   │   │   ├── RiskAlerts.tsx
│   │   │   │   ├── HealthAnalytics.tsx
│   │   │   │   └── SpeciesRecommendations.tsx
│   │   │   ├── NotificationCenter.tsx   # Bell icon + alert panel
│   │   │   ├── MapView.tsx
│   │   │   ├── Chatbot.tsx
│   │   │   └── Header.tsx
│   │   ├── stores/
│   │   │   └── notificationStore.ts     # Global alert pub/sub store
│   │   ├── services/
│   │   │   ├── database/
│   │   │   │   └── projectService.ts    # Firebase CRUD + subscriptions
│   │   │   └── api/                     # Backend API service wrappers
│   │   ├── data/
│   │   │   └── mockData.ts              # 8 real-world region datasets
│   │   ├── config/
│   │   │   └── firebase.ts              # Firebase init + anonymous auth
│   │   └── context/
│   │       └── ThemeContext.tsx
│   ├── vercel.json                      # Vercel SPA routing config
│   └── .env.example
│
├── backend/                     # Node.js + Express API
│   ├── src/
│   │   ├── routes/
│   │   │   ├── weather.js       # OpenWeatherMap integration
│   │   │   ├── soil.js          # SoilGrids API
│   │   │   ├── satellite.js     # Sentinel Hub / NDVI
│   │   │   ├── management.js    # ML predictions + risk zones
│   │   │   ├── site.js          # Comprehensive site analysis
│   │   │   ├── analytics.js     # Carbon + species analytics
│   │   │   ├── alerts.js        # Twilio SMS alerts
│   │   │   ├── chatbot.js       # Gemini/Groq AI chat
│   │   │   └── enterprise.js    # Multi-project workflows
│   │   ├── services/
│   │   │   ├── riskAnalysisEngine.js    # Rule-based risk scoring
│   │   │   ├── geminiService.js
│   │   │   ├── groqService.js
│   │   │   └── twilioService.js
│   │   └── server.js            # Express app entry point
│   ├── ml/
│   │   ├── forest_risk_model.py # Model training + prediction logic
│   │   ├── ml_server.py         # Flask microservice (port 5001)
│   │   └── risk_model.pkl       # Pre-trained model (auto-generated)
│   ├── render.yaml              # Render deployment config
│   └── .env.example
│
└── README.md
```

---

## 🏁 Getting Started

### Prerequisites

- **Node.js 18+** — [download](https://nodejs.org)
- **Python 3.9+** — [download](https://python.org) _(only needed for ML service)_
- **Git**

### 1. Clone the repo

```bash
git clone https://github.com/Pranshu1018/Habitat-Reforestation-platform.git
cd Habitat-Reforestation-platform
```

### 2. Set up the Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env and add your API keys (see Environment Variables below)
npm run dev
# Backend runs on http://localhost:3001
```

### 3. Set up the ML Service (optional but recommended)

```bash
cd backend/ml
pip install flask scikit-learn numpy pandas
python ml_server.py
# ML service runs on http://localhost:5001
# Model trains automatically on first run (~10 seconds)
```

### 4. Set up the Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env — at minimum set VITE_API_URL
npm run dev
# Frontend runs on http://localhost:5173
```

### 5. Open the app

Navigate to **http://localhost:5173** and you'll land on the Habitat home page.

> **No API keys?** The app works fully with mock/demo data. Firebase is pre-configured for anonymous access. You only need API keys for live satellite and weather data.

---

## 🔑 Environment Variables

### Frontend (`frontend/.env`)

```env
# Backend API URL
VITE_API_URL=http://localhost:3001/api

# Mapbox token — get one free at https://account.mapbox.com
VITE_MAPBOX_TOKEN=your_mapbox_token_here

# OpenWeatherMap — free tier at https://openweathermap.org/api
VITE_OPENWEATHER_API_KEY=your_key_here

# Sentinel Hub — optional, for real satellite imagery
VITE_SENTINEL_INSTANCE_ID=your_instance_id_here
```

### Backend (`backend/.env`)

```env
PORT=3001
NODE_ENV=development

# Required for weather data
OPENWEATHER_API_KEY=your_key_here

# CORS — comma-separated list of allowed frontend origins
ALLOWED_ORIGINS=http://localhost:5173

# Optional — Sentinel Hub satellite imagery
SENTINEL_CLIENT_ID=your_client_id
SENTINEL_CLIENT_SECRET=your_client_secret

# Optional — SMS alerts
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890

# Optional — AI chatbot (uses Gemini by default, falls back to Groq)
GEMINI_API_KEY=your_key
GROQ_API_KEY=your_key

# ML microservice URL
ML_SERVICE_URL=http://localhost:5001

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 📡 API Reference

Base URL: `http://localhost:3001/api`

### Health
```
GET /health
→ { status: "healthy", uptime: 123.4 }
```

### Weather
```
GET /api/weather/current?lat={lat}&lon={lon}
GET /api/weather/forecast?lat={lat}&lon={lon}
```

### Soil
```
GET /api/soil/data?lat={lat}&lon={lon}
→ { ph, nitrogen, phosphorus, potassium, moisture, texture }
```

### Satellite / Vegetation
```
GET /api/satellite/vegetation?lat={lat}&lon={lon}
→ { ndvi, landCover, changeRate, degradationLevel }
```

### Site Analysis
```
POST /api/site/analyze
Body: { lat, lng, name, hectares }
→ { landScore, priority, componentScores, weather, soil, vegetation, recommendedSpecies }
```

### Risk Predictions (ML)
```
GET /api/management/predictions?lat={lat}&lon={lon}&days=8
→ { predictions: [{ day, date, riskScore, riskLevel, primaryCause, weather, breakdown, actions }], model: "ml"|"rules" }
```

### Scenario Simulation
```
POST /api/management/simulate
Body: { lat, lon, scenario: "drought"|"heatwave"|"flood"|"pest" }
```

### Chatbot
```
POST /api/chatbot/chat
Body: { message, context? }
→ { response }
```

---

## 🤖 ML Model

The risk prediction model lives in `backend/ml/`.

**Algorithm:** Gradient Boosting Regressor (scikit-learn)
- 150 estimators, max depth 4
- Trained on 8,000 synthetic samples based on Indian climate zones

**Input features (11):**

| Feature | Description |
|---------|-------------|
| `temp_max` | Max forecast temperature (°C) |
| `temp_avg` | Average temperature (°C) |
| `precip_7d` | Total precipitation last 7 days (mm) |
| `precip_14d` | Total precipitation last 14 days (mm) |
| `humidity` | Relative humidity (%) |
| `soil_moisture` | Soil moisture (%) |
| `soil_ph` | Soil pH |
| `ndvi` | Vegetation index (0–1) |
| `ndvi_trend` | NDVI change rate per period |
| `tree_age` | Age of plantation (years) |
| `day_of_year` | Seasonal factor (1–365) |

**Output:** Risk score (0–100) → classified as HIGH (≥65) / MEDIUM (40–64) / LOW (<40)

**Risk components:**
- Drought stress (35% weight)
- Heat stress (25% weight)
- Water scarcity (25% weight)
- Vegetation decline (15% weight)

**Fallback:** If the Flask ML service is offline, the backend automatically falls back to `riskAnalysisEngine.js` — a rule-based scoring engine with the same logic.

The model auto-trains on first startup if `risk_model.pkl` is not found.

---

## 🌐 Data Sources

| Source | Data | Key Required |
|--------|------|-------------|
| [OpenWeatherMap](https://openweathermap.org/api) | Current weather, 8-day forecast | Yes (free tier) |
| [SoilGrids](https://www.isric.org/explore/soilgrids) | Soil pH, N/P/K, moisture, texture | No |
| [NASA POWER](https://power.larc.nasa.gov) | Historical climate, solar radiation | No |
| [Sentinel Hub](https://www.sentinel-hub.com) | Satellite NDVI, land cover | Yes (free with registration) |
| [Global Forest Watch](https://www.globalforestwatch.org) | Deforestation alerts | Yes |
| [Firebase](https://firebase.google.com) | Project data, real-time sync | Pre-configured |

All routes have graceful fallbacks to scientifically-grounded mock data when APIs are unavailable.

---

## 🚀 Deployment

### Frontend → Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import repo
3. Set **Root Directory** to `frontend`
4. Framework: `Vite` (auto-detected)
5. Add environment variables:
   - `VITE_API_URL` → your Render backend URL
   - `VITE_MAPBOX_TOKEN`
   - `VITE_OPENWEATHER_API_KEY`
6. Deploy

### Backend → Render

1. Go to [render.com](https://render.com) → New Web Service → Import repo
2. Set **Root Directory** to `backend`
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables:
   - `NODE_ENV` → `production`
   - `OPENWEATHER_API_KEY`
   - `ALLOWED_ORIGINS` → your Vercel URL (e.g. `https://habitat.vercel.app`)
6. Deploy

> **Note:** Render's free tier sleeps after 15 min of inactivity. The first request after idle takes ~30s. The frontend handles this gracefully with mock data fallbacks.

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

Built for the social cause of global reforestation and ecosystem restoration. MIT License.

---

<div align="center">
  <p>Made with 🌱 for the planet</p>
  <p>
    <a href="https://openweathermap.org/api">OpenWeatherMap</a> ·
    <a href="https://www.isric.org/explore/soilgrids">SoilGrids</a> ·
    <a href="https://www.sentinel-hub.com">Sentinel Hub</a> ·
    <a href="https://www.globalforestwatch.org">Global Forest Watch</a>
  </p>
</div>
