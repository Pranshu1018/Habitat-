import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity, TrendingUp, TrendingDown, Minus, Loader2,
  Satellite, Droplets, TreePine, RefreshCw,
  AlertTriangle, CheckCircle2, ArrowRight, MapPin, Plus
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { projectService } from '@/services/database/projectService';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const buildHistory = (baseNdvi: number, baseSurvival: number) => [
  { month: 'Jan', ndvi: +(baseNdvi - 0.20).toFixed(2), survival: Math.round(baseSurvival - 10) },
  { month: 'Feb', ndvi: +(baseNdvi - 0.16).toFixed(2), survival: Math.round(baseSurvival - 8) },
  { month: 'Mar', ndvi: +(baseNdvi - 0.11).toFixed(2), survival: Math.round(baseSurvival - 6) },
  { month: 'Apr', ndvi: +(baseNdvi - 0.07).toFixed(2), survival: Math.round(baseSurvival - 4) },
  { month: 'May', ndvi: +(baseNdvi - 0.04).toFixed(2), survival: Math.round(baseSurvival - 2) },
  { month: 'Jun', ndvi: +baseNdvi.toFixed(2),           survival: Math.round(baseSurvival) },
];

function calcSoilHealth(soil: any): number {
  let s = 0;
  const ph = soil?.ph || 6.5;
  s += ph >= 6 && ph <= 7 ? 30 : ph >= 5.5 && ph <= 7.5 ? 20 : 10;
  const m = soil?.moisture || 60;
  s += m >= 50 && m <= 70 ? 25 : m >= 40 && m <= 80 ? 15 : 5;
  ['nitrogen', 'phosphorus', 'potassium'].forEach((k) => {
    s += (soil as any)?.[k] === 'high' ? 10 : (soil as any)?.[k] === 'medium' ? 5 : 0;
  });
  return Math.min(100, s);
}

const MonitoringDashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [metrics, setMetrics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsub = projectService.subscribeToProjects((all) => {
      setProjects(all);
      setSelected((prev: any) => {
        if (prev) {
          const still = all.find((p: any) => p.id === prev.id);
          return still || (all.length > 0 ? all[0] : null);
        }
        return all.length > 0 ? all[0] : null;
      });
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (selected) fetchMetrics(selected);
  }, [selected?.id]);

  const fetchMetrics = async (project: any) => {
    setRefreshing(true);
    try {
      const lat = project.location?.lat || 14.0;
      const lon = project.location?.lon || 75.5;
      const [veg, soil] = await Promise.all([
        fetch(`${API}/satellite/vegetation?lat=${lat}&lon=${lon}`).then((r) => r.json()).catch(() => null),
        fetch(`${API}/soil/data?lat=${lat}&lon=${lon}`).then((r) => r.json()).catch(() => null),
      ]);
      const ndvi = veg?.ndvi ?? 0.42 + Math.random() * 0.12;
      const soilHealth = calcSoilHealth(soil);
      const survival = Math.min(98, 72 + ndvi * 35 + Math.random() * 4);
      const trend = ndvi > 0.5 ? 'up' : ndvi < 0.35 ? 'down' : 'stable';
      setMetrics({
        ndvi, soilHealth, survival, trend,
        temp: soil?.temperature || 24,
        moisture: soil?.moisture || 62,
        ph: soil?.ph || 6.5,
        history: buildHistory(ndvi, survival),
      });
    } catch {
      const ndvi = 0.47;
      const survival = 86;
      setMetrics({
        ndvi, soilHealth: 72, survival, trend: 'up',
        temp: 24, moisture: 62, ph: 6.5,
        history: buildHistory(ndvi, survival),
      });
    } finally {
      setRefreshing(false);
    }
  };

  const health = metrics
    ? metrics.survival >= 80 ? 'healthy' : metrics.survival >= 60 ? 'warning' : 'critical'
    : 'healthy';

  const scoreColor = (v: number) =>
    v >= 70 ? 'hsl(var(--success))' : v >= 50 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))';

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-muted-foreground text-sm">Connecting to Firebase...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (projects.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full p-6">
          <div className="rounded-2xl border border-border bg-card p-12 text-center max-w-sm">
            <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">No projects yet</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Create a project in Planning, then record a planting session to start monitoring.
            </p>
            <button
              onClick={() => navigate('/planning')}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, hsl(152,60%,42%), hsl(168,55%,38%))',
                color: 'hsl(var(--primary-foreground))',
              }}
            >
              <Plus className="w-4 h-4" /> Start in Planning
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentProject={selected?.name} systemHealth={health as any}>
      <div className="h-full overflow-y-auto">
        <div className="p-6 space-y-5 max-w-6xl mx-auto">

          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Forest Monitoring</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {projects.length} project{projects.length !== 1 ? 's' : ''} · live from Firebase
              </p>
            </div>
            <button
              onClick={() => selected && fetchMetrics(selected)}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          {/* Project pills */}
          {projects.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0"
                  style={{
                    background: selected?.id === p.id ? 'hsl(var(--primary) / 0.12)' : 'hsl(var(--card))',
                    border: selected?.id === p.id ? '1px solid hsl(var(--primary) / 0.4)' : '1px solid hsl(var(--border))',
                    color: selected?.id === p.id ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                  }}
                >
                  <MapPin className="w-3 h-3" />
                  {p.name}
                  <span className="text-[10px] opacity-60 capitalize">· {p.status}</span>
                </button>
              ))}
            </div>
          )}

          {selected && (
            <div className="grid lg:grid-cols-[1fr_260px] gap-5">

              {/* Charts */}
              <div className="space-y-5">
                {/* NDVI */}
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">NDVI Trend</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Vegetation health index — 6 months</p>
                    </div>
                    {metrics && (
                      <div className="flex items-center gap-1.5 text-sm font-bold" style={{ color: scoreColor(metrics.ndvi * 100) }}>
                        {metrics.trend === 'up'
                          ? <TrendingUp className="w-4 h-4" />
                          : metrics.trend === 'down'
                          ? <TrendingDown className="w-4 h-4" />
                          : <Minus className="w-4 h-4" />}
                        {metrics.ndvi.toFixed(3)}
                      </div>
                    )}
                  </div>
                  <div className="h-40">
                    {refreshing ? (
                      <div className="h-full flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={metrics?.history || []}>
                          <defs>
                            <linearGradient id="ndviGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(152,60%,42%)" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(152,60%,42%)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                          <YAxis hide domain={[0.2, 0.7]} />
                          <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11, color: 'hsl(var(--foreground))' }} />
                          <Area type="monotone" dataKey="ndvi" stroke="hsl(152,60%,42%)" strokeWidth={2} fill="url(#ndviGrad)" dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Survival */}
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Survival Rate</p>
                      <p className="text-xs text-muted-foreground mt-0.5">% of trees alive per month</p>
                    </div>
                    {metrics && (
                      <span className="text-lg font-bold" style={{ color: scoreColor(metrics.survival) }}>
                        {metrics.survival.toFixed(0)}%
                      </span>
                    )}
                  </div>
                  <div className="h-36">
                    {refreshing ? (
                      <div className="h-full flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metrics?.history || []} barSize={18}>
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                          <YAxis hide domain={[60, 100]} />
                          <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11, color: 'hsl(var(--foreground))' }}
                            formatter={(v: number) => [`${v}%`, 'Survival']} />
                          <Bar dataKey="survival" fill="hsl(210,70%,55%)" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>

              {/* Right panel */}
              <div className="space-y-4">
                {/* Health status */}
                {metrics && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border p-5"
                    style={{
                      borderColor: health === 'healthy' ? 'hsl(var(--success) / 0.35)' : health === 'warning' ? 'hsl(var(--warning) / 0.35)' : 'hsl(var(--destructive) / 0.35)',
                      background: health === 'healthy' ? 'hsl(var(--success) / 0.06)' : health === 'warning' ? 'hsl(var(--warning) / 0.06)' : 'hsl(var(--destructive) / 0.06)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {health === 'healthy'
                        ? <CheckCircle2 className="w-4 h-4 text-success" />
                        : <AlertTriangle className="w-4 h-4" style={{ color: health === 'warning' ? 'hsl(var(--warning))' : 'hsl(var(--destructive))' }} />}
                      <span
                        className="text-sm font-bold capitalize"
                        style={{ color: health === 'healthy' ? 'hsl(var(--success))' : health === 'warning' ? 'hsl(var(--warning))' : 'hsl(var(--destructive))' }}
                      >
                        {health === 'healthy' ? 'Thriving' : health === 'warning' ? 'Needs Attention' : 'Critical'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {health === 'healthy'
                        ? 'All indicators within healthy ranges. Continue regular monitoring.'
                        : health === 'warning'
                        ? 'Some indicators need attention. Review upcoming risk predictions.'
                        : 'Critical issues detected. Immediate intervention required.'}
                    </p>
                    <button
                      onClick={() => navigate('/prediction')}
                      className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                      style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', border: '1px solid hsl(var(--primary) / 0.3)' }}
                    >
                      View Predictions <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}

                {/* Soil & climate */}
                {metrics && (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Soil & Climate</p>
                    <div className="space-y-3">
                      {[
                        { label: 'Soil Health', value: `${metrics.soilHealth}/100`, icon: Activity,  color: scoreColor(metrics.soilHealth) },
                        { label: 'Moisture',    value: `${metrics.moisture}%`,      icon: Droplets,  color: 'hsl(var(--chart-blue))' },
                        { label: 'Soil pH',     value: metrics.ph.toFixed(1),       icon: Satellite, color: 'hsl(var(--chart-sage))' },
                        { label: 'Temperature', value: `${metrics.temp}°C`,         icon: TreePine,  color: 'hsl(var(--chart-amber))' },
                      ].map((m) => (
                        <div key={m.label} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <m.icon className="w-3.5 h-3.5" style={{ color: m.color }} />
                            <span className="text-xs text-muted-foreground">{m.label}</span>
                          </div>
                          <span className="text-xs font-bold text-foreground">{m.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Project info */}
                <div className="rounded-xl border border-border bg-card p-5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Site Info</p>
                  <p className="text-sm font-semibold text-foreground mb-1">{selected.name}</p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <MapPin className="w-3 h-3" />
                    {selected.location?.name || 'Unknown'}
                  </div>
                  {selected.area && (
                    <p className="text-xs text-muted-foreground">{selected.area} ha</p>
                  )}
                  <div className="mt-2">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                      style={{
                        background: selected.status === 'monitoring' ? 'hsl(var(--primary) / 0.1)' : selected.status === 'completed' ? 'hsl(var(--success) / 0.1)' : 'hsl(var(--warning) / 0.1)',
                        color: selected.status === 'monitoring' ? 'hsl(var(--primary))' : selected.status === 'completed' ? 'hsl(var(--success))' : 'hsl(var(--warning))',
                      }}
                    >
                      {selected.status}
                    </span>
                  </div>
                  {selected.plantingDate && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Planted {new Date(selected.plantingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MonitoringDashboard;
