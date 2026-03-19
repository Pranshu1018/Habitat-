// Land Health History - Demonstration of restoration progress over time
// Shows gradual improvement in vegetation density, soil health, and biodiversity

export interface LandHealthSnapshot {
  date: string;
  vegetationDensity: number; // 0-100
  soilHealthIndex: number;   // 0-100
  moistureLevel: number;     // 0-100 (can be updated with live API data)
  biodiversityScore: number; // 0-100
  treeCount: number;
  avgTreeAgeYears: number;
  status: 'baseline' | 'improving' | 'stagnant' | 'declining';
  notes: string;
}

export const LAND_HEALTH_HISTORY: LandHealthSnapshot[] = [
  {
    date: '2024-02-01',
    vegetationDensity: 38,
    soilHealthIndex: 52,
    moistureLevel: 45,
    biodiversityScore: 35,
    treeCount: 1500,
    avgTreeAgeYears: 0.25,
    status: 'baseline',
    notes: 'Initial planting phase - bare land with minimal vegetation'
  },
  {
    date: '2024-04-01',
    vegetationDensity: 45,
    soilHealthIndex: 56,
    moistureLevel: 58,
    biodiversityScore: 42,
    treeCount: 1485,
    avgTreeAgeYears: 0.42,
    status: 'improving',
    notes: 'Early establishment - seedlings taking root, some mortality'
  },
  {
    date: '2024-06-01',
    vegetationDensity: 54,
    soilHealthIndex: 61,
    moistureLevel: 52,
    biodiversityScore: 48,
    treeCount: 1470,
    avgTreeAgeYears: 0.58,
    status: 'improving',
    notes: 'Dry season impact - reduced moisture but continued growth'
  },
  {
    date: '2024-08-01',
    vegetationDensity: 62,
    soilHealthIndex: 65,
    moistureLevel: 68,
    biodiversityScore: 55,
    treeCount: 1465,
    avgTreeAgeYears: 0.75,
    status: 'improving',
    notes: 'Monsoon recovery - rapid vegetation growth, improved soil moisture'
  },
  {
    date: '2024-10-01',
    vegetationDensity: 68,
    soilHealthIndex: 70,
    moistureLevel: 62,
    biodiversityScore: 61,
    treeCount: 1460,
    avgTreeAgeYears: 0.92,
    status: 'improving',
    notes: 'Canopy development - increased shade and biodiversity'
  },
  {
    date: '2024-12-01',
    vegetationDensity: 72,
    soilHealthIndex: 74,
    moistureLevel: 58,
    biodiversityScore: 66,
    treeCount: 1455,
    avgTreeAgeYears: 1.08,
    status: 'improving',
    notes: 'First year complete - strong root systems established'
  },
  {
    date: '2025-02-01',
    vegetationDensity: 76,
    soilHealthIndex: 78,
    moistureLevel: 65,
    biodiversityScore: 71,
    treeCount: 1450,
    avgTreeAgeYears: 1.25,
    status: 'improving',
    notes: 'Accelerated growth phase - native species colonization'
  },
  {
    date: '2025-04-01',
    vegetationDensity: 80,
    soilHealthIndex: 82,
    moistureLevel: 70,
    biodiversityScore: 75,
    treeCount: 1445,
    avgTreeAgeYears: 1.42,
    status: 'improving',
    notes: 'Ecosystem maturation - self-sustaining biodiversity'
  }
];

// Calculate land health score using weighted formula
export function calculateLandHealthScore(snapshot: LandHealthSnapshot): number {
  return Math.round(
    0.35 * snapshot.vegetationDensity +
    0.30 * snapshot.soilHealthIndex +
    0.20 * snapshot.moistureLevel +
    0.15 * snapshot.biodiversityScore
  );
}

// Get the latest snapshot
export function getLatestSnapshot(): LandHealthSnapshot {
  return LAND_HEALTH_HISTORY[LAND_HEALTH_HISTORY.length - 1];
}

// Calculate improvement percentage from baseline
export function calculateImprovement(): number {
  const baseline = calculateLandHealthScore(LAND_HEALTH_HISTORY[0]);
  const current = calculateLandHealthScore(getLatestSnapshot());
  return Math.round(((current - baseline) / baseline) * 100);
}

// Get trend direction
export function getTrendDirection(): 'improving' | 'stable' | 'declining' {
  const recent = LAND_HEALTH_HISTORY.slice(-3);
  const scores = recent.map(calculateLandHealthScore);
  const avgChange = (scores[scores.length - 1] - scores[0]) / scores.length;
  
  if (avgChange > 1) return 'improving';
  if (avgChange < -1) return 'declining';
  return 'stable';
}
