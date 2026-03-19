import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Satellite, Loader2, ArrowLeft, ArrowRight, CheckCircle2,
  TreePine, Leaf, Sun, Activity, Info, Save, Download
} from 'lucide-react';
import SpeciesSuitabilityMap from '@/components/SpeciesSuitabilityMap';
import { Input } from '@/components/ui/input';
import { siteAPI } from '@/services/api';
import { toast } from 'sonner';
import { projectService, analysisService } from '@/services/database/projectService';

interface SiteData {
  location: { lat: number; lon: number; name: string };
  satellite: { ndvi: number; landCover: string; degradationLevel: string; priority: 'high' | 'medium' | 'low' };
  soil: { ph: number; nitrogen: string; phosphorus: string; moisture: number; texture: string };
  climate: { rainfall: number; temperature: number; seasonality: string };
  species: Array<{ name: string; scientificName: string; survivalProbability: number; reason: string; careRequirements: string[]; imageUrl: string }>;
  suitabilityScore: number;
}

const LOCATIONS = [
  { name: 'Western Ghats', region: 'Karnataka, India', lat: 14.0, lon: 75.5, image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80', description: 'Biodiversity hotspot with high rainfall' },
  { name: 'Aravalli Range', region: 'Rajasthan, India', lat: 25.5, lon: 73.0, image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=80', description: 'Degraded forest area needing restoration' },
  { name: 'Eastern Ghats', region: 'Andhra Pradesh, India', lat: 17.0, lon: 82.0, image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=600&q=80', description: 'Tropical dry deciduous forest zone' },
  { name: 'Sundarbans', region: 'West Bengal, India', lat: 21.9, lon: 89.2, image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&q=80', description: 'Mangrove forest ecosystem' },
];

const STEPS = ['Select Region', 'Satellite Analysis', 'Soil & Climate', 'Species Matching'];

const SPECIES_IMAGES: Record<string, string> = {
  'Teak': 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=400',
  'Neem': 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=400',
  'Sal': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
  'Bamboo': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
  'Sandalwood': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
};

function getDemoData(location: typeof LOCATIONS[0]): SiteData {
  return {
    location: { lat: location.lat, lon: location.lon, name: location.name },
    satellite: { ndvi: 0.45, landCover: 'Degraded Forest', degradationLevel: 'Medium', priority: 'high' },
    soil: { ph: 6.5, nitrogen: 'medium', phosphorus: 'low', moisture: 60, texture: 'Loamy' },
    climate: { rainfall: 1200, temperature: 24, seasonality: 'Monsoon' },
    species: [
      { name: 'Teak', scientificName: 'Tectona grandis', survivalProbability: 88, reason: 'Optimal for pH 6.5 and 24°C. High-value timber species.', careRequirements: ['Moderate watering', 'Full sunlight', 'Well-drained soil'], imageUrl: SPECIES_IMAGES['Teak'] },
      { name: 'Neem', scientificName: 'Azadirachta indica', survivalProbability: 92, reason: 'Excellent drought tolerance. Thrives in pH 6.5 soil.', careRequirements: ['Low watering', 'Full sunlight', 'Drought resistant'], imageUrl: SPECIES_IMAGES['Neem'] },
      { name: 'Bamboo', scientificName: 'Bambusa bambos', survivalProbability: 95, reason: 'Fast-growing. Prevents erosion. Perfect for pH 6.5.', careRequirements: ['High watering', 'Full sunlight', 'Fast growth'], imageUrl: SPECIES_IMAGES['Bamboo'] },
    ],
    suitabilityScore: 75,
  };
}

const SiteAnalysisComplete = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<typeof LOCATIONS[0] | null>(null);
  const [data, setData] = useState<SiteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [showSave, setShowSave] = useState(false);
  const [saved, setSaved] = useState(false);

  const runAnalysis = async () => {
    if (!selected) return;
    setLoading(true);
    setStep(1);
    try {
      await new Promise(r => setTimeout(r, 1200));
      setStep(2);
      await new Promise(r => setTimeout(r, 1200));
      setStep(3);
      await new Promise(r => setTimeout(r, 1200));
      const raw = await siteAPI.analyze({ lat: selected.lat, lng: selected.lon, name: selected.name, hectares: 1000 });
      const res = (raw as any)?.data ?? raw;
      const d: SiteData = {
        location: { lat: selected.lat, lon: selected.lon, name: selected.name },
        satellite: {
          ndvi: res.vegetation?.ndvi || 0.45,
          landCover: (res.vegetation?.coverage || 0) > 60 ? 'Dense Forest' : (res.vegetation?.coverage || 0) > 35 ? 'Moderate Forest' : 'Degraded Land',
          degradationLevel: (res.vegetation?.healthScore || 0) < 40 ? 'High' : (res.vegetation?.healthScore || 0) < 65 ? 'Medium' : 'Low',
          priority: (res.landScore || 0) > 70 ? 'high' : (res.landScore || 0) > 50 ? 'medium' : 'low'
        },
        soil: {
          ph: res.soil?.ph || 6.5,
          nitrogen: res.soil?.nitrogen || 'medium',
          phosphorus: res.soil?.phosphorus || 'low',
          moisture: res.soil?.moisture || 60,
          texture: res.soil?.texture || 'Loam'
        },
        climate: {
          rainfall: (() => {
            // Derive annual rainfall estimate from precipitation + humidity
            const precip = res.weather?.current?.precipitation || 0;
            const humidity = res.weather?.current?.humidity || 60;
            // precip is hourly mm; scale to annual using humidity as proxy
            if (precip > 0) return Math.round(precip * 24 * 120); // ~120 rainy days
            // fallback: humidity-based estimate
            if (humidity > 80) return Math.round(1800 + (humidity - 80) * 30);
            if (humidity > 65) return Math.round(900 + (humidity - 65) * 60);
            if (humidity > 50) return Math.round(400 + (humidity - 50) * 33);
            return 300;
          })(),
          temperature: res.weather?.current?.temp || 24,
          seasonality: (() => {
            const temp = res.weather?.current?.temp || 24;
            const humidity = res.weather?.current?.humidity || 60;
            const lat = selected.lat;
            if (Math.abs(lat) < 10 && humidity > 78) return 'Equatorial';
            if (Math.abs(lat) < 23.5 && humidity > 70) return 'Monsoon';
            if (Math.abs(lat) < 23.5 && humidity < 45) return 'Arid';
            if (Math.abs(lat) < 35 && temp > 28) return 'Tropical Dry';
            if (Math.abs(lat) > 35) return 'Temperate';
            return 'Sub-tropical';
          })()
        },
        species: (res.recommendedSpecies?.slice(0, 3) || []).map((s: any) => ({ name: s.name, scientificName: s.scientificName, survivalProbability: s.survivalProbability, reason: s.reason, careRequirements: s.uses || ['Moderate watering', 'Full sunlight'], imageUrl: SPECIES_IMAGES[s.name] || SPECIES_IMAGES['Teak'] })),
        suitabilityScore: res.landScore || 75,
      };
      if (!d.species.length) d.species = getDemoData(selected).species;
      setData(d);
      setStep(4);
      toast.success('Analysis complete!');
    } catch {
      toast.error('Using demo data.');
      setData(getDemoData(selected));
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  const saveProject = async () => {
    if (!data || !selected || !projectName.trim()) { toast.error('Enter a project name'); return; }
    try {
      setLoading(true);
      const pid = await projectService.createProject({ name: projectName, location: { lat: selected.lat, lon: selected.lon, name: selected.name, region: selected.region }, status: 'planning' });
      await analysisService.saveAnalysis({ projectId: pid, satellite: data.satellite, soil: data.soil, climate: data.climate, suitabilityScore: data.suitabilityScore, recommendedSpecies: data.species, analysisDate: new Date().toISOString() } as any);
      setSaved(true); setShowSave(false);
      toast.success('Project saved!');
    } catch { toast.error('Failed to save.'); } finally { setLoading(false); }
  };

  const priorityColors: Record<string, string> = {
    high: 'rgba(45,180,100,0.12)',
    medium: 'rgba(250,180,50,0.12)',
    low: 'rgba(220,80,80,0.12)',
  };
  const priorityBorder: Record<string, string> = {
    high: 'rgba(45,180,100,0.3)',
    medium: 'rgba(250,180,50,0.3)',
    low: 'rgba(220,80,80,0.3)',
  };

  return (
    <div className="min-h-screen text-foreground" style={{ background: 'hsl(var(--background))' }}>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border" style={{ background: 'var(--header-bg)', backdropFilter: 'blur(20px)' }}>
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.12)', border: '1px solid hsl(var(--primary) / 0.25)' }}>
              <TreePine className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground tracking-wide">HABITAT</p>
              <p className="text-xs text-muted-foreground">Site Analysis</p>
            </div>
          </div>
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-10 max-w-6xl">

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0 mb-12 max-w-2xl mx-auto">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300"
                  style={{
                    background: step > i ? 'hsl(var(--primary))' : step === i ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--muted))',
                    border: step >= i ? '1px solid hsl(var(--primary) / 0.5)' : '1px solid hsl(var(--border))',
                    color: step > i ? 'hsl(var(--primary-foreground))' : step === i ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                  }}>
                  {step > i ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                </div>
                <span className="text-xs mt-2 font-medium" style={{ color: step >= i ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}>{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="h-px flex-1 mx-1 mb-5 transition-all duration-500"
                  style={{ background: step > i ? 'hsl(var(--primary) / 0.5)' : 'hsl(var(--border))' }} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* Step 0 — Select region */}
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-foreground mb-2">Select a <span className="text-primary">Region</span></h2>
                <p className="text-muted-foreground text-sm">Choose a location to analyze for reforestation suitability</p>
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                {LOCATIONS.map(loc => (
                  <motion.div key={loc.name} whileHover={{ scale: 1.02 }} onClick={() => setSelected(loc)}
                    className="relative h-56 rounded-2xl overflow-hidden cursor-pointer transition-all duration-200"
                    style={{
                      backgroundImage: `url(${loc.image})`, backgroundSize: 'cover', backgroundPosition: 'center',
                      border: selected?.name === loc.name ? '2px solid rgba(74,222,128,0.7)' : '2px solid transparent',
                      boxShadow: selected?.name === loc.name ? '0 0 0 1px rgba(74,222,128,0.2), 0 8px 32px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.4)',
                    }}>
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)' }} />
                    <div className="relative h-full p-5 flex flex-col justify-end">
                      <h3 className="text-xl font-bold text-white mb-0.5">{loc.name}</h3>
                      <p className="text-white/70 text-sm mb-1">{loc.region}</p>
                      <p className="text-white/45 text-xs">{loc.description}</p>
                    </div>
                    {selected?.name === loc.name && (
                      <div className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(74,222,128,0.9)' }}>
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
              {selected && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-8 flex justify-center">
                  <button onClick={runAnalysis} disabled={loading}
                    className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, hsl(152,60%,42%), hsl(168,55%,38%))', boxShadow: '0 8px 24px rgba(45,180,100,0.35)' }}>
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <>Start Analysis <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Steps 1-3 — Loading */}
          {step > 0 && step < 4 && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-24 gap-6">
              <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'hsl(var(--primary) / 0.1)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
                <Loader2 className="w-9 h-9 text-primary animate-spin" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-foreground mb-1">{STEPS[step]}</h3>
                <p className="text-muted-foreground text-sm">
                  {step === 1 && 'Fetching satellite imagery and analyzing vegetation...'}
                  {step === 2 && 'Analyzing soil properties and climate patterns...'}
                  {step === 3 && 'Matching optimal native species for your site...'}
                </p>
              </div>
              <div className="flex gap-2 mt-2">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-2 h-2 rounded-full bg-primary/60"
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 4 — Results */}
          {step === 4 && data && (
            <motion.div key="results" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

              {/* Priority banner */}
              <div className="rounded-2xl p-6 flex items-center justify-between"
                style={{ background: priorityColors[data.satellite.priority], border: `1px solid ${priorityBorder[data.satellite.priority]}` }}>
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-1">{data.location.name}</h3>
                  <p className="text-muted-foreground text-sm capitalize">{data.satellite.priority} Priority Restoration Zone</p>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-bold text-foreground">{data.suitabilityScore}</div>
                  <div className="text-xs text-muted-foreground mt-1">Suitability Score</div>
                </div>
              </div>

              {/* Data cards */}
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  {
                    icon: Satellite, label: 'Satellite Analysis', color: 'rgba(100,160,255,0.15)', iconColor: '#7eb8ff',
                    rows: [['NDVI Index', data.satellite.ndvi.toFixed(3)], ['Land Cover', data.satellite.landCover], ['Degradation', data.satellite.degradationLevel]]
                  },
                  {
                    icon: Activity, label: 'Soil Properties', color: 'rgba(200,150,80,0.12)', iconColor: '#f0b060',
                    rows: [['pH Level', data.soil.ph.toFixed(1)], ['Moisture', `${data.soil.moisture}%`], ['Texture', data.soil.texture]]
                  },
                  {
                    icon: Sun, label: 'Climate', color: 'rgba(255,220,80,0.1)', iconColor: '#ffd84d',
                    rows: [['Rainfall', `${data.climate.rainfall} mm`], ['Temperature', `${data.climate.temperature}°C`], ['Pattern', data.climate.seasonality]]
                  },
                ].map(card => (
                  <div key={card.label} className="rounded-2xl p-5" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: card.color }}>
                        <card.icon className="w-4.5 h-4.5" style={{ color: card.iconColor }} size={18} />
                      </div>
                      <span className="font-semibold text-foreground text-sm">{card.label}</span>
                    </div>
                    <div className="space-y-3">
                      {card.rows.map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{k}</span>
                          <span className="text-sm font-semibold text-foreground">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Species */}
              <div className="rounded-2xl p-6" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(45,180,100,0.12)' }}>
                    <Leaf className="w-4.5 h-4.5 text-emerald-400" size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">Recommended Native Species</p>
                    <p className="text-xs text-muted-foreground">Optimized for maximum survival probability</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-5">
                  {data.species.map((sp, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                      className="rounded-xl overflow-hidden transition-all duration-200 hover:scale-[1.02]"
                      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
                      <div className="relative h-36">
                        <img src={sp.imageUrl} alt={sp.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }} />
                        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-bold text-white"
                          style={{ background: 'rgba(45,180,100,0.85)' }}>
                          {sp.survivalProbability}%
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="font-bold text-foreground mb-0.5">{sp.name}</p>
                        <p className="text-xs text-muted-foreground italic mb-3">{sp.scientificName}</p>
                        <div className="rounded-lg p-2.5 mb-3" style={{ background: 'rgba(100,160,255,0.07)', border: '1px solid rgba(100,160,255,0.1)' }}>
                          <div className="flex gap-2">
                            <Info className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                            <p className="text-xs text-muted-foreground leading-relaxed">{sp.reason}</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {sp.careRequirements.map((r, j) => (
                            <div key={j} className="flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full bg-emerald-500" />
                              <span className="text-xs text-muted-foreground">{r}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Species Suitability Map */}
              <SpeciesSuitabilityMap
                lat={data.location.lat}
                lon={data.location.lon}
                locationName={data.location.name}
                species={data.species}
              />

              {/* Actions */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button onClick={() => { setStep(0); setSelected(null); setData(null); setSaved(false); }}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  style={{ border: '1px solid hsl(var(--border))' }}>
                  Analyze Another
                </button>
                {!saved ? (
                  <button onClick={() => setShowSave(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                    style={{ background: 'linear-gradient(135deg, hsl(152,60%,42%), hsl(168,55%,38%))', color: 'hsl(var(--primary-foreground))', boxShadow: '0 6px 20px rgba(45,180,100,0.3)' }}>
                    <Save className="w-4 h-4" /> Save Project
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-emerald-400"
                    style={{ border: '1px solid rgba(45,180,100,0.3)' }}>
                    <CheckCircle2 className="w-4 h-4" /> Saved
                  </div>
                )}
                <button onClick={() => {
                  if (!data) return;
                  const report = {
                    generatedAt: new Date().toISOString(),
                    location: data.location,
                    suitabilityScore: data.suitabilityScore,
                    satellite: data.satellite,
                    soil: data.soil,
                    climate: data.climate,
                    recommendedSpecies: data.species.map(s => ({
                      name: s.name, scientificName: s.scientificName,
                      survivalProbability: s.survivalProbability, reason: s.reason,
                    })),
                  };
                  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `habitat-site-report-${data.location.name.replace(/\s+/g, '-').toLowerCase()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success('Report downloaded');
                }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  style={{ border: '1px solid hsl(var(--border))' }}>
                  <Download className="w-4 h-4" /> Report
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Save dialog */}
      <AnimatePresence>
        {showSave && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowSave(false)}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              className="w-full max-w-md rounded-2xl p-8"
              style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-foreground mb-1">Save Project</h3>
              <p className="text-muted-foreground text-sm mb-6">Name your reforestation project to track it through the lifecycle.</p>
              <label className="block text-xs font-medium text-muted-foreground mb-2">Project Name</label>
              <Input value={projectName} onChange={e => setProjectName(e.target.value)}
                placeholder="e.g., Western Ghats Restoration 2026"
                className="mb-4" />
              <div className="rounded-xl p-4 mb-6 text-sm space-y-1" style={{ background: 'rgba(45,180,100,0.07)', border: '1px solid rgba(45,180,100,0.15)' }}>
                <p className="text-muted-foreground"><span className="text-muted-foreground/60">Location:</span> {selected?.name}</p>
                <p className="text-muted-foreground"><span className="text-muted-foreground/60">Score:</span> {data?.suitabilityScore}/100</p>
                <p className="text-muted-foreground"><span className="text-muted-foreground/60">Species:</span> {data?.species.length} recommended</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowSave(false)} className="flex-1 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors" style={{ border: '1px solid hsl(var(--border))' }}>Cancel</button>
                <button onClick={saveProject} disabled={loading || !projectName.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, hsl(152,60%,42%), hsl(168,55%,38%))', color: 'hsl(var(--primary-foreground))' }}>
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SiteAnalysisComplete;
