import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, AlertTriangle, TrendingUp, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LandHealthSnapshot, calculateLandHealthScore } from '@/data/landHealthHistory';
import { format } from 'date-fns';

interface HealthTimelineProps {
  snapshots: LandHealthSnapshot[];
  className?: string;
}

export const HealthTimeline: React.FC<HealthTimelineProps> = ({
  snapshots,
  className
}) => {
  // Get status icon and color
  const getStatusDisplay = (status: LandHealthSnapshot['status']) => {
    switch (status) {
      case 'improving':
        return {
          icon: CheckCircle2,
          color: 'text-success',
          bgColor: 'bg-success/10',
          borderColor: 'border-success/30',
          label: 'Improving'
        };
      case 'stagnant':
        return {
          icon: Minus,
          color: 'text-warning',
          bgColor: 'bg-warning/10',
          borderColor: 'border-warning/30',
          label: 'Stagnant'
        };
      case 'declining':
        return {
          icon: AlertTriangle,
          color: 'text-destructive',
          bgColor: 'bg-destructive/10',
          borderColor: 'border-destructive/30',
          label: 'Declining'
        };
      default: // baseline
        return {
          icon: TrendingUp,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
          borderColor: 'border-muted-foreground/30',
          label: 'Baseline'
        };
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-foreground mb-1">Health & Growth Timeline</h3>
        <p className="text-sm text-muted-foreground">Tracking restoration progress over time</p>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

        {/* Timeline items */}
        <div className="space-y-6">
          {snapshots.map((snapshot, index) => {
            const statusDisplay = getStatusDisplay(snapshot.status);
            const StatusIcon = statusDisplay.icon;
            const healthScore = calculateLandHealthScore(snapshot);

            return (
              <motion.div
                key={snapshot.date}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative pl-16"
              >
                {/* Timeline node */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.2, type: 'spring' }}
                  className={cn(
                    'absolute left-3 top-3 w-6 h-6 rounded-full flex items-center justify-center border-2',
                    statusDisplay.bgColor,
                    statusDisplay.borderColor
                  )}
                >
                  <StatusIcon className={cn('w-3 h-3', statusDisplay.color)} />
                </motion.div>

                {/* Content card */}
                <div
                  className={cn(
                    'p-4 rounded-xl border',
                    statusDisplay.bgColor,
                    statusDisplay.borderColor
                  )}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className={cn('w-4 h-4', statusDisplay.color)} />
                      <span className={cn('font-semibold', statusDisplay.color)}>
                        {format(new Date(snapshot.date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-foreground">
                        {healthScore.toFixed(1)}
                      </div>
                      <div className="text-xs text-muted-foreground">Health Score</div>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Vegetation</div>
                      <div className="text-sm font-semibold text-foreground">
                        {snapshot.vegetationDensity}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Soil Health</div>
                      <div className="text-sm font-semibold text-foreground">
                        {snapshot.soilHealthIndex}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Moisture</div>
                      <div className="text-sm font-semibold text-foreground">
                        {snapshot.moistureLevel}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Biodiversity</div>
                      <div className="text-sm font-semibold text-foreground">
                        {snapshot.biodiversityScore}%
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                    <span>🌳 {snapshot.treeCount.toLocaleString()} trees</span>
                    <span>📅 {snapshot.avgTreeAgeYears.toFixed(2)} years avg</span>
                  </div>

                  {/* Notes */}
                  <p className="text-xs text-muted-foreground italic leading-relaxed">
                    {snapshot.notes}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HealthTimeline;
