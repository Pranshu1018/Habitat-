import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Droplets, TrendingUp, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import AnimatedNumber from './AnimatedNumber';
import { LandHealthComponents, analyzeLandHealth } from '@/services/landHealthCalculator';
import { getMoistureMetrics, fetchWeatherData } from '@/services/weatherApi';

interface LandHealthVaultProps {
  components: LandHealthComponents;
  className?: string;
}

export const LandHealthVault: React.FC<LandHealthVaultProps> = ({
  components,
  className
}) => {
  const [liveMoisture, setLiveMoisture] = useState<number | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  // Analyze land health
  const healthAnalysis = analyzeLandHealth(components);
  const { overallScore, grade, trend } = healthAnalysis;

  // Fetch live weather data on mount
  useEffect(() => {
    const fetchLiveWeather = async () => {
      setIsLoadingWeather(true);
      try {
        const lat = parseFloat(import.meta.env.VITE_DEMO_LAT || '19.07');
        const lon = parseFloat(import.meta.env.VITE_DEMO_LON || '72.87');
        const weatherData = await fetchWeatherData(lat, lon, 7);
        const metrics = getMoistureMetrics(weatherData);
        setLiveMoisture(metrics.moistureIndex);
      } catch (error) {
        console.error('Failed to fetch live weather:', error);
        setLiveMoisture(components.moistureLevel); // Fallback to provided value
      } finally {
        setIsLoadingWeather(false);
      }
    };

    fetchLiveWeather();
  }, [components.moistureLevel]);

  // Use live moisture if available, otherwise use provided value
  const displayMoisture = liveMoisture !== null ? liveMoisture : components.moistureLevel;

  // Get grade color
  const getGradeColor = () => {
    switch (grade) {
      case 'Excellent': return 'text-success';
      case 'Good': return 'text-primary';
      case 'Fair': return 'text-warning';
      case 'Poor': return 'text-destructive';
      case 'Critical': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  // Get trend icon and color
  const getTrendDisplay = () => {
    switch (trend) {
      case 'improving':
        return { icon: TrendingUp, color: 'text-success', label: 'Improving' };
      case 'declining':
        return { icon: TrendingUp, color: 'text-destructive rotate-180', label: 'Declining' };
      default:
        return { icon: Activity, color: 'text-warning', label: 'Stable' };
    }
  };

  const trendDisplay = getTrendDisplay();
  const TrendIcon = trendDisplay.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={cn(
        'glass-card rounded-3xl p-8 relative overflow-hidden',
        className
      )}
    >
      {/* Animated glow effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 opacity-0"
        animate={{
          opacity: [0, 0.3, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">Living Land Vault</h2>
            <p className="text-sm text-muted-foreground">Real-time ecosystem health monitoring</p>
          </div>

          {/* Trend Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full',
              trend === 'improving' ? 'bg-success/10' :
              trend === 'declining' ? 'bg-destructive/10' : 'bg-warning/10'
            )}
          >
            <TrendIcon className={cn('w-4 h-4', trendDisplay.color)} />
            <span className={cn('text-sm font-medium', trendDisplay.color)}>
              {trendDisplay.label}
            </span>
          </motion.div>
        </div>

        {/* Main Score */}
        <div className="mb-8">
          <div className="flex items-baseline gap-3 mb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="relative"
            >
              <AnimatedNumber
                value={overallScore}
                decimals={1}
                className="text-6xl font-bold text-gradient"
              />
              <motion.div
                className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl -z-10"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />
            </motion.div>
            <div>
              <div className="text-2xl text-muted-foreground">/100</div>
              <div className={cn('text-sm font-semibold', getGradeColor())}>{grade}</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Overall Land Health Score</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Vegetation Density */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="p-4 rounded-xl bg-primary/5 border border-primary/10"
          >
            <div className="flex items-center gap-2 mb-2">
              <Leaf className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Vegetation</span>
            </div>
            <AnimatedNumber
              value={components.vegetationDensity}
              decimals={0}
              suffix="%"
              className="text-2xl font-bold text-foreground"
            />
          </motion.div>

          {/* Soil Health */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="p-4 rounded-xl bg-accent/5 border border-accent/10"
          >
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-accent" />
              <span className="text-xs font-medium text-muted-foreground">Soil Health</span>
            </div>
            <AnimatedNumber
              value={components.soilHealthIndex}
              decimals={0}
              suffix="%"
              className="text-2xl font-bold text-foreground"
            />
          </motion.div>

          {/* Moisture Level */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 relative"
          >
            <div className="flex items-center gap-2 mb-2">
              <Droplets className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium text-muted-foreground">Moisture</span>
              {liveMoisture !== null && (
                <span className="ml-auto px-1.5 py-0.5 text-[10px] font-semibold bg-blue-500/20 text-blue-600 rounded">
                  LIVE
                </span>
              )}
            </div>
            <AnimatedNumber
              value={displayMoisture}
              decimals={0}
              suffix="%"
              className="text-2xl font-bold text-foreground"
            />
            {isLoadingWeather && (
              <div className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </motion.div>

          {/* Biodiversity */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="p-4 rounded-xl bg-success/5 border border-success/10"
          >
            <div className="flex items-center gap-2 mb-2">
              <Leaf className="w-4 h-4 text-success" />
              <span className="text-xs font-medium text-muted-foreground">Biodiversity</span>
            </div>
            <AnimatedNumber
              value={components.biodiversityScore}
              decimals={0}
              suffix="%"
              className="text-2xl font-bold text-foreground"
            />
          </motion.div>
        </div>

        {/* Live Data Indicator */}
        {liveMoisture !== null && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-4 text-xs text-muted-foreground text-center"
          >
            🌐 Live weather data from Open-Meteo API dynamically influences soil moisture metrics
          </motion.p>
        )}
      </div>
    </motion.div>
  );
};

export default LandHealthVault;
