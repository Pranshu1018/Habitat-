import { motion } from 'framer-motion';
import { AlertTriangle, CloudRain, Thermometer, Bug, Waves, Calendar } from 'lucide-react';
import { Risk } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface RiskAlertsProps {
  risks: Risk[];
  simulationMode: boolean;
}

const RiskAlerts = ({ risks, simulationMode }: RiskAlertsProps) => {
  const getRiskIcon = (type: Risk['type']) => {
    switch (type) {
      case 'drought': return CloudRain;
      case 'heat': return Thermometer;
      case 'pest': return Bug;
      case 'flood': return Waves;
    }
  };

  const getSeverityStyle = (severity: Risk['severity']) => {
    switch (severity) {
      case 'high': return 'bg-destructive/10 border-destructive/30 text-destructive';
      case 'medium': return 'bg-warning/10 border-warning/30 text-warning';
      case 'low': return 'bg-primary/10 border-primary/30 text-primary';
    }
  };

  // Add simulation risks if simulation mode is active
  const displayedRisks = simulationMode
    ? [
        ...risks,
        {
          id: 'sim-drought',
          type: 'drought' as const,
          probability: 75,
          severity: 'high' as const,
          expectedDate: '2024-02',
          description: 'SIMULATED: Severe drought conditions triggered',
        },
      ]
    : risks;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-warning" />
        <h3 className="font-semibold text-foreground">Risk Alerts</h3>
        {simulationMode && (
          <span className="px-2 py-0.5 text-xs bg-warning/20 text-warning rounded-md">
            Simulation Active
          </span>
        )}
      </div>

      {displayedRisks.length === 0 ? (
        <div className="p-4 rounded-xl bg-success/10 text-success text-sm">
          No significant risks detected for this region.
        </div>
      ) : (
        <div className="space-y-3">
          {displayedRisks.map((risk, index) => {
            const Icon = getRiskIcon(risk.type);
            return (
              <motion.div
                key={risk.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + index * 0.1 }}
                className={cn(
                  "p-4 rounded-xl border",
                  getSeverityStyle(risk.severity)
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-current/10">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium capitalize">{risk.type} Risk</h4>
                      <span className="text-sm font-semibold">{risk.probability}%</span>
                    </div>
                    <p className="text-xs opacity-80 mt-1">{risk.description}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs opacity-60">
                      <Calendar className="w-3 h-3" />
                      <span>Expected: {risk.expectedDate}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default RiskAlerts;
