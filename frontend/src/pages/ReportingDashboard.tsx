import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Download, Loader2, TreePine, Leaf, Activity,
  TrendingUp, Users, DollarSign, Calendar, CheckCircle2, BarChart2, Plus,
  Target, Globe, Zap, Award
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { projectService, interventionService } from '@/services/database/projectService';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { CarbonProjectionChart } from '@/components/analytics/CarbonProjectionChart';
import { CarbonCertification } from '@/components/analytics/CarbonCertification';

const CARBON_TIMELINE = [
  { year: '2021', carbon: 120, target: 200 },
  { year: '2022', carbon: 340, target: 500 },
  { year: '2023', carbon: 680, target: 900 },
  { year: '2024', carbon: 1100, target: 1400 },
  { year: '2025', carbon: 1580, target: 1800 },
  { year: '2026', carbon: 2200, target: 2500 },
];

const SPECIES_MIX = [
  { name: 'Teak', value: 38, color: 'hsl(152,60%,42%)' },
  { name: 'Neem', value: 28, color: 'hsl(210,70%,55%)' },
  { name: 'Bamboo', value: 22, color: 'hsl(38,92%,52%)' },
  { name: 'Other', value: 12, color: 'hsl(25,45%,48%)' },
];

const SURVIVAL_DATA = [
  { month: 'Jan', rate: 78 }, { month: 'Feb', rate: 80 }, { month: 'Mar', rate: 82 },
  { month: 'Apr', rate: 85 }, { month: 'May', rate: 87 }, { month: 'Jun', rate: 89 },
];

const MONTHLY_PLANTING = [
  { month: 'Jan', trees: 420 }, { month: 'Feb', trees: 680 }, { month: 'Mar', trees: 920 },
  { month: 'Apr', trees: 1100 }, { month: 'May', trees: 850 }, { month: 'Jun', trees: 1340 },
];

const SDG_DATA = [
  { sdg: 'SDG 13', title: 'Climate Action', icon: Globe, color: '#3b82f6', progress: 72 },
  { sdg: 'SDG 15', title: 'Life on Land', icon: Leaf, color: '#10b981', progress: 85 },
  { sdg: 'SDG 1', title: 'No Poverty', icon: Users, color: '#f59e0b', progress: 58 },
  { sdg: 'SDG 8', title: 'Decent Work', icon: Award, color: '#a855f7', progress: 64 },
];

const ReportingDashboard = () => {
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const unsub = projectService.subscribeToProjects(async (all) => {
      setProjects(all);
      const allInterventions: any[] = [];
      for (const p of all.slice(0, 10)) {
        try {
          const list = await interventionService.getInterventionsByProject(p.id);
          allInterventions.push(...list);
        } catch { /* skip */ }
      }
      setInterventions(allInterventions);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const totalTrees = projects.reduce((s, p) => s + (p.totalTrees || 2400), 0) || 0;
  const totalHectares = projects.reduce((s, p) => s + (p.area || 100), 0);
  const totalCarbon = Math.round(totalTrees * 0.022 * 5);
  const completedInterventions = interventions.filter(i => i.status === 'completed').length;
  const avgSurvival = 87;
  const economicValue = totalTrees * 120;
  const farmersHelped = Math.round(totalHectares / 2);

  const handleExportPDF = () => {
    setGenerating(true);
    // Build a printable HTML blob and trigger download
    const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Habitat Impact Report — ${date}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #1a1a1a; }
    h1 { color: #1a7a4a; font-size: 28px; margin-bottom: 4px; }
    .subtitle { color: #666; font-size: 14px; margin-bottom: 32px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
    .kpi { background: #f5faf7; border: 1px solid #d0e8da; border-radius: 12px; padding: 16px; }
    .kpi-value { font-size: 24px; font-weight: 700; color: #1a7a4a; }
    .kpi-label { font-size: 12px; color: #666; margin-top: 4px; }
    .section { margin-bottom: 28px; }
    .section-title { font-size: 16px; font-weight: 600; color: #1a1a1a; margin-bottom: 12px; border-bottom: 2px solid #d0e8da; padding-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #f5faf7; padding: 8px 12px; text-align: left; font-weight: 600; color: #444; }
    td { padding: 8px 12px; border-bottom: 1px solid #eee; }
    .sdg-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .sdg-card { background: #f5faf7; border-radius: 8px; padding: 12px; }
    .sdg-tag { font-size: 11px; font-weight: 700; color: #1a7a4a; }
    .progress-bar { height: 6px; background: #e0e0e0; border-radius: 3px; margin-top: 6px; }
    .progress-fill { height: 100%; background: #1a7a4a; border-radius: 3px; }
    .footer { margin-top: 40px; font-size: 11px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 16px; }
  </style>
</head>
<body>
  <h1>🌿 Habitat — Impact Report</h1>
  <div class="subtitle">Generated on ${date} · ${projects.length} active project${projects.length !== 1 ? 's' : ''}</div>

  <div class="grid">
    <div class="kpi"><div class="kpi-value">${totalTrees.toLocaleString()}</div><div class="kpi-label">Trees Planted</div></div>
    <div class="kpi"><div class="kpi-value">${totalHectares} ha</div><div class="kpi-label">Hectares Restored</div></div>
    <div class="kpi"><div class="kpi-value">${totalCarbon.toLocaleString()} t</div><div class="kpi-label">CO₂ Sequestered</div></div>
    <div class="kpi"><div class="kpi-value">${avgSurvival}%</div><div class="kpi-label">Avg Survival Rate</div></div>
    <div class="kpi"><div class="kpi-value">${projects.length}</div><div class="kpi-label">Active Projects</div></div>
    <div class="kpi"><div class="kpi-value">${completedInterventions}</div><div class="kpi-label">Interventions Done</div></div>
    <div class="kpi"><div class="kpi-value">${farmersHelped.toLocaleString()}</div><div class="kpi-label">Farmers Benefited</div></div>
    <div class="kpi"><div class="kpi-value">₹${economicValue.toLocaleString()}</div><div class="kpi-label">Economic Value</div></div>
  </div>

  <div class="section">
    <div class="section-title">Projects</div>
    <table>
      <tr><th>Project Name</th><th>Location</th><th>Status</th></tr>
      ${projects.map(p => `<tr><td>${p.name}</td><td>${p.location?.name || '—'}</td><td>${p.status}</td></tr>`).join('')}
    </table>
  </div>

  <div class="section">
    <div class="section-title">SDG Impact Alignment</div>
    <div class="sdg-grid">
      <div class="sdg-card"><div class="sdg-tag">SDG 13 — Climate Action</div><div>CO₂ sequestered: ${totalCarbon.toLocaleString()} tonnes</div><div class="progress-bar"><div class="progress-fill" style="width:72%"></div></div></div>
      <div class="sdg-card"><div class="sdg-tag">SDG 15 — Life on Land</div><div>Hectares restored: ${totalHectares}</div><div class="progress-bar"><div class="progress-fill" style="width:85%"></div></div></div>
      <div class="sdg-card"><div class="sdg-tag">SDG 1 — No Poverty</div><div>Farmers supported: ${farmersHelped.toLocaleString()}</div><div class="progress-bar"><div class="progress-fill" style="width:58%"></div></div></div>
      <div class="sdg-card"><div class="sdg-tag">SDG 8 — Decent Work</div><div>Economic value: ₹${economicValue.toLocaleString()}</div><div class="progress-bar"><div class="progress-fill" style="width:64%"></div></div></div>
    </div>
  </div>

  <div class="footer">Habitat Forest Intelligence Platform · Confidential Impact Report · ${date}</div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habitat-impact-report-${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => {
      setGenerating(false);
      toast.success('Report downloaded — open in browser and print as PDF');
    }, 800);
  };

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-full gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="text-muted-foreground text-sm">Loading report data...</span>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout currentProject="Impact Report">
      <div ref={reportRef} className="p-6 max-w-6xl mx-auto space-y-6">

        {/* Hero banner */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden p-8"
          style={{ background: 'linear-gradient(135deg, hsl(152,60%,18%) 0%, hsl(168,55%,14%) 50%, hsl(210,50%,16%) 100%)', border: '1px solid hsl(152,60%,28% / 0.4)' }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, hsl(152,60%,42%) 0%, transparent 50%), radial-gradient(circle at 80% 20%, hsl(210,70%,55%) 0%, transparent 40%)' }} />
          <div className="relative flex items-center justify-between flex-wrap gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(45,180,100,0.2)', border: '1px solid rgba(45,180,100,0.3)' }}>
                  <FileText className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Impact Report</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-1">Forest Impact Dashboard</h1>
              <p className="text-white/60 text-sm">
                {projects.length > 0
                  ? `${projects.length} project${projects.length !== 1 ? 's' : ''} · ${interventions.length} intervention${interventions.length !== 1 ? 's' : ''} · Live from Firebase`
                  : 'No projects yet — start in Planning'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-4xl font-bold text-white">{totalTrees > 0 ? totalTrees.toLocaleString() : '—'}</div>
                <div className="text-xs text-white/50 mt-0.5">trees planted</div>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="text-right">
                <div className="text-4xl font-bold text-emerald-400">{totalCarbon > 0 ? `${totalCarbon.toLocaleString()}t` : '—'}</div>
                <div className="text-xs text-white/50 mt-0.5">CO₂ sequestered</div>
              </div>
              <button onClick={handleExportPDF} disabled={generating || projects.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ml-4"
                style={{ background: 'rgba(45,180,100,0.9)', color: 'white', boxShadow: '0 4px 20px rgba(45,180,100,0.4)' }}>
                {generating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Download className="w-4 h-4" /> Export Report</>}
              </button>
            </div>
          </div>
        </motion.div>

        {projects.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-16 text-center">
            <FileText className="w-14 h-14 text-muted-foreground/25 mx-auto mb-5" />
            <h2 className="text-lg font-semibold text-foreground mb-2">No data to report yet</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Create your first project in Planning, complete a planting session, and your impact data will appear here automatically.
            </p>
            <button onClick={() => navigate('/planning')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, hsl(152,60%,42%), hsl(168,55%,38%))', color: 'hsl(var(--primary-foreground))' }}>
              <Plus className="w-4 h-4" /> Start in Planning
            </button>
          </div>
        ) : (
          <>
            {/* KPI strip — 4 primary metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Hectares Restored', value: totalHectares > 0 ? `${totalHectares.toLocaleString()} ha` : '—', icon: Leaf, color: '#10b981', change: '+12% vs last year' },
                { label: 'Avg Survival Rate', value: projects.length > 0 ? `${avgSurvival}%` : '—', icon: TrendingUp, color: '#3b82f6', change: '+5% this quarter' },
                { label: 'Farmers Benefited', value: farmersHelped > 0 ? farmersHelped.toLocaleString() : '—', icon: Users, color: '#f59e0b', change: `${projects.length} active projects` },
                { label: 'Economic Value', value: economicValue > 0 ? `₹${(economicValue / 100000).toFixed(1)}L` : '—', icon: DollarSign, color: '#a855f7', change: 'Estimated lifetime' },
              ].map((k, i) => (
                <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className="rounded-xl border border-border bg-card p-5 group hover:border-primary/30 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${k.color}18` }}>
                      <k.icon className="w-4.5 h-4.5" style={{ color: k.color }} size={18} />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{k.change}</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">{k.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{k.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Secondary stats row */}
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Projects', value: projects.length, icon: BarChart2, color: 'hsl(var(--primary))' },
                { label: 'Interventions', value: interventions.length, icon: Activity, color: '#6b7280' },
                { label: 'Completed', value: completedInterventions, icon: CheckCircle2, color: '#10b981' },
                { label: 'Species', value: 3, icon: Leaf, color: '#f59e0b' },
                { label: 'Monitoring', value: projects.filter(p => p.status === 'monitoring').length, icon: Target, color: '#3b82f6' },
                { label: 'Alerts', value: 0, icon: Zap, color: '#a855f7' },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.04 }}
                  className="rounded-xl border border-border bg-card p-3 text-center">
                  <s.icon className="w-4 h-4 mx-auto mb-1.5" style={{ color: s.color }} />
                  <div className="text-lg font-bold text-foreground">{s.value}</div>
                  <div className="text-[10px] text-muted-foreground">{s.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Main charts */}
            <div className="grid lg:grid-cols-3 gap-5">
              {/* Carbon timeline — centerpiece */}
              <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-foreground">Carbon Sequestration Timeline</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Actual</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />Target</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-5">Projected CO₂ sequestered (tonnes) vs target</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={CARBON_TIMELINE}>
                      <defs>
                        <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(152,60%,42%)" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="hsl(152,60%,42%)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(210,70%,55%)" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="hsl(210,70%,55%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11, color: 'hsl(var(--foreground))' }}
                        formatter={(v: number, name: string) => [`${v} t`, name === 'carbon' ? 'Actual' : 'Target']} />
                      <Area type="monotone" dataKey="target" stroke="hsl(210,70%,55%)" strokeWidth={1.5} strokeDasharray="4 3" fill="url(#tGrad)" dot={false} />
                      <Area type="monotone" dataKey="carbon" stroke="hsl(152,60%,42%)" strokeWidth={2.5} fill="url(#cGrad)" dot={{ fill: 'hsl(152,60%,42%)', r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Species mix donut */}
              <div className="rounded-xl border border-border bg-card p-6">
                <p className="text-sm font-semibold text-foreground mb-1">Species Mix</p>
                <p className="text-xs text-muted-foreground mb-4">Distribution across projects</p>
                <div className="h-40 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={SPECIES_MIX} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                        {SPECIES_MIX.map((s, i) => <Cell key={i} fill={s.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11, color: 'hsl(var(--foreground))' }}
                        formatter={(v: number) => [`${v}%`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {SPECIES_MIX.map(s => (
                    <div key={s.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                      <span className="text-xs text-muted-foreground flex-1">{s.name}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${s.value}%`, background: s.color }} />
                      </div>
                      <span className="text-xs font-semibold text-foreground w-8 text-right">{s.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Survival + monthly planting */}
            <div className="grid lg:grid-cols-2 gap-5">
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-sm font-semibold text-foreground mb-1">Survival Rate Trend</p>
                <p className="text-xs text-muted-foreground mb-4">% of trees alive per month</p>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={SURVIVAL_DATA}>
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis hide domain={[70, 95]} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11, color: 'hsl(var(--foreground))' }}
                        formatter={(v: number) => [`${v}%`, 'Survival']} />
                      <Line type="monotone" dataKey="rate" stroke="hsl(210,70%,55%)" strokeWidth={2.5} dot={{ fill: 'hsl(210,70%,55%)', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <p className="text-sm font-semibold text-foreground mb-1">Monthly Planting Activity</p>
                <p className="text-xs text-muted-foreground mb-4">Trees planted per month</p>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={MONTHLY_PLANTING} barSize={24}>
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis hide />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11, color: 'hsl(var(--foreground))' }}
                        formatter={(v: number) => [v.toLocaleString(), 'Trees']} />
                      <Bar dataKey="trees" fill="hsl(152,60%,42%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* 20-year IPCC carbon projection */}
            <CarbonProjectionChart totalTrees={totalTrees || 10000} />

            {/* Carbon credit certification workflow */}
            <CarbonCertification />

            {/* SDG section — visual progress bars */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)' }}>
                  <Globe className="w-4.5 h-4.5 text-blue-400" size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">SDG Impact Alignment</p>
                  <p className="text-xs text-muted-foreground">UN Sustainable Development Goals progress</p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {SDG_DATA.map((s, i) => {
                  const Icon = s.icon;
                  const metricMap: Record<string, string> = {
                    'SDG 13': `${totalCarbon.toLocaleString()} t CO₂ sequestered`,
                    'SDG 15': `${totalHectares} ha restored`,
                    'SDG 1': `${farmersHelped.toLocaleString()} farmers supported`,
                    'SDG 8': `₹${economicValue.toLocaleString()} economic value`,
                  };
                  return (
                    <motion.div key={s.sdg} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.08 }}
                      className="flex items-start gap-4 p-4 rounded-xl" style={{ background: `${s.color}08`, border: `1px solid ${s.color}20` }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${s.color}18` }}>
                        <Icon className="w-5 h-5" style={{ color: s.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div>
                            <span className="text-xs font-bold" style={{ color: s.color }}>{s.sdg}</span>
                            <span className="text-sm font-semibold text-foreground ml-2">{s.title}</span>
                          </div>
                          <span className="text-sm font-bold" style={{ color: s.color }}>{s.progress}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden mb-2">
                          <motion.div className="h-full rounded-full" style={{ background: s.color }}
                            initial={{ width: 0 }} animate={{ width: `${s.progress}%` }} transition={{ duration: 1, delay: 0.6 + i * 0.1 }} />
                        </div>
                        <p className="text-xs text-muted-foreground">{metricMap[s.sdg]}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Live projects table */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-foreground">Projects — Live from Firebase</p>
                <span className="flex items-center gap-1.5 text-xs text-emerald-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Real-time
                </span>
              </div>
              <div className="space-y-2 max-h-52 overflow-y-auto scrollbar-thin">
                {projects.map((p, i) => (
                  <div key={p.id || i} className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'hsl(var(--primary) / 0.1)' }}>
                        <TreePine className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{p.location?.name || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                        style={{
                          background: p.status === 'completed' ? 'hsl(var(--success) / 0.1)' : p.status === 'monitoring' ? 'hsl(var(--primary) / 0.1)' : 'hsl(var(--warning) / 0.1)',
                          color: p.status === 'completed' ? 'hsl(var(--success))' : p.status === 'monitoring' ? 'hsl(var(--primary))' : 'hsl(var(--warning))',
                        }}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer export bar */}
            <div className="rounded-xl border border-border bg-card p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.1)' }}>
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Full Impact Report</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3" />
                    {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <button onClick={handleExportPDF} disabled={generating}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-border text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50">
                {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                Download HTML Report
              </button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ReportingDashboard;
