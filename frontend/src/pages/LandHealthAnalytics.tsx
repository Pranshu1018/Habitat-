import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LandHealthVault from '@/components/analytics/LandHealthVault';
import HealthTimeline from '@/components/analytics/HealthTimeline';
import CarbonImpactCard from '@/components/analytics/CarbonImpactCard';
import DataTransparency from '@/components/analytics/DataTransparency';
import { LAND_HEALTH_HISTORY, getLatestSnapshot } from '@/data/landHealthHistory';
import { LandHealthComponents } from '@/services/landHealthCalculator';

/**
 * Land Health Analytics Page
 * 
 * Continuous health and growth analytics with:
 * - Live weather data integration (Open-Meteo)
 * - Scientific datasets (FAO, ISRIC, IPCC)
 * - Transparent carbon calculations
 * - Timeline-based storytelling
 */
const LandHealthAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const latestSnapshot = getLatestSnapshot();

  // Current land health components
  const currentHealth: LandHealthComponents = {
    vegetationDensity: latestSnapshot.vegetationDensity,
    soilHealthIndex: latestSnapshot.soilHealthIndex,
    moistureLevel: latestSnapshot.moistureLevel,
    biodiversityScore: latestSnapshot.biodiversityScore
  };

  // Carbon calculation input
  const carbonInput = {
    treeCount: latestSnapshot.treeCount,
    avgTreeAgeYears: latestSnapshot.avgTreeAgeYears,
    forestType: 'tropical_moist' as const,
    hectares: 45.2, // Demo hectares
    landHealthScore: Math.round(
      0.35 * currentHealth.vegetationDensity +
      0.30 * currentHealth.soilHealthIndex +
      0.20 * currentHealth.moistureLevel +
      0.15 * currentHealth.biodiversityScore
    )
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Simple Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back to Home</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">HABITAT Analytics</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gradient mb-1">
                Continuous Land Health & Growth Analytics
              </h1>
              <p className="text-muted-foreground">
                Track restoration progress with real-time environmental data and scientific carbon calculations
              </p>
            </div>
          </div>
        </motion.div>

        {/* Living Land Vault - Full Width */}
        <div className="mb-8">
          <LandHealthVault components={currentHealth} />
        </div>

        {/* Timeline & Carbon Impact - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
          {/* Health Timeline - 60% width on large screens */}
          <div className="lg:col-span-3">
            <div className="glass-card rounded-3xl p-6 h-full">
              <HealthTimeline snapshots={LAND_HEALTH_HISTORY} />
            </div>
          </div>

          {/* Carbon Impact - 40% width on large screens */}
          <div className="lg:col-span-2">
            <CarbonImpactCard
              input={carbonInput}
              baselineHealth={
                LAND_HEALTH_HISTORY[0]
                  ? Math.round(
                      0.35 * LAND_HEALTH_HISTORY[0].vegetationDensity +
                      0.30 * LAND_HEALTH_HISTORY[0].soilHealthIndex +
                      0.20 * LAND_HEALTH_HISTORY[0].moistureLevel +
                      0.15 * LAND_HEALTH_HISTORY[0].biodiversityScore
                    )
                  : 50
              }
            />
          </div>
        </div>

        {/* Data Transparency - Full Width */}
        <div className="mb-8">
          <DataTransparency />
        </div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-center py-6"
        >
          <p className="text-sm text-muted-foreground">
            Built with scientific rigor • Powered by open data • Transparent methodology
          </p>
        </motion.div>
      </main>
    </div>
  );
};

export default LandHealthAnalytics;
