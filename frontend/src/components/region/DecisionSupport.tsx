import { motion } from 'framer-motion';
import { Lightbulb, Droplets, Leaf, TreeDeciduous, Shield, ChevronRight } from 'lucide-react';
import { recommendations, Recommendation } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface DecisionSupportProps {
  regionId: string;
  simulationMode: boolean;
}

const DecisionSupport = ({ regionId, simulationMode }: DecisionSupportProps) => {
  const getCategoryIcon = (category: Recommendation['category']) => {
    switch (category) {
      case 'irrigation': return Droplets;
      case 'soil': return Leaf;
      case 'species': return TreeDeciduous;
      case 'protection': return Shield;
    }
  };

  const getCategoryColor = (category: Recommendation['category']) => {
    switch (category) {
      case 'irrigation': return 'bg-chart-blue/10 text-chart-blue';
      case 'soil': return 'bg-chart-earth/10 text-chart-earth';
      case 'species': return 'bg-primary/10 text-primary';
      case 'protection': return 'bg-warning/10 text-warning';
    }
  };

  // Filter or prioritize recommendations based on simulation mode
  const displayedRecommendations = simulationMode
    ? recommendations.filter((r) => r.category === 'irrigation' || r.category === 'species')
    : recommendations.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-warning" />
        <h3 className="font-semibold text-foreground">Decision Support</h3>
      </div>

      <div className="space-y-3">
        {displayedRecommendations.map((rec, index) => {
          const Icon = getCategoryIcon(rec.category);
          return (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 + index * 0.1 }}
              className="group p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-all cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  getCategoryColor(rec.category)
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground text-sm">{rec.action}</h4>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{rec.reason}</p>
                  
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Expected Impact</p>
                      <p className="text-xs font-medium text-foreground">{rec.impact}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Confidence</p>
                      <div className="flex items-center gap-1">
                        <div className="w-12 h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full bg-success rounded-full"
                            style={{ width: `${rec.confidence}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-foreground">{rec.confidence}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default DecisionSupport;
