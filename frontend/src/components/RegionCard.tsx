import { motion } from 'framer-motion';
import { MapPin, ArrowUpRight } from 'lucide-react';
import { Region, countryFlags } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface RegionCardProps {
  region: Region;
  isSelected: boolean;
  onSelect: (region: Region) => void;
}

const healthColor = (score: number) =>
  score >= 75 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444';

const RegionCard = ({ region, isSelected, onSelect }: RegionCardProps) => {
  const veg = region.survivalRate || 75;
  const risk = region.risks?.length > 0 ? (region.risks[0].severity === 'high' ? 20 : region.risks[0].severity === 'medium' ? 55 : 85) : 85;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      onClick={() => onSelect(region)}
      className={cn(
        'relative overflow-hidden rounded-xl cursor-pointer group transition-all duration-300',
        isSelected ? 'ring-1 ring-primary/60' : ''
      )}
      style={{
        background: isSelected
          ? 'rgba(45,180,100,0.08)'
          : 'rgba(18,28,22,0.5)',
        border: isSelected
          ? '1px solid rgba(45,180,100,0.3)'
          : '1px solid rgba(255,255,255,0.05)',
        boxShadow: isSelected ? '0 0 20px rgba(45,180,100,0.1)' : 'none',
      }}
    >
      {/* Image strip */}
      <div className="relative h-28 overflow-hidden">
        <img
          src={region.imageUrl}
          alt={region.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Country badge */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-1 rounded-lg"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}>
          <span className="text-base leading-none">{countryFlags[region.countryCode]}</span>
          <span className="text-white/80 text-xs font-medium">{region.country}</span>
        </div>

        {/* Health dots */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
          {[veg, risk].map((score, i) => (
            <div key={i} className="w-2 h-2 rounded-full ring-1 ring-black/30"
              style={{ background: healthColor(score) }} />
          ))}
        </div>

        {/* Suitability score */}
        <div className="absolute bottom-2 right-2.5 text-xs font-bold text-white/90">
          {region.suitabilityScore}
          <span className="text-white/50 font-normal">/100</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-sm font-semibold text-foreground leading-tight">{region.name}</h3>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-2.5 h-2.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{region.continent}</span>
            </div>
          </div>
          <ArrowUpRight className={cn(
            'w-3.5 h-3.5 mt-0.5 transition-all duration-200',
            isSelected ? 'text-primary' : 'text-muted-foreground/40 group-hover:text-muted-foreground'
          )} />
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="text-foreground/70 font-medium">{region.plots} plots</span>
          <span className="w-px h-3 bg-border" />
          <span>{region.hectares.toLocaleString()} ha</span>
          <span className="w-px h-3 bg-border" />
          <span className="text-primary font-medium">{region.survivalRate}%</span>
        </div>
      </div>
    </motion.div>
  );
};

export default RegionCard;
