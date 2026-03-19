import { useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import Lottie from 'lottie-react';
import treeAnimation from '@/assets/treeAnimation';
import forestAnimation from '@/assets/forestAnimation.json';
import {
  TreeDeciduous, Leaf, TrendingUp, Shield, Globe, Zap,
  ArrowRight, Sparkles, Activity, ChevronDown
} from 'lucide-react';
import { motion } from 'framer-motion';

const stats = [
  { value: '304,500', label: 'Tonnes CO₂', sub: 'Sequestered' },
  { value: '78,370', label: 'Hectares', sub: 'Monitored' },
  { value: '12,847', label: 'Farmers', sub: 'Supported' },
  { value: '93%', label: 'Survival', sub: 'Rate avg.' },
];

const features = [
  { icon: Globe, title: 'Global Coverage', desc: 'Monitor projects across continents with real-time satellite data' },
  { icon: Leaf, title: 'Species Matching', desc: 'AI-powered recommendations for optimal native species selection' },
  { icon: TrendingUp, title: 'Carbon Tracking', desc: 'Accurate sequestration calculations with 20-year projections' },
  { icon: Shield, title: 'Risk Prediction', desc: 'Early warning system for drought, pests, and threats' },
  { icon: Zap, title: 'Real-time Analytics', desc: 'Live data from weather, soil, and satellite sources' },
  { icon: Sparkles, title: 'Simulation Mode', desc: 'Test scenarios and adaptive management strategies' },
];

const Landing = () => {
  const navigate = useNavigate();
  const [sliderPosition, setSliderPosition] = useState(50);
  const sliderRef = useRef<HTMLDivElement>(null);
  const forestRef = useRef<HTMLDivElement>(null);

  const handleSliderMouseDown = (e: React.MouseEvent) => {
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const rect = sliderRef.current?.getBoundingClientRect();
      if (rect) {
        const x = moveEvent.clientX - rect.left;
        setSliderPosition(Math.max(5, Math.min(95, (x / rect.width) * 100)));
      }
    };
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ── HERO ── */}
      <section ref={sliderRef} className="relative h-screen overflow-hidden select-none">
        {/* Before */}
        <div className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1603997330052-02c10f245c7a?q=80&w=1170&auto=format&fit=crop)',
            clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`
          }}>
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
          <div className="absolute left-8 bottom-1/3 text-white">
            <span className="inline-block px-3 py-1 bg-red-500/90 backdrop-blur-sm rounded-full text-xs font-bold tracking-widest mb-3">BEFORE</span>
            <p className="text-2xl font-bold drop-shadow-xl">Degraded Land</p>
          </div>
        </div>

        {/* After */}
        <div className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1603612692333-7bac35e43500?q=80&w=1332&auto=format&fit=crop)',
            clipPath: `inset(0 0 0 ${sliderPosition}%)`
          }}>
          <div className="absolute inset-0 bg-gradient-to-l from-black/60 to-transparent" />
          <div className="absolute right-8 bottom-1/3 text-white text-right">
            <span className="inline-block px-3 py-1 bg-emerald-500/90 backdrop-blur-sm rounded-full text-xs font-bold tracking-widest mb-3">AFTER</span>
            <p className="text-2xl font-bold drop-shadow-xl">Thriving Forest</p>
          </div>
        </div>

        {/* Slider handle */}
        <div
          className="absolute inset-y-0 z-10 flex items-center justify-center cursor-ew-resize"
          style={{ left: `calc(${sliderPosition}% - 20px)`, width: 40 }}
          onMouseDown={handleSliderMouseDown}
        >
          <div className="w-0.5 h-full bg-white/30" />
          <div className="absolute w-10 h-10 rounded-full bg-white/90 shadow-2xl flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M5 8H11M5 8L3 6M5 8L3 10M11 8L13 6M11 8L13 10" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* Center overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center max-w-3xl px-4 pointer-events-auto"
          >
            <div className="rounded-3xl p-8 md:p-12"
              style={{
                background: 'rgba(8, 16, 12, 0.72)',
                backdropFilter: 'blur(32px)',
                WebkitBackdropFilter: 'blur(32px)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
              }}>

              {/* Tree animation — small, tasteful, top-center of card */}
              <div className="flex justify-center mb-2 -mt-2">
                <div className="w-20 h-20 opacity-90">
                  <Lottie animationData={treeAnimation} loop={false} />
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
                style={{ background: 'rgba(45,180,100,0.12)', border: '1px solid rgba(45,180,100,0.25)' }}>
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-medium text-emerald-300">Powered by Real-Time AI & Satellite Data</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white leading-tight">
                Transform Degraded Land<br />
                <span className="bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
                  Into Thriving Forests
                </span>
              </h1>

              <p className="text-base text-white/70 mb-8 max-w-xl mx-auto leading-relaxed">
                Adaptive reforestation platform with intelligent monitoring,
                predictive analytics, and data-driven care strategies.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => navigate('/site-analysis')}
                  className="group flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, hsl(152,60%,42%) 0%, hsl(168,55%,38%) 100%)', boxShadow: '0 8px 24px rgba(45,180,100,0.35)' }}
                >
                  Start Site Analysis
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-white/80 transition-all duration-200 hover:bg-white/10"
                  style={{ border: '1px solid rgba(255,255,255,0.15)' }}
                >
                  View Dashboard
                </button>
                <button
                  onClick={() => navigate('/land-health')}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-emerald-300 transition-all duration-200 hover:bg-emerald-500/10"
                  style={{ border: '1px solid rgba(45,180,100,0.25)' }}
                >
                  <Activity className="w-4 h-4" />
                  Land Health
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40"
        >
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </motion.div>
      </section>

      {/* ── FOREST ANIMATION SCENE ── */}
      <section ref={forestRef} className="bg-background">
        {/* Text above */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center pt-20 pb-10 px-6"
        >
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3 text-primary">
            Ecosystem Intelligence
          </p>
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-4 leading-tight">
            Every Forest Tells<br />
            <span className="bg-gradient-to-r from-emerald-500 to-green-400 bg-clip-text text-transparent">
              a Data Story
            </span>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">
            Real-time satellite imagery, soil intelligence, and climate modeling
            converge to guide every planting decision.
          </p>
        </motion.div>

        {/* Animation — natural aspect ratio, full width, no cropping */}
        <div className="w-full" style={{ aspectRatio: '750 / 500' }}>
          <Lottie
            animationData={forestAnimation}
            loop={true}
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        {/* Bottom fade */}
        <div className="h-16 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, hsl(var(--background)))' }} />
      </section>

      {/* ── STATS ── */}
      <section className="py-16 border-y border-border" style={{ background: 'hsl(var(--card))' }}>
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">{s.value}</div>
                <div className="text-sm font-medium text-foreground/80">{s.label}</div>
                <div className="text-xs text-muted-foreground">{s.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-foreground">Intelligent Forest Management</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Comprehensive tools for every stage of the reforestation lifecycle</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group p-6 rounded-2xl transition-all duration-300 cursor-default border border-border hover:border-primary/30"
                style={{ background: 'hsl(var(--card))' }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: 'hsl(var(--primary) / 0.1)' }}>
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold mb-2 text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24" style={{ background: 'hsl(var(--card))' }}>
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 text-foreground">How It Works</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">From planning to long-term management in three steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '01', title: 'Site Analysis', desc: 'Analyze terrain, soil, and climate using satellite data and AI to identify optimal planting zones' },
              { step: '02', title: 'Species Selection', desc: 'Get native species recommendations optimized for survival probability and carbon sequestration' },
              { step: '03', title: 'Adaptive Management', desc: 'Monitor health, predict risks, and receive actionable guidance for long-term forest resilience' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative"
              >
                <div className="text-5xl font-bold mb-4 text-primary/20">{item.step}</div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                {i < 2 && <div className="hidden md:block absolute top-10 -right-4 w-8 h-px bg-primary/20" />}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center p-12 rounded-3xl border border-primary/15"
            style={{ background: 'hsl(var(--primary) / 0.05)' }}
          >
            <TreeDeciduous className="w-12 h-12 mx-auto mb-6 text-primary" />
            <h2 className="text-3xl font-bold mb-3 text-foreground">Ready to Transform Reforestation?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Join the movement towards data-driven, adaptive forest management.
            </p>
            <button
              onClick={() => navigate('/site-analysis')}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105"
              style={{ background: 'linear-gradient(135deg, hsl(152,60%,42%) 0%, hsl(168,55%,38%) 100%)', boxShadow: '0 8px 24px rgba(45,180,100,0.3)' }}
            >
              Start Site Analysis <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TreeDeciduous className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Habitat</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Habitat Platform. Built for global reforestation.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
