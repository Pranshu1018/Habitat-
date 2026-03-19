import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, Loader2, RefreshCw, Thermometer, Droplets, Zap, Bug, Wind, TrendingUp, Calendar, ArrowRight, Shield } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { projectService } from '@/services/database/projectService';
import { notificationStore } from '@/stores/notificationStore';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface DayPrediction {
  day: number; date: string; riskScore: number; riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  primaryCause: string;
  weather: { temp: number; precipitation: number; humidity: number };
  breakdown: { drought: number; heatStress: number; waterScarcity: number; vegetationDecline: number };
  actions: string[];
}

const RC: Record<string, string> = { HIGH: 'hsl(var(--destructive))', MEDIUM: 'hsl(var(--warning))', LOW: 'hsl(var(--success))' };
const RBG: Record<string, string> = { HIGH: 'hsl(var(--destructive) / 0.08)', MEDIUM: 'hsl(var(--warning) / 0.08)', LOW: 'hsl(var(--success) / 0.08)' };
const RBD: Record<string, string> = { HIGH: 'hsl(var(--destructive) / 0.25)', MEDIUM: 'hsl(var(--warning) / 0.25)', LOW: 'hsl(var(--success) / 0.25)' };

const SIMS = [
  { id: 'drought', label: 'Drought', desc: 'No rainfall 30 days', icon: Droplets, color: '#f97316', ndviDrop: 0.15, survivalLoss: 25, zones: 4 },
  { id: 'heatwave', label: 'Heatwave', desc: '45°C for 7 days', icon: Thermometer, color: '#ef4444', ndviDrop: 0.08, survivalLoss: 12, zones: 2 },
  { id: 'pest', label: 'Pest Outbreak', desc: 'Locust swarm', icon: Bug, color: '#a855f7', ndviDrop: 0.12, survivalLoss: 18, zones: 3 },
  { id: 'storm', label: 'Storm', desc: 'Category 3 cyclone', icon: Wind, color: '#3b82f6', ndviDrop: 0.10, survivalLoss: 15, zones: 5 },
];

function makeMock(): DayPrediction[] {
  return Array.from({ length: 8 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i + 1);
    const risk = Math.min(90, 28 + i * 7 + Math.random() * 10);
    return {
      day: i + 1, date: d.toISOString(), riskScore: Math.round(risk),
      riskLevel: risk >= 65 ? 'HIGH' : risk >= 40 ? 'MEDIUM' : 'LOW',
      primaryCause: i < 3 ? 'Heat Stress' : 'Drought',
      weather: { temp: 27 + i * 1.5, precipitation: Math.max(0, 6 - i), humidity: Math.max(38, 68 - i * 3) },
      breakdown: { drought: Math.round(25 + i * 5), heatStress: Math.round(35 + i * 4), waterScarcity: Math.round(20 + i * 3), vegetationDecline: Math.round(15 + i * 2) },
      actions: ['Monitor temperature stress', 'Increase irrigation frequency', 'Prepare emergency water sources'],
    };
  });
}

const PredictionDashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [predictions, setPredictions] = useState<DayPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSim, setActiveSim] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [modelSource, setModelSource] = useState<'ml' | 'rules' | null>(null);

  // Real-time subscription to projects
  useEffect(() => {
    const unsub = projectService.subscribeToProjects((all) => {
      setProjects(all);
      setSelectedProject(prev => {
        if (prev) return all.find(p => p.id === prev.id) || (all.length > 0 ? all[0] : null);
        return all.length > 0 ? all[0] : null;
      });
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (selectedProject) load(selectedProject);
  }, [selectedProject?.id]);

  const load = async (project?: any) => {
    const p = project || selectedProject;
    const lat = p?.location?.lat || 14.0;
    const lon = p?.location?.lon || 75.5;
    try {
      const res = await fetch(`${API}/management/predictions?lat=${lat}&lon=${lon}&days=8`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const preds = (data.predictions || makeMock()).map((p: any) => ({
        ...p,
        actions: p.actions || p.recommendedActions || [],
      }));
      setPredictions(preds);
      setModelSource(data.model || null);
      // Push notification for HIGH risk days
      const highDays = preds.filter((d: any) => d.riskLevel === 'HIGH').length;
      if (highDays > 0) {
        notificationStore.push({
          title: `${highDays} High-Risk Day${highDays > 1 ? 's' : ''} Detected`,
          message: `${p?.name || 'Project'}: ${highDays} of the next 8 days show HIGH forest risk. Review predictions and plan interventions.`,
          severity: 'critical',
          projectId: p?.id,
          projectName: p?.name,
        });
      }
    } catch { setPredictions(makeMock()); }
  };

  const highest = predictions.length ? Math.max(...predictions.map(p => p.riskScore)) : 0;
  const criticalDays = predictions.filter(p => p.riskLevel === 'HIGH').length;
  const avgRisk = predictions.length ? Math.round(predictions.reduce((s, p) => s + p.riskScore, 0) / predictions.length) : 0;

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-full gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Connecting to Firebase...</span>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout currentProject={selectedProject?.name || 'Prediction'} systemHealth="warning">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">8-Day Risk Prediction</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {selectedProject ? `${selectedProject.name} · ${selectedProject.location?.name || ''}` : 'Forecast-based risk analysis'}
              {modelSource && (
                <span
                  className="ml-2 text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{
                    background: modelSource === 'ml' ? 'hsl(210,70%,55% / 0.12)' : 'hsl(var(--muted))',
                    color: modelSource === 'ml' ? 'hsl(210,70%,55%)' : 'hsl(var(--muted-foreground))',
                    border: modelSource === 'ml' ? '1px solid hsl(210,70%,55% / 0.3)' : '1px solid hsl(var(--border))',
                  }}
                >
                  {modelSource === 'ml' ? '🤖 ML Model' : '📐 Rule Engine'}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {projects.length > 1 && (
              <select
                value={selectedProject?.id || ''}
                onChange={e => setSelectedProject(projects.find(p => p.id === e.target.value) || null)}
                className="h-9 px-3 rounded-xl text-xs font-medium bg-card border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40">
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
            <button onClick={() => load()} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-border text-foreground hover:bg-muted/50 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Highest Risk', value: `${highest}%`, icon: AlertTriangle, color: highest >= 65 ? 'hsl(var(--destructive))' : 'hsl(var(--warning))' },
            { label: 'Critical Days', value: criticalDays.toString(), icon: Calendar, color: 'hsl(var(--destructive))' },
            { label: 'Avg Risk', value: `${avgRisk}%`, icon: TrendingUp, color: avgRisk >= 65 ? 'hsl(var(--destructive))' : avgRisk >= 40 ? 'hsl(var(--warning))' : 'hsl(var(--success))' },
          ].map((k, i) => (
            <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{k.label}</span>
                <k.icon className="w-4 h-4" style={{ color: k.color }} />
              </div>
              <div className="text-3xl font-bold" style={{ color: k.color }}>{k.value}</div>
            </motion.div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm font-semibold text-foreground mb-4">Risk Score Progression</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={predictions.map(p => ({ day: `D${p.day}`, risk: p.riskScore }))}>
                <defs>
                  <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0,65%,55%)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(0,65%,55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11, color: 'hsl(var(--foreground))' }} formatter={(v: number) => [`${v}%`, 'Risk']} />
                <Area type="monotone" dataKey="risk" stroke="hsl(0,65%,55%)" strokeWidth={2} fill="url(#rg)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Daily Breakdown</p>
          {predictions.map(p => (
            <motion.div key={p.day} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: p.day * 0.04 }}
              className="rounded-2xl overflow-hidden cursor-pointer"
              style={{ background: RBG[p.riskLevel], border: `1px solid ${RBD[p.riskLevel]}` }}
              onClick={() => setExpanded(expanded === p.day ? null : p.day)}>
              <div className="flex items-center gap-4 p-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: RC[p.riskLevel] }}>D{p.day}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-foreground">{new Date(p.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold text-white" style={{ background: RC[p.riskLevel] }}>{p.riskLevel}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{p.primaryCause} · {p.weather.temp.toFixed(1)}°C · {p.weather.precipitation.toFixed(1)}mm</p>
                </div>
                <div className="text-2xl font-bold shrink-0" style={{ color: RC[p.riskLevel] }}>{p.riskScore}%</div>
              </div>
              {expanded === p.day && (
                <div className="px-4 pb-4 border-t" style={{ borderColor: RBD[p.riskLevel] }}>
                  <div className="grid grid-cols-2 gap-3 pt-3 mb-3">
                    {Object.entries(p.breakdown).map(([k, v]) => (
                      <div key={k}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                          <span className="font-bold text-foreground">{v}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-border overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${v}%`, background: RC[p.riskLevel] }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {p.riskLevel !== 'LOW' && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recommended Actions</p>
                      {p.actions.map((a, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Shield className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
                          <span className="text-xs text-foreground/80">{a}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Scenario Simulation</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {SIMS.map(sim => {
              const Icon = sim.icon;
              const active = activeSim === sim.id;
              return (
                <button key={sim.id} onClick={() => setActiveSim(active ? null : sim.id)}
                  className="p-4 rounded-xl text-left transition-all duration-150"
                  style={{ background: active ? `${sim.color}15` : 'hsl(var(--muted) / 0.4)', border: active ? `1px solid ${sim.color}50` : '1px solid hsl(var(--border))' }}>
                  <Icon className="w-5 h-5 mb-2" style={{ color: sim.color }} />
                  <p className="text-xs font-semibold text-foreground">{sim.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{sim.desc}</p>
                </button>
              );
            })}
          </div>
          {activeSim && (() => {
            const sim = SIMS.find(s => s.id === activeSim)!;
            return (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl p-4 grid grid-cols-3 gap-4 text-center"
                style={{ background: `${sim.color}10`, border: `1px solid ${sim.color}30` }}>
                {[{ label: 'NDVI Drop', value: `-${sim.ndviDrop.toFixed(2)}` }, { label: 'Survival Loss', value: `${sim.survivalLoss}%` }, { label: 'Zones Affected', value: `${sim.zones}` }].map(r => (
                  <div key={r.label}>
                    <div className="text-2xl font-bold" style={{ color: sim.color }}>{r.value}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{r.label}</div>
                  </div>
                ))}
              </motion.div>
            );
          })()}
        </div>

        {criticalDays > 0 && (
          <div className="rounded-2xl p-5 flex items-center justify-between"
            style={{ background: 'hsl(var(--destructive) / 0.08)', border: '1px solid hsl(var(--destructive) / 0.25)' }}>
            <div>
              <p className="text-sm font-bold text-foreground">{criticalDays} critical day{criticalDays > 1 ? 's' : ''} detected</p>
              <p className="text-xs text-muted-foreground mt-0.5">Plan interventions now to minimize forest loss</p>
            </div>
            <button onClick={() => navigate('/intervention')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'hsl(var(--destructive))' }}>
              Plan Intervention <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PredictionDashboard;
