/**
 * Carbon Adjustment Calculator
 * Adjusts carbon sequestration based on land health score
 */

export interface CarbonCalculationInput {
  treeCount: number;
  avgTreeAgeYears: number;
  forestType: 'tropical_moist' | 'tropical_dry' | 'temperate' | 'boreal';
  hectares: number;
  landHealthScore: number; // 0-100
}

export interface CarbonResult {
  baseCarbon: number; // tonnes C
  adjustedCarbon: number; // tonnes C
  co2Equivalent: number; // tonnes CO2e
  formulas: {
    base: string;
    adjustment: string;
    co2Conversion: string;
  };
}

export interface CarbonImprovement {
  baselineCarbon: number;
  currentCarbon: number;
  improvement: number;
  improvementPercent: number;
}

// Carbon sequestration rates by forest type (tonnes C/ha/year)
const FOREST_CARBON_RATES = {
  tropical_moist: 3.5,
  tropical_dry: 2.1,
  temperate: 2.0,
  boreal: 1.2
};

// CO2 to Carbon conversion factor
const CO2_TO_C_RATIO = 3.67;

/**
 * Calculate carbon sequestration with health adjustment
 */
export function calculateCarbonSequestration(input: CarbonCalculationInput): CarbonResult {
  const { treeCount, avgTreeAgeYears, forestType, hectares, landHealthScore } = input;
  
  // Base carbon calculation
  const baseRate = FOREST_CARBON_RATES[forestType];
  const baseCarbon = baseRate * hectares * avgTreeAgeYears;
  
  // Health adjustment factor (0.5 to 1.5 multiplier)
  // Health score of 50 = 1.0x, 100 = 1.5x, 0 = 0.5x
  const healthFactor = 0.5 + (landHealthScore / 100);
  
  // Adjusted carbon
  const adjustedCarbon = baseCarbon * healthFactor;
  
  // CO2 equivalent
  const co2Equivalent = adjustedCarbon * CO2_TO_C_RATIO;
  
  // Generate formulas for transparency
  const formulas = {
    base: `Base Carbon = ${baseRate} tC/ha/yr × ${hectares} ha × ${avgTreeAgeYears.toFixed(2)} yr = ${baseCarbon.toFixed(1)} tC`,
    adjustment: `Health Factor = 0.5 + (${landHealthScore}/100) = ${healthFactor.toFixed(2)}x → Adjusted = ${baseCarbon.toFixed(1)} × ${healthFactor.toFixed(2)} = ${adjustedCarbon.toFixed(1)} tC`,
    co2Conversion: `CO₂ Equivalent = ${adjustedCarbon.toFixed(1)} tC × ${CO2_TO_C_RATIO} = ${co2Equivalent.toFixed(1)} tCO₂e`
  };
  
  return {
    baseCarbon: parseFloat(baseCarbon.toFixed(1)),
    adjustedCarbon: parseFloat(adjustedCarbon.toFixed(1)),
    co2Equivalent: parseFloat(co2Equivalent.toFixed(1)),
    formulas
  };
}

/**
 * Calculate improvement from baseline
 */
export function calculateCarbonImprovement(
  baselineHealth: number,
  currentHealth: number,
  baseCarbon: number
): CarbonImprovement {
  const baselineFactor = 0.5 + (baselineHealth / 100);
  const currentFactor = 0.5 + (currentHealth / 100);
  
  const baselineCarbon = parseFloat((baseCarbon * baselineFactor).toFixed(1));
  const currentCarbon = parseFloat((baseCarbon * currentFactor).toFixed(1));
  const improvement = parseFloat((currentCarbon - baselineCarbon).toFixed(1));
  const improvementPercent = Math.round(((currentCarbon - baselineCarbon) / baselineCarbon) * 100);
  
  return {
    baselineCarbon,
    currentCarbon,
    improvement,
    improvementPercent
  };
}
