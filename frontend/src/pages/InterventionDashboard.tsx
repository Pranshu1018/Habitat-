import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wrench, Plus, CheckCircle2, Clock, Loader2, Droplets,
  Sprout, Bug, Flame, RotateCcw, Calendar, DollarSign, Save, MapPin,
  ArrowRight, TrendingUp, AlertCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { interventionService, projectService } from '@/services/database/projectService';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

type InterventionType = 'watering' | 'fertilization' | 'pest_control' | 'replanting' | 'other';
type InterventionStatus = 'planned' | 'in_progress' | 'completed';

const TYPE_META: Record<InterventionType, { label: string; icon: any; color: string; bg: string }> = {
  watering:      { label: 'Watering',      icon: Droplets,  color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  fertilization: { label: 'Fertilization', icon: Sprout,    color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  pest_control:  { label: 'Pest Control',  icon: Bug,       color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  replanting:    { label: 'Replanting',    icon: RotateCcw, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  other:         { label: 'Other',         icon: Wrench,    color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
};

const COLUMNS: { status: InterventionStatus; label: string; color: string; bg: string; border: string; icon: any }[] = [
  { status: 'planned',     label: 'Planned',     color: '#f59e0b', bg: 'rgba(245,158,11,0.06)',  border: 'rgba(245,158,11,0.2)',  icon: Clock },
  { status: 'in_progress', label: 'In Progress', color: '#3b82f6', bg: 'rgba(59,130,246,0.06)',  border: 'rgba(59,130,246,0.2)',  icon: Flame },
  { status: 'completed',   label: 'Completed',   color: '#10b981', bg: 'rgba(16,185,129,0.06)',  border: 'rgba(16,185,129,0.2)',  icon: CheckCircle2 },
];

const BLANK = {
  type: 'watering' as InterventionType,
  description: '',
  cost: '',
  date: new Date().toISOString().split('T')[0],
};


const InterventionDashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingInterventions, setLoadingInterventions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [movingId, setMovingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = projectService.subscribeToProjects((all) => {
      setProjects(all);
      setSelectedProject((prev: any) => {
        if (prev) return all.find((p: any) => p.id === prev.id) || (all.length > 0 ? all[0] : null);
        return all.length > 0 ? all[0] : null;
      });
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (selectedProject?.id) loadInterventions(selectedProject.id);
  }, [selectedProject?.id]);

  const loadInterventions = async (projectId: string) => {
    setLoadingInterventions(true);
    try {
      const list = await interventionService.getInterventionsByProject(projectId);
      setInterventions(list);
    } catch {
      setInterventions([]);
    } finally {
      setLoadingInterventions(false);
    }
  };

  const handleSave = async () => {
    if (!selectedProject || !form.description.trim()) { toast.error('Fill in description'); return; }
    setSaving(true);
    try {
      await interventionService.createIntervention({
        projectId: selectedProject.id,
        type: form.type,
        description: form.description,
        cost: form.cost ? parseFloat(form.cost) : undefined,
        interventionDate: form.date,
        status: 'planned',
      });
      toast.success('Intervention planned');
      setShowForm(false);
      setForm(BLANK);
      loadInterventions(selectedProject.id);
    } catch {
      toast.error('Failed to save — check Firebase connection');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: InterventionStatus) => {
    setMovingId(id);
    setInterventions((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    try {
      await interventionService.updateInterventionStatus(id, status);
      toast.success(`Moved to ${status.replace('_', ' ')}`);
    } catch {
      loadInterventions(selectedProject?.id);
      toast.error('Failed to update status');
    } finally {
      setMovingId(null);
    }
  };

  const totalCost = interventions.reduce((s, i) => s + (i.cost || 0), 0);
  const completionRate = interventions.length > 0
    ? Math.round((interventions.filter(i => i.status === 'completed').length / interventions.length) * 100)
    : 0;

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
            <Wrench className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">No projects yet</h2>
            <p className="text-sm text-muted-foreground mb-6">Create a project in Planning first to log interventions.</p>
            <button onClick={() => navigate('/planning')}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, hsl(152,60%,42%), hsl(168,55%,38%))', color: 'hsl(var(--primary-foreground))' }}>
              <Plus className="w-4 h-4" /> Go to Planning
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentProject={selectedProject?.name || 'Intervention'}>
      <div className="p-6 space-y-5 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Intervention Tracker</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Plan and track corrective actions — Kanban view</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, hsl(152,60%,42%), hsl(168,55%,38%))', color: 'hsl(var(--primary-foreground))', boxShadow: '0 4px 16px rgba(45,180,100,0.3)' }}>
            <Plus className="w-4 h-4" /> New Intervention
          </button>
        </div>

        {/* Project selector */}
        {projects.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {projects.map((p) => (
              <button key={p.id} onClick={() => setSelectedProject(p)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0"
                style={{
                  background: selectedProject?.id === p.id ? 'hsl(var(--primary) / 0.12)' : 'hsl(var(--card))',
                  border: selectedProject?.id === p.id ? '1px solid hsl(var(--primary) / 0.4)' : '1px solid hsl(var(--border))',
                  color: selectedProject?.id === p.id ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                }}>
                <MapPin className="w-3 h-3" />{p.name}
              </button>
            ))}
          </div>
        )}

        {/* Summary strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total Actions', value: interventions.length, icon: Wrench, color: '#6b7280' },
            { label: 'Completion Rate', value: `${completionRate}%`, icon: TrendingUp, color: '#10b981' },
            { label: 'In Progress', value: interventions.filter(i => i.status === 'in_progress').length, icon: Flame, color: '#3b82f6' },
            { label: 'Total Cost', value: totalCost > 0 ? `\u20B9${totalCost.toLocaleString()}` : '\u20B90', icon: DollarSign, color: '#a855f7' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${s.color}15` }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <div>
                <div className="text-xl font-bold text-foreground">{s.value}</div>
                <div className="text-[10px] text-muted-foreground">{s.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Kanban board */}
        {loadingInterventions ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {COLUMNS.map((col) => {
              const ColIcon = col.icon;
              const items = interventions.filter(i => i.status === col.status);
              return (
                <div key={col.status} className="rounded-2xl flex flex-col min-h-96"
                  style={{ background: col.bg, border: `1px solid ${col.border}` }}>
                  {/* Column header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: col.border }}>
                    <div className="flex items-center gap-2.5">
                      <ColIcon className="w-4 h-4" style={{ color: col.color }} />
                      <span className="text-sm font-semibold text-foreground">{col.label}</span>
                    </div>
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: col.color }}>
                      {items.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 p-3 space-y-3 overflow-y-auto scrollbar-thin">
                    {items.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <ColIcon className="w-8 h-8 mb-2 opacity-20" style={{ color: col.color }} />
                        <p className="text-xs text-muted-foreground">No {col.label.toLowerCase()} items</p>
                      </div>
                    ) : (
                      <AnimatePresence>
                        {items.map((item, i) => {
                          const meta = TYPE_META[item.type as InterventionType] || TYPE_META.other;
                          const Icon = meta.icon;
                          const isMoving = movingId === item.id;
                          return (
                            <motion.div key={item.id || i}
                              initial={{ opacity: 0, y: 8 }} animate={{ opacity: isMoving ? 0.5 : 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.04 }}
                              className="rounded-xl p-4 transition-all hover:shadow-md"
                              style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                              <div className="flex items-start gap-3 mb-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: meta.bg }}>
                                  <Icon className="w-4 h-4" style={{ color: meta.color }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="text-xs font-semibold" style={{ color: meta.color }}>{meta.label}</span>
                                  <p className="text-sm text-foreground mt-0.5 leading-snug">{item.description}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-3">
                                {item.interventionDate && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />{item.interventionDate}
                                  </span>
                                )}
                                {item.cost > 0 && (
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" />{'\u20B9'}{Number(item.cost).toLocaleString()}
                                  </span>
                                )}
                              </div>
                              {item.status === 'planned' && (
                                <button onClick={() => updateStatus(item.id, 'in_progress')} disabled={isMoving}
                                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                                  style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.25)' }}>
                                  {isMoving ? <Loader2 className="w-3 h-3 animate-spin" /> : <><ArrowRight className="w-3 h-3" /> Start</>}
                                </button>
                              )}
                              {item.status === 'in_progress' && (
                                <button onClick={() => updateStatus(item.id, 'completed')} disabled={isMoving}
                                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                                  style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}>
                                  {isMoving ? <Loader2 className="w-3 h-3 animate-spin" /> : <><CheckCircle2 className="w-3 h-3" /> Mark Complete</>}
                                </button>
                              )}
                              {item.status === 'completed' && (
                                <div className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium"
                                  style={{ background: 'rgba(16,185,129,0.08)', color: '#10b981' }}>
                                  <CheckCircle2 className="w-3 h-3" /> Done
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    )}
                  </div>

                  {items.length > 0 && (
                    <div className="px-4 py-2.5 border-t text-xs text-muted-foreground flex items-center justify-between"
                      style={{ borderColor: col.border }}>
                      <span>{items.length} item{items.length !== 1 ? 's' : ''}</span>
                      {items.some(i => i.cost > 0) && (
                        <span className="font-semibold" style={{ color: col.color }}>
                          {'\u20B9'}{items.reduce((s, i) => s + (i.cost || 0), 0).toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Cost breakdown */}
        {interventions.some(i => i.cost > 0) && (
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <p className="text-sm font-semibold text-foreground">Cost Breakdown by Type</p>
            </div>
            <div className="space-y-3">
              {(Object.keys(TYPE_META) as InterventionType[]).map(type => {
                const items = interventions.filter(i => i.type === type && i.cost > 0);
                if (!items.length) return null;
                const cost = items.reduce((s, i) => s + (i.cost || 0), 0);
                const pct = totalCost > 0 ? Math.round((cost / totalCost) * 100) : 0;
                const meta = TYPE_META[type];
                return (
                  <div key={type} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: meta.bg }}>
                      <meta.icon className="w-3 h-3" style={{ color: meta.color }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-24 shrink-0">{meta.label}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div className="h-full rounded-full" style={{ background: meta.color }}
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
                    </div>
                    <span className="text-xs font-semibold text-foreground w-20 text-right">{'\u20B9'}{cost.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>


      {/* New intervention modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.93, opacity: 0 }}
              className="w-full max-w-md rounded-2xl p-6 space-y-5"
              style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              onClick={(e) => e.stopPropagation()}>
              <div>
                <h3 className="text-lg font-bold text-foreground">New Intervention</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Plan a corrective action for {selectedProject?.name}</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(TYPE_META) as InterventionType[]).map((t) => {
                    const m = TYPE_META[t];
                    const TIcon = m.icon;
                    return (
                      <button key={t} onClick={() => setForm((f) => ({ ...f, type: t }))}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs font-medium transition-all"
                        style={{
                          background: form.type === t ? m.bg : 'hsl(var(--muted) / 0.4)',
                          border: form.type === t ? `1px solid ${m.color}50` : '1px solid hsl(var(--border))',
                          color: form.type === t ? m.color : 'hsl(var(--muted-foreground))',
                        }}>
                        <TIcon className="w-4 h-4" />{m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Describe the intervention..." rows={3}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                    <Calendar className="w-3 h-3 inline mr-1" />Date
                  </label>
                  <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                    <DollarSign className="w-3 h-3 inline mr-1" />Cost
                  </label>
                  <Input type="number" value={form.cost} onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))} placeholder="Optional" />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors border border-border">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving || !form.description.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, hsl(152,60%,42%), hsl(168,55%,38%))', color: 'hsl(var(--primary-foreground))' }}>
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default InterventionDashboard;
