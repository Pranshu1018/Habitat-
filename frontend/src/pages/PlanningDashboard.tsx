import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Loader2, Save, Zap, CloudRain,
  Flame, Droplets, Wind, AlertTriangle, Shield, RotateCcw, ChevronDown, ChevronUp
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { siteAPI } from '@/services/api';
import { projectService } from '@/services/database/projectService';
import { toast } from 'sonner';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

interface Location { lat: number; lng: number; name: string; }
interface AnalysisResult {
  location: Location; landScore: number; priority: string;
  soil: any; weather: any; vegetation: any; recommendedSpecies: any[];
}
interface SimConds { drought: number; heatWave: number; waterlogging: number; frost: number; strongWinds: number; }

const conditionMeta = {
  drought:      { name: 'Drought',       icon: Flame,      color: '#f97316', bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.25)' },
  heatWave:     { name: 'Heat Wave',     icon: Flame,      color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)' },
  waterlogging: { name: 'Waterlogging',  icon: Droplets,   color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)' },
  frost:        { name: 'Frost',         icon: CloudRain,  color: '#06b6d4', bg: 'rgba(6,182,212,0.1)',   border: 'rgba(6,182,212,0.25)' },
  strongWinds:  { name: 'Strong Winds',  icon: Wind,       color: '#a855f7', bg: 'rgba(168,85,247,0.1)',  border: 'rgba(168,85,247,0.25)' },
} as const;

const QUICK_LOCS = [
  { name: 'Western Ghats, Karnataka',       lat: 14.0, lng: 75.5 },
  { name: 'Aravalli Range, Rajasthan',      lat: 25.5, lng: 73.0 },
  { name: 'Eastern Ghats, Andhra Pradesh',  lat: 17.0, lng: 82.0 },
  { name: 'Sundarbans, West Bengal',        lat: 21.9, lng: 89.0 },
];

// ── Reusable card shell ──────────────────────────────────────────────────────
const Panel = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl border ${className}`}
    style={{ background: 'var(--surface-1)', borderColor: 'var(--glass-border)' }}>
    {children}
  </div>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{children}</p>
);

const PlanningDashboard = () => {
  const navigate = useNavigate();
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [projectName, setProjectName] = useState('');
  const [area, setArea] = useState(100);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [simOpen, setSimOpen] = useState(false);
  const [simConds, setSimConds] = useState<SimConds>({ drought: 0, heatWave: 0, waterlogging: 0, frost: 0, strongWinds: 0 });
  const [alerts, setAlerts] = useState<{ key: string; name: string; severity: string; color: string; bg: string; border: string; actions: string[] }[]>([]);

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: 'planning-map',
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [78.9629, 20.5937],
      zoom: 4,
    });
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.on('click', e => placePin(e.lngLat.lat, e.lngLat.lng, map));
    mapRef.current = map;
    return () => map.remove();
  }, []);

  const placePin = (lat: number, lng: number, map?: mapboxgl.Map) => {
    const m = map || mapRef.current;
    const loc: Location = { lat, lng, name: `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E` };
    setSelectedLocation(loc);
    setResult(null);
    if (markerRef.current) { markerRef.current.setLngLat([lng, lat]); }
    else if (m) {
      markerRef.current = new mapboxgl.Marker({ color: '#10b981' }).setLngLat([lng, lat]).addTo(m);
    }
    m?.flyTo({ center: [lng, lat], zoom: 11 });
  };

  const handleAnalyze = async () => {
    if (!selectedLocation) { toast.error('Select a location first'); return; }
    setAnalyzing(true);
    try {
      const raw = await siteAPI.analyzeCompleteSite({ lat: selectedLocation.lat, lng: selectedLocation.lng, name: selectedLocation.name, hectares: area });
      setResult((raw as any)?.data ?? raw);
      toast.success('Analysis complete');
    } catch { toast.error('Analysis failed — using demo data'); setResult(demoResult(selectedLocation)); }
    finally { setAnalyzing(false); }
  };

  const applySimulation = () => {
    const active = (Object.keys(simConds) as (keyof SimConds)[]).filter(k => simConds[k] > 0);
    if (!active.length) { toast.warning('Adjust sliders first'); return; }
    const newAlerts = active.map(k => {
      const v = simConds[k]; const m = conditionMeta[k];
      const sev = v >= 75 ? 'High' : v >= 40 ? 'Medium' : 'Low';
      return { key: k, name: m.name, severity: sev, color: m.color, bg: m.bg, border: m.border,
        actions: v >= 75 ? ['Emergency action required', 'Halt planting activities', 'Protect existing saplings']
                : v >= 40 ? ['Start supplemental measures', 'Increase monitoring frequency', 'Apply preventive treatment']
                : ['Monitor daily', 'Prepare contingency equipment', 'Review species selection'] };
    });
    setAlerts(newAlerts);
    if (result) {
      const impact = active.reduce((s, k) => s + (simConds[k] / 100) * 12, 0);
      setResult({ ...result, landScore: Math.max(0, Math.round(result.landScore - impact)),
        recommendedSpecies: result.recommendedSpecies.map(sp => ({ ...sp, survivalProbability: Math.max(0, Math.round(sp.survivalProbability - impact)) })) });
    }
    toast.error(`⚠ ${newAlerts.length} environmental alert${newAlerts.length > 1 ? 's' : ''} generated`);
  };

  const resetSim = () => {
    setSimConds({ drought: 0, heatWave: 0, waterlogging: 0, frost: 0, strongWinds: 0 });
    setAlerts([]);
    toast.info('Simulation reset');
  };

  const handleSave = async () => {
    if (!result || !projectName.trim()) { toast.error('Enter a project name first'); return; }
    setSaving(true);
    try {
      await projectService.createProject({
        name: projectName, status: 'planning',
        location: { lat: result.location.lat, lon: result.location.lng, name: result.location.name, region: 'India' },
      });
      toast.success('Project saved!');
      setTimeout(() => navigate('/planting'), 1200);
    } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  };

  const scoreColor = (s: number) => s >= 70 ? '#10b981' : s >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <DashboardLayout currentProject={projectName || 'New Project'}>
      <div className="h-full flex overflow-hidden">

        {/* ── MAP ─────────────────────────────────────────────────────────── */}
        <div className="flex-1 relative">
          <div id="planning-map" className="w-full h-full" />

          {/* Quick locations */}
          <div className="absolute top-4 left-4 rounded-2xl p-4 w-64 space-y-2"
            style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(16px)', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Select</p>
            {QUICK_LOCS.map(loc => (
              <button key={loc.name} onClick={() => { placePin(loc.lat, loc.lng); setSelectedLocation({ ...loc }); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all duration-150 hover:bg-primary/10 group">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs font-medium text-foreground/80 group-hover:text-foreground leading-tight">{loc.name}</span>
              </button>
            ))}
            <p className="text-[10px] text-muted-foreground pt-1 text-center">or click anywhere on the map</p>
          </div>

          {/* Simulation panel */}
          <div className="absolute bottom-4 left-4 w-80 rounded-2xl overflow-hidden"
            style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(16px)', border: '1px solid rgba(168,85,247,0.25)', boxShadow: 'var(--glass-shadow)' }}>
            <button onClick={() => setSimOpen(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-foreground/5 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.15)' }}>
                  <Zap className="w-3.5 h-3.5" style={{ color: '#a855f7' }} />
                </div>
                <span className="text-sm font-semibold text-foreground">Environmental Simulation</span>
                {alerts.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: '#ef4444' }}>{alerts.length}</span>
                )}
              </div>
              {simOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
            </button>

            {simOpen && (
              <div className="px-4 pb-4 space-y-4 border-t" style={{ borderColor: 'rgba(168,85,247,0.15)' }}>
                <div className="space-y-3 pt-3 max-h-72 overflow-y-auto pr-1">
                  {(Object.keys(conditionMeta) as (keyof SimConds)[]).map(k => {
                    const m = conditionMeta[k]; const Icon = m.icon; const val = simConds[k];
                    return (
                      <div key={k}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <Icon className="w-3.5 h-3.5" style={{ color: m.color }} />
                            <span className="text-xs font-medium text-foreground/80">{m.name}</span>
                          </div>
                          <span className="text-xs font-bold" style={{ color: val > 0 ? m.color : 'var(--text-muted)' }}>{val}%</span>
                        </div>
                        <Slider value={[val]} onValueChange={v => setSimConds(p => ({ ...p, [k]: v[0] }))} max={100} step={5} />
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={applySimulation}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
                    <Zap className="w-3.5 h-3.5" /> Apply Simulation
                  </button>
                  <button onClick={resetSim}
                    className="px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground transition-colors border"
                    style={{ borderColor: 'var(--glass-border)' }}>
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── SIDE PANEL ──────────────────────────────────────────────────── */}
        <div className="w-[360px] shrink-0 border-l flex flex-col overflow-y-auto"
          style={{ borderColor: 'var(--glass-border)', background: 'hsl(var(--background))' }}>
          <div className="p-5 space-y-5">

            {/* Alerts */}
            {alerts.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-bold text-foreground">Environmental Alerts</span>
                </div>
                {alerts.map(a => (
                  <div key={a.key} className="rounded-xl p-4 space-y-3"
                    style={{ background: a.bg, border: `1px solid ${a.border}` }}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-foreground">{a.name}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ background: a.severity === 'High' ? '#ef4444' : a.severity === 'Medium' ? '#f59e0b' : '#10b981' }}>
                        {a.severity}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Shield className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Immediate Actions</span>
                      </div>
                      {a.actions.map((act, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: a.color }} />
                          <span className="text-xs text-foreground/70">{act}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Selected location */}
            {selectedLocation ? (
              <Panel className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(16,185,129,0.12)' }}>
                    <MapPin className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Selected Location</p>
                    <p className="text-sm font-medium text-foreground">{selectedLocation.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{selectedLocation.lat.toFixed(4)}°N · {selectedLocation.lng.toFixed(4)}°E</p>
                  </div>
                </div>
              </Panel>
            ) : (
              <Panel className="p-5 text-center">
                <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium text-foreground/70 mb-1">No location selected</p>
                <p className="text-xs text-muted-foreground">Click the map or use Quick Select</p>
              </Panel>
            )}

            {/* Project inputs */}
            <div className="space-y-3">
              <div>
                <Label>Project Name</Label>
                <Input value={projectName} onChange={e => setProjectName(e.target.value)}
                  placeholder="e.g., Western Ghats Restoration 2026"
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground" />
              </div>
              <div>
                <Label>Area (hectares)</Label>
                <Input type="number" value={area} onChange={e => setArea(parseInt(e.target.value) || 0)}
                  placeholder="100"
                  className="bg-background border-border text-foreground" />
              </div>
            </div>

            {/* Analyze button */}
            <button onClick={handleAnalyze} disabled={!selectedLocation || analyzing}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, hsl(152,60%,42%), hsl(168,55%,38%))', boxShadow: '0 6px 20px rgba(45,180,100,0.3)' }}>
              {analyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <><MapPin className="w-4 h-4" /> Analyze Site</>}
            </button>

            {/* Results */}
            {result && (
              <div className="space-y-4">

                {/* Score */}
                <Panel className="p-5">
                  <Label>Suitability Score</Label>
                  <div className="flex items-end gap-4">
                    <div className="text-5xl font-bold leading-none" style={{ color: scoreColor(result.landScore) }}>
                      {result.landScore}
                    </div>
                    <div className="pb-1">
                      <p className="text-sm font-semibold text-foreground">
                        {result.landScore >= 70 ? 'Excellent' : result.landScore >= 50 ? 'Good' : 'Moderate'}
                      </p>
                      <p className="text-xs text-muted-foreground">{result.priority} Priority</p>
                    </div>
                    <div className="ml-auto pb-1">
                      <svg width="56" height="56" viewBox="0 0 56 56">
                        <circle cx="28" cy="28" r="22" fill="none" stroke="hsl(var(--border))" strokeWidth="5" />
                        <circle cx="28" cy="28" r="22" fill="none" stroke={scoreColor(result.landScore)} strokeWidth="5"
                          strokeDasharray={`${(result.landScore / 100) * 138.2} 138.2`}
                          strokeLinecap="round" transform="rotate(-90 28 28)" />
                      </svg>
                    </div>
                  </div>
                  {alerts.length > 0 && (
                    <p className="text-xs text-amber-500 mt-3 pt-3 border-t" style={{ borderColor: 'var(--glass-border)' }}>
                      ⚠ Score adjusted for simulated conditions
                    </p>
                  )}
                </Panel>

                {/* Metrics row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Soil pH', value: result.soil?.ph?.toFixed(1) ?? '—' },
                    { label: 'Moisture', value: result.soil?.moisture ? `${result.soil.moisture}%` : '—' },
                    { label: 'Temp', value: result.weather?.current?.temp ? `${result.weather.current.temp}°C` : '—' },
                  ].map(m => (
                    <Panel key={m.label} className="p-3 text-center">
                      <p className="text-lg font-bold text-foreground">{m.value}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{m.label}</p>
                    </Panel>
                  ))}
                </div>

                {/* Species */}
                <Panel className="p-4">
                  <Label>Recommended Species</Label>
                  <div className="space-y-3">
                    {result.recommendedSpecies.slice(0, 3).map((sp, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-foreground/5"
                        style={{ border: '1px solid var(--glass-border)' }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold text-white"
                          style={{ background: `hsl(${152 - i * 15},60%,42%)` }}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{sp.name}</p>
                          <p className="text-[10px] text-muted-foreground italic truncate">{sp.scientificName}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold" style={{ color: scoreColor(sp.survivalProbability) }}>{sp.survivalProbability}%</p>
                          <p className="text-[10px] text-muted-foreground">survival</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>

                {/* Save */}
                <button onClick={handleSave} disabled={!projectName.trim() || saving}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, hsl(152,60%,42%), hsl(168,55%,38%))' }}>
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Project</>}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// ── Demo fallback ────────────────────────────────────────────────────────────
function demoResult(loc: Location): AnalysisResult {
  return {
    location: loc, landScore: 74, priority: 'High',
    soil: { ph: 6.5, moisture: 62 }, weather: { current: { temp: 24 } }, vegetation: { ndvi: 0.48 },
    recommendedSpecies: [
      { name: 'Teak', scientificName: 'Tectona grandis', survivalProbability: 88, reason: 'Optimal for local pH and temperature.' },
      { name: 'Neem', scientificName: 'Azadirachta indica', survivalProbability: 92, reason: 'Excellent drought tolerance.' },
      { name: 'Bamboo', scientificName: 'Bambusa bambos', survivalProbability: 95, reason: 'Fast-growing, prevents erosion.' },
    ],
  };
}

export default PlanningDashboard;
