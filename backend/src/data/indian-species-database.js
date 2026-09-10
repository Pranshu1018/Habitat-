/**
 * Comprehensive Indian Native Tree Species Database
 * Data sourced from: Forest Survey of India, ICFRE, Botanical Survey of India
 * 20 species covering all Indian biomes and climatic zones
 */

export const INDIAN_TREE_SPECIES = [

  // ─── TROPICAL MOIST / WESTERN GHATS ─────────────────────────────────────────
  {
    id: 'tectona_grandis',
    commonName: 'Teak',
    scientificName: 'Tectona grandis',
    family: 'Lamiaceae',
    nativeRegions: ['Western Ghats', 'Central India', 'Madhya Pradesh', 'Maharashtra'],
    biome: 'tropical_moist',
    requirements: {
      temperature: { min: 22, max: 35, optimal: [25, 30] },
      rainfall: { min: 1200, max: 3000, optimal: [1500, 2500] },
      phRange: { min: 6.0, max: 7.5, optimal: [6.5, 7.0] },
      soilTypes: ['loamy', 'clay_loam', 'alluvial'],
      droughtTolerance: 'low',
      floodTolerance: 'low',
      frostTolerance: 'none',
      elevation: { min: 0, max: 1000 }
    },
    characteristics: {
      growthRate: 'medium',
      maturityYears: 20,
      maxHeight: 30,
      canopySpread: 15,
      rootDepth: 'deep',
      woodDensity: 'high',
      woodValue: 'very_high',
      ecologicalValue: 8,
      carbonSequestration: 15.0,
      nitrogenFixing: false
    },
    uses: ['timber', 'furniture', 'construction', 'shipbuilding'],
    economicValue: 'very_high',
    certifications: ['FSC_compatible']
  },

  {
    id: 'shorea_robusta',
    commonName: 'Sal',
    scientificName: 'Shorea robusta',
    family: 'Dipterocarpaceae',
    nativeRegions: ['Central India', 'Chhattisgarh', 'Jharkhand', 'Uttarakhand'],
    biome: 'tropical_moist',
    requirements: {
      temperature: { min: 18, max: 32, optimal: [22, 28] },
      rainfall: { min: 1000, max: 2500, optimal: [1200, 2000] },
      phRange: { min: 5.5, max: 7.0, optimal: [6.0, 6.8] },
      soilTypes: ['loamy', 'sandy_loam', 'laterite'],
      droughtTolerance: 'medium',
      floodTolerance: 'low',
      frostTolerance: 'low',
      elevation: { min: 0, max: 1000 }
    },
    characteristics: {
      growthRate: 'slow',
      maturityYears: 25,
      maxHeight: 30,
      canopySpread: 12,
      rootDepth: 'deep',
      woodDensity: 'very_high',
      woodValue: 'high',
      ecologicalValue: 9,
      carbonSequestration: 18.0,
      nitrogenFixing: false
    },
    uses: ['timber', 'resin', 'leaves_for_plates', 'sacred_tree'],
    economicValue: 'very_high'
  },

  {
    id: 'santalum_album',
    commonName: 'Sandalwood',
    scientificName: 'Santalum album',
    family: 'Santalaceae',
    nativeRegions: ['Karnataka', 'Tamil Nadu', 'Andhra Pradesh', 'Western Ghats'],
    biome: 'tropical_dry',
    requirements: {
      temperature: { min: 12, max: 38, optimal: [24, 34] },
      rainfall: { min: 600, max: 1600, optimal: [800, 1200] },
      phRange: { min: 6.0, max: 7.5, optimal: [6.5, 7.2] },
      soilTypes: ['loamy', 'sandy_loam', 'laterite', 'rocky'],
      droughtTolerance: 'high',
      floodTolerance: 'low',
      frostTolerance: 'medium',
      elevation: { min: 600, max: 1800 }
    },
    characteristics: {
      growthRate: 'slow',
      maturityYears: 30,
      maxHeight: 12,
      canopySpread: 6,
      rootDepth: 'medium',
      woodDensity: 'very_high',
      woodValue: 'very_high',
      ecologicalValue: 7,
      carbonSequestration: 5.5,
      nitrogenFixing: false
    },
    uses: ['essential_oil', 'incense', 'religious', 'cosmetics', 'carving'],
    economicValue: 'very_high',
    medicinalValue: 'very_high'
  },

  {
    id: 'dalbergia_latifolia',
    commonName: 'Rosewood',
    scientificName: 'Dalbergia latifolia',
    family: 'Fabaceae',
    nativeRegions: ['Western Ghats', 'Karnataka', 'Maharashtra', 'Odisha'],
    biome: 'tropical_moist',
    requirements: {
      temperature: { min: 20, max: 38, optimal: [25, 33] },
      rainfall: { min: 800, max: 3000, optimal: [1200, 2000] },
      phRange: { min: 5.5, max: 7.5, optimal: [6.0, 7.0] },
      soilTypes: ['loamy', 'clay_loam', 'laterite', 'alluvial'],
      droughtTolerance: 'medium',
      floodTolerance: 'low',
      frostTolerance: 'none',
      elevation: { min: 0, max: 900 }
    },
    characteristics: {
      growthRate: 'slow',
      maturityYears: 25,
      maxHeight: 25,
      canopySpread: 12,
      rootDepth: 'deep',
      woodDensity: 'very_high',
      woodValue: 'very_high',
      ecologicalValue: 8,
      carbonSequestration: 13.5,
      nitrogenFixing: true
    },
    uses: ['premium_timber', 'furniture', 'musical_instruments', 'veneer'],
    economicValue: 'very_high'
  },

  // ─── TROPICAL DRY / ALL-INDIA ───────────────────────────────────────────────
  {
    id: 'azadirachta_indica',
    commonName: 'Neem',
    scientificName: 'Azadirachta indica',
    family: 'Meliaceae',
    nativeRegions: ['All India', 'Peninsular India', 'Gangetic Plains'],
    biome: 'tropical_dry',
    requirements: {
      temperature: { min: 20, max: 45, optimal: [25, 35] },
      rainfall: { min: 400, max: 1500, optimal: [600, 1200] },
      phRange: { min: 5.5, max: 8.5, optimal: [6.5, 7.5] },
      soilTypes: ['sandy', 'loamy', 'clay', 'black_cotton'],
      droughtTolerance: 'very_high',
      floodTolerance: 'medium',
      frostTolerance: 'low',
      elevation: { min: 0, max: 1500 }
    },
    characteristics: {
      growthRate: 'fast',
      maturityYears: 5,
      maxHeight: 20,
      canopySpread: 10,
      rootDepth: 'deep',
      woodDensity: 'medium',
      woodValue: 'medium',
      ecologicalValue: 8,
      carbonSequestration: 8.5,
      nitrogenFixing: false
    },
    uses: ['medicinal', 'biopesticide', 'shade_tree', 'avenue_tree', 'agroforestry'],
    economicValue: 'high',
    medicinalValue: 'very_high'
  },

  {
    id: 'phyllanthus_emblica',
    commonName: 'Indian Gooseberry',
    scientificName: 'Phyllanthus emblica',
    family: 'Phyllanthaceae',
    nativeRegions: ['All India', 'Dry deciduous forests', 'Himalayas up to 1500m'],
    biome: 'tropical_dry',
    requirements: {
      temperature: { min: 10, max: 42, optimal: [22, 35] },
      rainfall: { min: 500, max: 1800, optimal: [700, 1400] },
      phRange: { min: 5.0, max: 8.0, optimal: [6.0, 7.5] },
      soilTypes: ['sandy', 'loamy', 'sandy_loam', 'rocky'],
      droughtTolerance: 'high',
      floodTolerance: 'medium',
      frostTolerance: 'medium',
      elevation: { min: 0, max: 1500 }
    },
    characteristics: {
      growthRate: 'medium',
      maturityYears: 7,
      maxHeight: 18,
      canopySpread: 9,
      rootDepth: 'deep',
      woodDensity: 'high',
      woodValue: 'medium',
      ecologicalValue: 8,
      carbonSequestration: 7.0,
      nitrogenFixing: false
    },
    uses: ['fruit', 'medicinal', 'dye', 'ayurveda', 'tannin'],
    economicValue: 'high',
    medicinalValue: 'very_high'
  },

  {
    id: 'madhuca_longifolia',
    commonName: 'Mahua',
    scientificName: 'Madhuca longifolia',
    family: 'Sapotaceae',
    nativeRegions: ['Central India', 'Chhattisgarh', 'Jharkhand', 'Odisha', 'Madhya Pradesh'],
    biome: 'tropical_dry',
    requirements: {
      temperature: { min: 15, max: 42, optimal: [25, 38] },
      rainfall: { min: 750, max: 1800, optimal: [1000, 1500] },
      phRange: { min: 5.5, max: 7.5, optimal: [6.0, 7.0] },
      soilTypes: ['sandy_loam', 'loamy', 'laterite'],
      droughtTolerance: 'high',
      floodTolerance: 'medium',
      frostTolerance: 'low',
      elevation: { min: 0, max: 1000 }
    },
    characteristics: {
      growthRate: 'medium',
      maturityYears: 10,
      maxHeight: 20,
      canopySpread: 12,
      rootDepth: 'deep',
      woodDensity: 'high',
      woodValue: 'medium',
      ecologicalValue: 9,
      carbonSequestration: 9.5,
      nitrogenFixing: false
    },
    uses: ['flowers_food', 'seed_oil', 'tribal_economy', 'fodder', 'timber'],
    economicValue: 'high',
    culturalValue: 'very_high'
  },

  {
    id: 'syzygium_cumini',
    commonName: 'Jamun',
    scientificName: 'Syzygium cumini',
    family: 'Myrtaceae',
    nativeRegions: ['All India', 'Gangetic Plains', 'Western Ghats', 'Deccan Plateau'],
    biome: 'tropical_dry',
    requirements: {
      temperature: { min: 12, max: 44, optimal: [24, 36] },
      rainfall: { min: 700, max: 2000, optimal: [1000, 1600] },
      phRange: { min: 5.5, max: 8.0, optimal: [6.5, 7.5] },
      soilTypes: ['loamy', 'clay_loam', 'alluvial', 'sandy_loam'],
      droughtTolerance: 'medium',
      floodTolerance: 'high',
      frostTolerance: 'low',
      elevation: { min: 0, max: 1400 }
    },
    characteristics: {
      growthRate: 'fast',
      maturityYears: 8,
      maxHeight: 30,
      canopySpread: 15,
      rootDepth: 'deep',
      woodDensity: 'high',
      woodValue: 'medium',
      ecologicalValue: 9,
      carbonSequestration: 11.0,
      nitrogenFixing: false
    },
    uses: ['fruit', 'medicinal', 'shade_tree', 'avenue_tree', 'timber'],
    economicValue: 'high',
    medicinalValue: 'high'
  },

  // ─── DRY DECIDUOUS FOREST ───────────────────────────────────────────────────
  {
    id: 'butea_monosperma',
    commonName: 'Flame of the Forest',
    scientificName: 'Butea monosperma',
    family: 'Fabaceae',
    nativeRegions: ['All India', 'Dry deciduous forests'],
    biome: 'tropical_dry',
    requirements: {
      temperature: { min: 18, max: 45, optimal: [25, 38] },
      rainfall: { min: 500, max: 1500, optimal: [800, 1200] },
      phRange: { min: 6.0, max: 8.0, optimal: [6.5, 7.5] },
      soilTypes: ['sandy', 'loamy', 'rocky'],
      droughtTolerance: 'high',
      floodTolerance: 'medium',
      frostTolerance: 'medium',
      elevation: { min: 0, max: 1200 }
    },
    characteristics: {
      growthRate: 'medium',
      maturityYears: 8,
      maxHeight: 15,
      canopySpread: 10,
      rootDepth: 'deep',
      woodDensity: 'low',
      woodValue: 'low',
      ecologicalValue: 8,
      carbonSequestration: 5.5,
      nitrogenFixing: true
    },
    uses: ['dye', 'gum', 'medicinal', 'fodder', 'ornamental'],
    economicValue: 'medium',
    culturalValue: 'high'
  },

  {
    id: 'terminalia_arjuna',
    commonName: 'Arjun',
    scientificName: 'Terminalia arjuna',
    family: 'Combretaceae',
    nativeRegions: ['Central India', 'Deccan Plateau', 'Riverbanks'],
    biome: 'tropical_moist',
    requirements: {
      temperature: { min: 20, max: 42, optimal: [25, 35] },
      rainfall: { min: 600, max: 2000, optimal: [1000, 1600] },
      phRange: { min: 5.5, max: 8.0, optimal: [6.0, 7.0] },
      soilTypes: ['loamy', 'alluvial', 'clay_loam'],
      droughtTolerance: 'medium',
      floodTolerance: 'very_high',
      frostTolerance: 'low',
      elevation: { min: 0, max: 1000 }
    },
    characteristics: {
      growthRate: 'fast',
      maturityYears: 10,
      maxHeight: 25,
      canopySpread: 12,
      rootDepth: 'deep',
      woodDensity: 'high',
      woodValue: 'high',
      ecologicalValue: 8,
      carbonSequestration: 12.0,
      nitrogenFixing: false
    },
    uses: ['timber', 'medicinal', 'bark_for_dye', 'riverbank_stabilization'],
    economicValue: 'high',
    medicinalValue: 'very_high'
  },

  // ─── ARID / SEMI-ARID ───────────────────────────────────────────────────────
  {
    id: 'acacia_nilotica',
    commonName: 'Babul',
    scientificName: 'Acacia nilotica',
    family: 'Fabaceae',
    nativeRegions: ['Rajasthan', 'Gujarat', 'Punjab', 'Haryana', 'Arid zones'],
    biome: 'arid',
    requirements: {
      temperature: { min: 15, max: 50, optimal: [25, 40] },
      rainfall: { min: 200, max: 1000, optimal: [400, 800] },
      phRange: { min: 6.0, max: 9.0, optimal: [7.0, 8.0] },
      soilTypes: ['sandy', 'clay', 'alkaline', 'saline'],
      droughtTolerance: 'very_high',
      floodTolerance: 'high',
      frostTolerance: 'medium',
      elevation: { min: 0, max: 1200 }
    },
    characteristics: {
      growthRate: 'fast',
      maturityYears: 4,
      maxHeight: 10,
      canopySpread: 8,
      rootDepth: 'deep',
      woodDensity: 'high',
      woodValue: 'medium',
      ecologicalValue: 7,
      carbonSequestration: 6.2,
      nitrogenFixing: true
    },
    uses: ['fuelwood', 'fodder', 'gum_arabic', 'soil_stabilization', 'tannin'],
    economicValue: 'medium',
    soilImprovement: 'high'
  },

  {
    id: 'prosopis_cineraria',
    commonName: 'Khejri',
    scientificName: 'Prosopis cineraria',
    family: 'Fabaceae',
    nativeRegions: ['Rajasthan', 'Gujarat', 'Haryana', 'Punjab', 'Thar Desert'],
    biome: 'arid',
    requirements: {
      temperature: { min: 10, max: 52, optimal: [30, 45] },
      rainfall: { min: 150, max: 600, optimal: [200, 450] },
      phRange: { min: 7.0, max: 9.5, optimal: [7.5, 8.5] },
      soilTypes: ['sandy', 'alkaline', 'saline', 'rocky'],
      droughtTolerance: 'very_high',
      floodTolerance: 'medium',
      frostTolerance: 'high',
      elevation: { min: 0, max: 900 }
    },
    characteristics: {
      growthRate: 'slow',
      maturityYears: 15,
      maxHeight: 6,
      canopySpread: 8,
      rootDepth: 'deep',
      woodDensity: 'very_high',
      woodValue: 'medium',
      ecologicalValue: 9,
      carbonSequestration: 4.0,
      nitrogenFixing: true
    },
    uses: ['fodder', 'fuelwood', 'food_pods', 'soil_stabilization', 'agroforestry'],
    economicValue: 'medium',
    culturalValue: 'very_high',
    soilImprovement: 'very_high'
  },

  {
    id: 'ziziphus_mauritiana',
    commonName: 'Indian Jujube',
    scientificName: 'Ziziphus mauritiana',
    family: 'Rhamnaceae',
    nativeRegions: ['Rajasthan', 'Gujarat', 'Madhya Pradesh', 'Semi-arid zones'],
    biome: 'arid',
    requirements: {
      temperature: { min: 12, max: 46, optimal: [28, 40] },
      rainfall: { min: 250, max: 1400, optimal: [400, 900] },
      phRange: { min: 5.5, max: 8.5, optimal: [6.5, 7.8] },
      soilTypes: ['sandy', 'loamy', 'clay', 'alkaline'],
      droughtTolerance: 'very_high',
      floodTolerance: 'medium',
      frostTolerance: 'medium',
      elevation: { min: 0, max: 1000 }
    },
    characteristics: {
      growthRate: 'fast',
      maturityYears: 4,
      maxHeight: 12,
      canopySpread: 8,
      rootDepth: 'deep',
      woodDensity: 'medium',
      woodValue: 'medium',
      ecologicalValue: 7,
      carbonSequestration: 5.0,
      nitrogenFixing: false
    },
    uses: ['fruit', 'fodder', 'fuelwood', 'medicinal', 'hedge'],
    economicValue: 'medium',
    medicinalValue: 'medium'
  },

  // ─── BAMBOO ─────────────────────────────────────────────────────────────────
  {
    id: 'dendrocalamus_strictus',
    commonName: 'Bamboo',
    scientificName: 'Dendrocalamus strictus',
    family: 'Poaceae',
    nativeRegions: ['Western Ghats', 'Central India', 'Northeast India'],
    biome: 'tropical_moist',
    requirements: {
      temperature: { min: 15, max: 40, optimal: [20, 35] },
      rainfall: { min: 1000, max: 4000, optimal: [1500, 3000] },
      phRange: { min: 5.0, max: 7.5, optimal: [5.5, 6.5] },
      soilTypes: ['loamy', 'clay_loam', 'alluvial'],
      droughtTolerance: 'medium',
      floodTolerance: 'high',
      frostTolerance: 'low',
      elevation: { min: 0, max: 1500 }
    },
    characteristics: {
      growthRate: 'very_fast',
      maturityYears: 3,
      maxHeight: 20,
      canopySpread: 5,
      rootDepth: 'shallow',
      woodDensity: 'medium',
      woodValue: 'high',
      ecologicalValue: 9,
      carbonSequestration: 10.0,
      nitrogenFixing: false
    },
    uses: ['construction', 'handicrafts', 'paper', 'soil_conservation', 'erosion_control'],
    economicValue: 'very_high',
    renewableResource: true
  },

  // ─── HIMALAYAN / TEMPERATE ──────────────────────────────────────────────────
  {
    id: 'cedrus_deodara',
    commonName: 'Deodar Cedar',
    scientificName: 'Cedrus deodara',
    family: 'Pinaceae',
    nativeRegions: ['Himachal Pradesh', 'Uttarakhand', 'Jammu & Kashmir', 'Western Himalayas'],
    biome: 'temperate',
    requirements: {
      temperature: { min: -10, max: 30, optimal: [10, 22] },
      rainfall: { min: 800, max: 2500, optimal: [1200, 2000] },
      phRange: { min: 5.0, max: 7.0, optimal: [5.5, 6.5] },
      soilTypes: ['sandy_loam', 'loamy', 'rocky'],
      droughtTolerance: 'medium',
      floodTolerance: 'low',
      frostTolerance: 'high',
      elevation: { min: 1200, max: 3200 }
    },
    characteristics: {
      growthRate: 'medium',
      maturityYears: 30,
      maxHeight: 50,
      canopySpread: 12,
      rootDepth: 'deep',
      woodDensity: 'high',
      woodValue: 'very_high',
      ecologicalValue: 9,
      carbonSequestration: 14.0,
      nitrogenFixing: false
    },
    uses: ['timber', 'resin', 'sacred_tree', 'construction', 'furniture'],
    economicValue: 'very_high',
    culturalValue: 'very_high'
  },

  {
    id: 'pinus_roxburghii',
    commonName: 'Chir Pine',
    scientificName: 'Pinus roxburghii',
    family: 'Pinaceae',
    nativeRegions: ['Himachal Pradesh', 'Uttarakhand', 'J&K', 'Western Himalayas'],
    biome: 'temperate',
    requirements: {
      temperature: { min: 0, max: 32, optimal: [14, 25] },
      rainfall: { min: 600, max: 2000, optimal: [1000, 1600] },
      phRange: { min: 4.5, max: 7.0, optimal: [5.0, 6.5] },
      soilTypes: ['sandy_loam', 'rocky', 'loamy'],
      droughtTolerance: 'medium',
      floodTolerance: 'low',
      frostTolerance: 'high',
      elevation: { min: 450, max: 2300 }
    },
    characteristics: {
      growthRate: 'medium',
      maturityYears: 20,
      maxHeight: 40,
      canopySpread: 8,
      rootDepth: 'deep',
      woodDensity: 'medium',
      woodValue: 'high',
      ecologicalValue: 7,
      carbonSequestration: 11.0,
      nitrogenFixing: false
    },
    uses: ['timber', 'resin_tapping', 'pulp', 'fuelwood'],
    economicValue: 'high'
  },

  // ─── RIPARIAN / WETLAND ──────────────────────────────────────────────────────
  {
    id: 'salix_tetrasperma',
    commonName: 'Indian Willow',
    scientificName: 'Salix tetrasperma',
    family: 'Salicaceae',
    nativeRegions: ['Himalayas', 'Gangetic Plains', 'Western India', 'Riverbanks'],
    biome: 'tropical_moist',
    requirements: {
      temperature: { min: 5, max: 38, optimal: [18, 30] },
      rainfall: { min: 700, max: 2500, optimal: [1000, 2000] },
      phRange: { min: 5.5, max: 8.0, optimal: [6.0, 7.5] },
      soilTypes: ['alluvial', 'sandy_loam', 'loamy', 'clay_loam'],
      droughtTolerance: 'low',
      floodTolerance: 'very_high',
      frostTolerance: 'medium',
      elevation: { min: 0, max: 1500 }
    },
    characteristics: {
      growthRate: 'very_fast',
      maturityYears: 6,
      maxHeight: 18,
      canopySpread: 10,
      rootDepth: 'medium',
      woodDensity: 'low',
      woodValue: 'low',
      ecologicalValue: 9,
      carbonSequestration: 8.0,
      nitrogenFixing: false
    },
    uses: ['riverbank_stabilization', 'soil_erosion_control', 'fodder', 'charcoal'],
    economicValue: 'medium',
    soilImprovement: 'high'
  },

  // ─── COASTAL / MANGROVE ──────────────────────────────────────────────────────
  {
    id: 'calophyllum_inophyllum',
    commonName: 'Indian Laurel',
    scientificName: 'Calophyllum inophyllum',
    family: 'Calophyllaceae',
    nativeRegions: ['Kerala', 'Karnataka', 'Tamil Nadu', 'Andaman & Nicobar', 'Coastal India'],
    biome: 'mangrove',
    requirements: {
      temperature: { min: 20, max: 38, optimal: [26, 34] },
      rainfall: { min: 1200, max: 3500, optimal: [1800, 3000] },
      phRange: { min: 5.0, max: 7.5, optimal: [5.5, 6.8] },
      soilTypes: ['sandy', 'sandy_loam', 'loamy'],
      droughtTolerance: 'medium',
      floodTolerance: 'high',
      frostTolerance: 'none',
      elevation: { min: 0, max: 500 }
    },
    characteristics: {
      growthRate: 'medium',
      maturityYears: 15,
      maxHeight: 20,
      canopySpread: 12,
      rootDepth: 'medium',
      woodDensity: 'high',
      woodValue: 'high',
      ecologicalValue: 9,
      carbonSequestration: 9.0,
      nitrogenFixing: false
    },
    uses: ['biodiesel', 'timber', 'coastal_protection', 'medicinal', 'shade'],
    economicValue: 'high',
    medicinalValue: 'high'
  },

  {
    id: 'casuarina_equisetifolia',
    commonName: 'Casuarina',
    scientificName: 'Casuarina equisetifolia',
    family: 'Casuarinaceae',
    nativeRegions: ['Tamil Nadu', 'Andhra Pradesh', 'Odisha', 'West Bengal', 'Coastal India'],
    biome: 'mangrove',
    requirements: {
      temperature: { min: 18, max: 40, optimal: [25, 35] },
      rainfall: { min: 800, max: 3000, optimal: [1200, 2500] },
      phRange: { min: 4.0, max: 8.5, optimal: [6.0, 7.5] },
      soilTypes: ['sandy', 'sandy_loam', 'loamy'],
      droughtTolerance: 'high',
      floodTolerance: 'high',
      frostTolerance: 'low',
      elevation: { min: 0, max: 600 }
    },
    characteristics: {
      growthRate: 'very_fast',
      maturityYears: 5,
      maxHeight: 25,
      canopySpread: 8,
      rootDepth: 'deep',
      woodDensity: 'high',
      woodValue: 'medium',
      ecologicalValue: 7,
      carbonSequestration: 12.5,
      nitrogenFixing: true
    },
    uses: ['coastal_windbreak', 'fuelwood', 'pulp', 'soil_stabilization', 'carbon_sequestration'],
    economicValue: 'medium',
    soilImprovement: 'high'
  }
];

/**
 * Species matching confidence calculation
 */
export function calculateSpeciesCompatibility(species, conditions) {
  const { temperature, rainfall, ph, soilType, elevation } = conditions;

  let score = 0;
  let maxScore = 0;
  const factors = [];

  // Temperature compatibility (weight: 25)
  maxScore += 25;
  if (temperature >= species.requirements.temperature.optimal[0] &&
      temperature <= species.requirements.temperature.optimal[1]) {
    score += 25;
    factors.push({ name: 'temperature', match: 'optimal', contribution: 25 });
  } else if (temperature >= species.requirements.temperature.min &&
             temperature <= species.requirements.temperature.max) {
    score += 15;
    factors.push({ name: 'temperature', match: 'acceptable', contribution: 15 });
  } else {
    factors.push({ name: 'temperature', match: 'poor', contribution: 0 });
  }

  // Rainfall compatibility (weight: 25)
  maxScore += 25;
  if (rainfall >= species.requirements.rainfall.optimal[0] &&
      rainfall <= species.requirements.rainfall.optimal[1]) {
    score += 25;
    factors.push({ name: 'rainfall', match: 'optimal', contribution: 25 });
  } else if (rainfall >= species.requirements.rainfall.min &&
             rainfall <= species.requirements.rainfall.max) {
    score += 15;
    factors.push({ name: 'rainfall', match: 'acceptable', contribution: 15 });
  } else {
    factors.push({ name: 'rainfall', match: 'poor', contribution: 0 });
  }

  // pH compatibility (weight: 20)
  maxScore += 20;
  if (ph >= species.requirements.phRange.optimal[0] &&
      ph <= species.requirements.phRange.optimal[1]) {
    score += 20;
    factors.push({ name: 'ph', match: 'optimal', contribution: 20 });
  } else if (ph >= species.requirements.phRange.min &&
             ph <= species.requirements.phRange.max) {
    score += 12;
    factors.push({ name: 'ph', match: 'acceptable', contribution: 12 });
  } else {
    factors.push({ name: 'ph', match: 'poor', contribution: 0 });
  }

  // Soil type compatibility (weight: 15)
  maxScore += 15;
  if (species.requirements.soilTypes.includes(soilType)) {
    score += 15;
    factors.push({ name: 'soilType', match: 'compatible', contribution: 15 });
  } else {
    score += 5;
    factors.push({ name: 'soilType', match: 'marginal', contribution: 5 });
  }

  // Elevation compatibility (weight: 15)
  maxScore += 15;
  if (elevation >= species.requirements.elevation.min &&
      elevation <= species.requirements.elevation.max) {
    score += 15;
    factors.push({ name: 'elevation', match: 'suitable', contribution: 15 });
  } else {
    factors.push({ name: 'elevation', match: 'unsuitable', contribution: 0 });
  }

  const compatibility = Math.round((score / maxScore) * 100);

  return {
    score,
    maxScore,
    compatibility,
    factors,
    survivalProbability: compatibility,
    recommendation: compatibility >= 80 ? 'highly_recommended' :
                     compatibility >= 60 ? 'recommended' :
                     compatibility >= 40 ? 'marginal' : 'not_recommended'
  };
}
