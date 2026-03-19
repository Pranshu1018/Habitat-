import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calculator, Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';
import AnimatedNumber from './AnimatedNumber';
import {
  calculateCarbonSequestration,
  calculateCarbonImprovement,
  CarbonCalculationInput
} from '@/services/carbonAdjustmentCalculator';

interface CarbonImpactCardProps {
  input: CarbonCalculationInput;
  baselineHealth?: number;
  className?: string;
}

export const CarbonImpactCard: React.FC<CarbonImpactCardProps> = ({
  input,
  baselineHealth = 50,
  className
}) => {
  const carbonResult = calculateCarbonSequestration(input);
  const improvement = calculateCarbonImprovement(
    baselineHealth,
    input.landHealthScore,
    carbonResult.baseCarbon
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className={cn('glass-card rounded-3xl p-6', className)}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Calculator className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">Carbon Impact Adjustment</h3>
          <p className="text-sm text-muted-foreground">Health-adjusted sequestration</p>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="space-y-4 mb-6">
        {/* Base Carbon */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Base Carbon Potential</span>
            <Leaf className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex items-baseline gap-2">
            <AnimatedNumber
              value={carbonResult.baseCarbon}
              decimals={1}
              className="text-3xl font-bold text-foreground"
            />
            <span className="text-sm text-muted-foreground">tC</span>
          </div>
        </div>

        {/* Adjusted Carbon */}
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: 'spring' }}
          className="p-4 rounded-xl bg-primary/10 border border-primary/30 relative overflow-hidden"
        >
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20"
            animate={{
              opacity: [0, 0.3, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-primary">Health-Adjusted Carbon</span>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/20 text-success text-xs font-semibold">
                <TrendingUp className="w-3 h-3" />
                +{improvement.improvementPercent}%
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <AnimatedNumber
                value={carbonResult.adjustedCarbon}
                decimals={1}
                className="text-4xl font-bold text-primary"
              />
              <span className="text-sm text-primary/70">tC</span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              ≈ <AnimatedNumber value={carbonResult.co2Equivalent} decimals={1} /> tCO₂e
            </div>
          </div>
        </motion.div>

        {/* Improvement Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-success/5 border border-success/20">
            <div className="text-xs text-muted-foreground mb-1">Baseline Carbon</div>
            <div className="text-lg font-bold text-foreground">{improvement.baselineCarbon} tC</div>
          </div>
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="text-xs text-muted-foreground mb-1">Improvement</div>
            <div className="text-lg font-bold text-success">+{improvement.improvement} tC</div>
          </div>
        </div>
      </div>

      {/* Formulas Section */}
      <div className="space-y-3 pt-4 border-t border-border">
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Calculation Formulas</span>
        </div>

        {/* Base Carbon Formula */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="p-3 rounded-lg bg-muted/20 font-mono text-xs"
        >
          <div className="text-muted-foreground mb-1">Base Carbon:</div>
          <div className="text-foreground leading-relaxed">{carbonResult.formulas.base}</div>
        </motion.div>

        {/* Adjustment Formula */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="p-3 rounded-lg bg-primary/5 font-mono text-xs"
        >
          <div className="text-muted-foreground mb-1">Health Adjustment:</div>
          <div className="text-foreground leading-relaxed">{carbonResult.formulas.adjustment}</div>
        </motion.div>

        {/* CO2 Conversion Formula */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="p-3 rounded-lg bg-muted/20 font-mono text-xs"
        >
          <div className="text-muted-foreground mb-1">CO₂ Equivalent:</div>
          <div className="text-foreground leading-relaxed">{carbonResult.formulas.co2Conversion}</div>
        </motion.div>
      </div>

      {/* Explanation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-4 p-3 rounded-lg bg-accent/5 border border-accent/20"
      >
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-accent">Why it matters:</span>{' '}
          Healthier ecosystems sequester carbon more efficiently. Land health score
          ({input.landHealthScore}%) acts as a multiplier, reflecting improved soil
          quality, vegetation density, and ecosystem function.
        </p>
      </motion.div>
    </motion.div>
  );
};

export default CarbonImpactCard;
