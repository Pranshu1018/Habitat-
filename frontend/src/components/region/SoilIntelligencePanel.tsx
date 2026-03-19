import { motion } from 'framer-motion';
import { Droplets, Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SoilData {
  ph: number;
  nitrogen: 'low' | 'medium' | 'high';
  phosphorus: 'low' | 'medium' | 'high';
  potassium: 'low' | 'medium' | 'high';
  moisture: number;
}

interface SoilIntelligencePanelProps {
  soil: SoilData;
}

const SoilIntelligencePanel = ({ soil }: SoilIntelligencePanelProps) => {
  const getNutrientColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'high': return 'bg-success text-success-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      case 'low': return 'bg-destructive text-destructive-foreground';
    }
  };

  const getPhLabel = (ph: number) => {
    if (ph < 5.5) return 'Acidic';
    if (ph < 6.5) return 'Slightly Acidic';
    if (ph < 7.5) return 'Neutral';
    return 'Alkaline';
  };

  const getPhPosition = (ph: number) => {
    // pH scale from 4 to 9
    return ((ph - 4) / 5) * 100;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <Leaf className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground">Soil Intelligence</h3>
      </div>

      {/* pH Level Gauge */}
      <div className="p-4 rounded-xl bg-secondary/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">pH Level</span>
          <span className="text-sm font-medium">{soil.ph} - {getPhLabel(soil.ph)}</span>
        </div>
        <div className="relative h-3 rounded-full bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 to-blue-400 overflow-hidden">
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-5 bg-white border-2 border-foreground rounded-sm shadow-lg"
            style={{ left: `${getPhPosition(soil.ph)}%`, transform: 'translate(-50%, -50%)' }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Acidic</span>
          <span>Neutral</span>
          <span>Alkaline</span>
        </div>
      </div>

      {/* Nutrient Status */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Nitrogen (N)', value: soil.nitrogen },
          { label: 'Phosphorus (P)', value: soil.phosphorus },
          { label: 'Potassium (K)', value: soil.potassium },
        ].map((nutrient) => (
          <div key={nutrient.label} className="p-3 rounded-xl bg-secondary/30 text-center">
            <p className="text-xs text-muted-foreground mb-2">{nutrient.label}</p>
            <span className={cn(
              "px-2 py-1 rounded-md text-xs font-medium capitalize",
              getNutrientColor(nutrient.value)
            )}>
              {nutrient.value}
            </span>
          </div>
        ))}
      </div>

      {/* Moisture Meter */}
      <div className="p-4 rounded-xl bg-secondary/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-chart-blue" />
            <span className="text-sm text-muted-foreground">Soil Moisture</span>
          </div>
          <span className="text-sm font-medium">{soil.moisture}%</span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${soil.moisture}%` }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="h-full bg-gradient-to-r from-chart-blue to-primary rounded-full"
          />
        </div>
      </div>
    </motion.div>
  );
};

export default SoilIntelligencePanel;
