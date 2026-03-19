import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sprout, Calendar, MapPin, CheckCircle2, Plus, Trash2, Loader2, ArrowRight, TreePine, Save, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { projectService } from '@/services/database/projectService';
import { toast } from 'sonner';

interface ZoneEntry { id: string; name: string; species: string; quantity: number; }

const SPECIES = ['Teak', 'Neem', 'Bamboo', 'Sandalwood', 'Sal', 'Mahogany', 'Eucalyptus', 'Peepal', 'Arjun', 'Jamun'];

// Demo projects shown when Firebase has nothing / fails
const DEMO_PROJECTS = [
  { id: 'demo-1', name: 'Western Ghats Restoration', status: 'planning', location: { name: 'Karnataka, India', lat: 14.0, lon: 75.5 }, area: 250 },
  { id: 'demo-2', name: 'Aravalli Reforestation', status: 'planning', location: { name: 'Rajasthan, India', lat: 25.5, lon: 73.0 }, area: 180 },
];

const PlantingDashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [zones, setZones] = useState<ZoneEntry[]>([
    { id: '1', name: 'Zone A — North', species: 'Teak', quantity: 800 },
    { id: '2', name: 'Zone B — South', species: 'Neem', quantity: 600 },
  ]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [usingDemo, setUsingDemo] = useState(false);

  useEffect(() => {
    const unsub = projectService.subscribeToProjects((all) => {
      // Accept any project status — don't block new users
      if (all.length > 0) {
        setProjects(all);
        setSelected(prev => prev ? (all.find(p => p.id === prev.id) || all[0]) : all[0]);
        setUsingDemo(false);
      } else {
        setProjects(DEMO_PROJECTS);
        setSelected(DEMO_PROJECTS[0]);
        setUsingDemo(true);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const load = async () => { /* kept for compatibility */ };

  const addZone = () => {
    const letters = 'ABCDEFGHIJ';
    setZones(z => [...z, { id: Date.now().toString(), name: `Zone ${letters[z.length] || z.length + 1}`, species: 'Bamboo', quantity: 300 }]);
  };
  const removeZone = (id: string) => setZones(z => z.filter(x => x.id !== id));
  const updateZone = (id: string, field: keyof ZoneEntry, val: string | number) =>
    setZones(z => z.map(x => x.id === id ? { ...x, [field]: val } : x));

  const totalTrees = zones.reduce((s, z) => s + (z.quantity || 0), 0);
  const uniqueSpecies = [...new Set(zones.map(z => z.species))];

  const handleSave = async () => {
    if (!selected) return;
    if (zones.some(z => z.quantity <= 0)) { toast.error('All zones need a quantity > 0'); return; }
    if (usingDemo) {
      toast.success('Demo mode — navigate to Planning to create a real project first');
      setTimeout(() => navigate('/planning'), 1500);
      return;
    }
    setSaving(true);
    try {
      await projectService.savePlantingRecord(selected.id, {
        projectId: selected.id,
        species: zones[0].species,
        quantity: totalTrees,
        plantingDate: date,
        zones: zones.map(z => ({ zoneId: z.name, count: z.quantity, species: z.species, location: selected.location })),
        notes,
        status: 'planted',
        createdAt: new Date().toISOString(),
      });
      setSaved(true);
      toast.success('Planting record saved — moving to Monitoring');
      setTimeout(() => navigate('/monitoring'), 1400);
    } catch {
      toast.error('Save failed — check your connection');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout currentProject={selected?.name || 'Planting'}>
      <div className="h-full overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6 space-y-6">

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Record Planting</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Log species, zones, and quantities for this planting session</p>
            </div>
            {usingDemo && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-amber-600 dark:text-amber-400"
                style={{ background: 'hsl(38,92%,52% / 0.1)', border: '1px solid hsl(38,92%,52% / 0.25)' }}>
                <Info className="w-3.5 h-3.5 shrink-0" />
                Demo data — <button onClick={() => navigate('/planning')} className="underline underline-offset-2">create a project first</button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid lg:grid-cols-[280px_1fr] gap-6">

              {/* Left column */}
              <div className="space-y-4">

                {/* Project */}
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-xs font-medium text-muted-foreground">Project</p>
                  </div>
                  <div className="p-2">
                    {projects.map(p => (
                      <button key={p.id} onClick={() => { setSelected(p); setSaved(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors"
                        style={{ background: selected?.id === p.id ? 'hsl(var(--primary) / 0.08)' : 'transparent' }}>
                        <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                          style={{ background: selected?.id === p.id ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--muted))' }}>
                          <MapPin className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{p.location?.name || '—'}</p>
                        </div>
                        {selected?.id === p.id && <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date */}
                <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                      <Calendar className="w-3 h-3 inline mr-1" />Planting date
                    </label>
                    <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Field notes</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)}
                      placeholder="Soil conditions, weather, crew size..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none" />
                  </div>
                </div>

                {/* Totals */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-3">Session totals</p>
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-muted-foreground">Trees</span>
                      <span className="text-lg font-bold text-foreground tabular-nums">{totalTrees.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-muted-foreground">Zones</span>
                      <span className="text-sm font-semibold text-foreground">{zones.length}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-muted-foreground">Species</span>
                      <span className="text-sm font-semibold text-foreground">{uniqueSpecies.join(', ')}</span>
                    </div>
                    {selected?.area && (
                      <div className="flex justify-between items-baseline pt-2 border-t border-border">
                        <span className="text-xs text-muted-foreground">Density</span>
                        <span className="text-sm font-semibold text-foreground">~{Math.round(totalTrees / selected.area)}/ha</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right column — zones */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Planting zones</p>
                  <button onClick={addZone}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Add zone
                  </button>
                </div>

                <AnimatePresence initial={false}>
                  {zones.map((zone, i) => (
                    <motion.div key={zone.id}
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }}
                      className="rounded-xl border border-border bg-card overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold"
                            style={{ background: `hsl(${152 - i * 18},55%,42%,0.15)`, color: `hsl(${152 - i * 18},55%,42%)` }}>
                            {i + 1}
                          </span>
                          <input value={zone.name} onChange={e => updateZone(zone.id, 'name', e.target.value)}
                            className="text-sm font-medium text-foreground bg-transparent border-none outline-none w-48" />
                        </div>
                        {zones.length > 1 && (
                          <button onClick={() => removeZone(zone.id)}
                            className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="p-4 grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1.5">Species</label>
                          <select value={zone.species} onChange={e => updateZone(zone.id, 'species', e.target.value)}
                            className="w-full h-9 px-3 rounded-lg text-sm bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40">
                            {SPECIES.map(s => <option key={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1.5">Saplings</label>
                          <Input type="number" value={zone.quantity} min={1}
                            onChange={e => updateZone(zone.id, 'quantity', parseInt(e.target.value) || 0)}
                            className="h-9 text-sm" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* CTA */}
                <div className="pt-2">
                  <button onClick={handleSave} disabled={saving || saved}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
                    style={{
                      background: saved
                        ? 'hsl(var(--success) / 0.12)'
                        : 'linear-gradient(135deg, hsl(152,60%,42%), hsl(168,55%,38%))',
                      color: saved ? 'hsl(var(--success))' : 'hsl(var(--primary-foreground))',
                      border: saved ? '1px solid hsl(var(--success) / 0.3)' : 'none',
                    }}>
                    {saving
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                      : saved
                      ? <><CheckCircle2 className="w-4 h-4" /> Saved — heading to Monitoring</>
                      : <><Save className="w-4 h-4" /> Save planting record <ArrowRight className="w-4 h-4" /></>}
                  </button>
                  <p className="text-center text-xs text-muted-foreground mt-2">
                    This will move the project to <span className="text-foreground font-medium">Monitoring</span> phase
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PlantingDashboard;
