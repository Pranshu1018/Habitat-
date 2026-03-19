import { motion } from 'framer-motion';
import { TreeDeciduous, Check } from 'lucide-react';
import { Species } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface SpeciesRecommendationsProps {
  species: Species[];
}

const SpeciesRecommendations = ({ species }: SpeciesRecommendationsProps) => {
  const getSurvivalColor = (probability: number) => {
    if (probability >= 90) return 'text-success';
    if (probability >= 80) return 'text-primary';
    if (probability >= 70) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <TreeDeciduous className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground">Recommended Species</h3>
      </div>

      <div className="space-y-3">
        {species.map((s, index) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + index * 0.1 }}
            className="flex gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
          >
            {/* Species Image */}
            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={s.imageUrl}
                alt={s.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Species Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-foreground">{s.name}</h4>
                  <p className="text-xs text-muted-foreground italic">{s.scientificName}</p>
                </div>
                <div className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-lg bg-success/10",
                  getSurvivalColor(s.survivalProbability)
                )}>
                  <Check className="w-3 h-3" />
                  <span className="text-xs font-medium">{s.survivalProbability}%</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{s.reason}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default SpeciesRecommendations;
