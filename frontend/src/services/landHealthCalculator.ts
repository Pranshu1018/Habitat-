/**
 * Land Health Calculator Service
 * 
 * Implements the core land health scoring algorithm using:
 * - Vegetation density (35% weight)
 * - Soil health index (30% weight)
 * - Moisture level (20% weight)
 * - Biodiversity score (15% weight)
 * 
 * Based on FAO, ISRIC, and IPCC methodologies
 */

import { LandHealthSnapshot } from '@/data/landHealthHistory';

export interface LandHealthComponents {
  vegetationDensity: number;
  soilHealthIndex: number;
  moistureLevel: number;
  biodiversityScore: number;
}

export interface LandHealthResult {
  overallScore: number;
  components: LandHealthComponents;
  weightedContributions: {
    vegetation: number;
    soil: number;
    moisture: number;
    biodiversity: number;
  };
  grade: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical';
  trend: 'improving' | 'stable' | 'declining';
}

// Weights for land health calculation (must sum to 1.0)
const WEIGHTS = {
  VEGETATION: 0.35,
  SOIL: 0.30,
  MOISTURE: 0.20,
  BIODIVERSITY: 0.15
} as const;

/**
 * Calculate overall land health score
 * 
 * Formula:
 * Land Health = 0.35×VD + 0.30×SH + 0.20×ML + 0.15×BS
 * 
 * Where:
 * - VD = Vegetation Density (0-100)
 * - SH = Soil Health Index (0-100)
 * - ML = Moisture Level (0-100)
 * - BS = Biodiversity Score (0-100)
 */
export function calculateLandHealthScore(components: LandHealthComponents): number {
  const score =
    WEIGHTS.VEGETATION * components.vegetationDensity +
    WEIGHTS.SOIL * components.soilHealthIndex +
    WEIGHTS.MOISTURE * components.moistureLevel +
    WEIGHTS.BIODIVERSITY * components.biodiversityScore;
  
  return Math.round(score * 10) / 10; // Round to 1 decimal
}

/**
 * Calculate weighted contributions of each component
 */
export function calculateWeightedContributions(
  components: LandHealthComponents
): LandHealthResult['weightedContributions'] {
  return {
    vegetation: Math.round(WEIGHTS.VEGETATION * components.vegetationDensity * 10) / 10,
    soil: Math.round(WEIGHTS.SOIL * components.soilHealthIndex * 10) / 10,
    moisture: Math.round(WEIGHTS.MOISTURE * components.moistureLevel * 10) / 10,
    biodiversity: Math.round(WEIGHTS.BIODIVERSITY * components.biodiversityScore * 10) / 10
  };
}

/**
 * Get health grade based on score
 */
export function getHealthGrade(score: number): LandHealthResult['grade'] {
  if (score >= 80) return 'Excellent';
  if (score >= 65) return 'Good';
  if (score >= 50) return 'Fair';
  if (score >= 35) return 'Poor';
  return 'Critical';
}

/**
 * Calculate trend from historical snapshots
 */
export function calculateTrend(snapshots: LandHealthSnapshot[]): LandHealthResult['trend'] {
  if (snapshots.length < 2) return 'stable';
  
  // Get last 3 snapshots or all if less than 3
  const recent = snapshots.slice(-Math.min(3, snapshots.length));
  const scores = recent.map(s => calculateLandHealthScore({
    vegetationDensity: s.vegetationDensity,
    soilHealthIndex: s.soilHealthIndex,
    moistureLevel: s.moistureLevel,
    biodiversityScore: s.biodiversityScore
  }));
  
  // Calculate average change
  const avgChange = (scores[scores.length - 1] - scores[0]) / scores.length;
  
  if (avgChange > 1.5) return 'improving';
  if (avgChange < -1.5) return 'declining';
  return 'stable';
}

/**
 * Get comprehensive land health analysis
 */
export function analyzeLandHealth(
  components: LandHealthComponents,
  historicalSnapshots?: LandHealthSnapshot[]
): LandHealthResult {
  const overallScore = calculateLandHealthScore(components);
  const weightedContributions = calculateWeightedContributions(components);
  const grade = getHealthGrade(overallScore);
  const trend = historicalSnapshots 
    ? calculateTrend(historicalSnapshots)
    : 'stable';
  
  return {
    overallScore,
    components,
    weightedContributions,
    grade,
    trend
  };
}

/**
 * Calculate improvement percentage from baseline
 */
export function calculateImprovement(
  baseline: LandHealthComponents,
  current: LandHealthComponents
): number {
  const baselineScore = calculateLandHealthScore(baseline);
  const currentScore = calculateLandHealthScore(current);
  
  if (baselineScore === 0) return 0;
  
  return Math.round(((currentScore - baselineScore) / baselineScore) * 100);
}

/**
 * Get component status (for UI indicators)
 */
export function getComponentStatus(value: number): 'success' | 'warning' | 'danger' {
  if (value >= 70) return 'success';
  if (value >= 50) return 'warning';
  return 'danger';
}

/**
 * Format the land health formula for display
 */
export function getHealthFormula(): string {
  return `Land Health Score = ${WEIGHTS.VEGETATION} × Vegetation Density + ${WEIGHTS.SOIL} × Soil Health + ${WEIGHTS.MOISTURE} × Moisture Level + ${WEIGHTS.BIODIVERSITY} × Biodiversity Score`;
}

/**
 * Get component weights for transparency
 */
export function getComponentWeights() {
  return {
    vegetation: { weight: WEIGHTS.VEGETATION, percentage: WEIGHTS.VEGETATION * 100 },
    soil: { weight: WEIGHTS.SOIL, percentage: WEIGHTS.SOIL * 100 },
    moisture: { weight: WEIGHTS.MOISTURE, percentage: WEIGHTS.MOISTURE * 100 },
    biodiversity: { weight: WEIGHTS.BIODIVERSITY, percentage: WEIGHTS.BIODIVERSITY * 100 }
  };
}
