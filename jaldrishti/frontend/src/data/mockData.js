// JalDrishti Groundwater & Irrigation Advisory Mock Data
// Realistic datasets aligned with Central Ground Water Board (CGWB) & IMD benchmarks

export const NATIONAL_STATS = {
  totalMonitoredBlocks: 6881,
  safeBlocks: 4913,
  watchBlocks: 692,     // Semi-Critical in CGWB terms
  criticalBlocks: 1276,  // Critical + Over-exploited
  safePercentage: 71.4,
  watchPercentage: 10.1,
  criticalPercentage: 18.5,
  nationalAvgDepth: 16.4, // meters below ground level (m bgl)
  annualRechargeBcm: 437.60,
  annualExtractionBcm: 244.92,
  stageOfExtraction: 59.8, // percentage
  lastUpdated: "October 2026",
};

export const BLOCKS_DATA = [
  {
    id: "PB-TLW-01",
    name: "Talwandi Sabo",
    district: "Bathinda",
    state: "Punjab",
    coordinates: [29.9884, 75.0877],
    riskLevel: "Critical",
    currentDepthMeters: 42.6,
    depthTrendMetersPerYear: -1.12,
    monitoringWellsCount: 28,
    latestReadingDate: "02 Oct 2026",
    stageOfExtraction: 174.5, // > 100% is Over-exploited
    annualRainfallMm: 410,
    rainfallDeficitPercent: -22.5,
    aquiferType: "Alluvial (Indo-Gangetic Deep Aquifer)",
    soilType: "Sandy Loam to Fine Alluvium",
    primaryCrops: [
      { name: "Paddy (Rice)", areaPercent: 68, waterIntensive: true, waterReqMm: 1250 },
      { name: "Wheat", areaPercent: 24, waterIntensive: false, waterReqMm: 450 },
      { name: "Cotton & Fodder", areaPercent: 8, waterIntensive: false, waterReqMm: 380 }
    ],
    borewellDensityPerSqKm: 48,
    pumpingHoursDaily: 10.2,
    monitoringWells: [
      {
        id: "DWLR-PB-0101",
        name: "Talwandi Sabo Tehsil HQ",
        coordinates: [29.9912, 75.0845],
        depthMeters: 42.4,
        type: "Digital Water Level Recorder (DWLR)",
        status: "Active Telemetry",
        battery: "94%",
      },
      {
        id: "DWLR-PB-0102",
        name: "Raman Mandi Observation Well",
        coordinates: [29.9721, 75.0991],
        depthMeters: 43.1,
        type: "Piezometer Telemetry Station",
        status: "Active Telemetry",
        battery: "88%",
      },
      {
        id: "DWLR-PB-0103",
        name: "Mauri Kalan Telemetry Unit",
        coordinates: [30.0051, 75.0712],
        depthMeters: 41.9,
        type: "Digital Water Level Recorder (DWLR)",
        status: "Active Telemetry",
        battery: "91%",
      },
      {
        id: "DWLR-PB-0104",
        name: "Lehi Bhalur Monitored Well",
        coordinates: [29.9654, 75.0621],
        depthMeters: 42.8,
        type: "Dug-cum-Bore Well Station",
        status: "Active Telemetry",
        battery: "85%",
      },
    ],
    riskDrivers: [
      {
        id: "trend",
        title: "Declining Groundwater Trend",
        value: "-1.12 m / year",
        severity: "Critical",
        score: 94,
        description: "Severe sustained hydraulic head drawdown exceeding natural annual replenishment rate.",
        impact: "Accelerated cone of depression across shallow tube wells (<60m)."
      },
      {
        id: "rainfall",
        title: "Rainfall Variation",
        value: "-22.5% Deficit",
        severity: "Moderate",
        score: 72,
        description: "Annual monsoon precipitation of 410 mm falls significantly below 30-year normal rainfall.",
        impact: "Diminished percolation recharge to semi-confined aquifer layers."
      },
      {
        id: "irrigation",
        title: "Irrigation Pressure",
        value: "174.5% Extraction",
        severity: "Critical",
        score: 98,
        description: "Gross annual groundwater extraction far exceeds total replenishable recharge volume.",
        impact: "Tubewell density of 48 units/km² running an average 10.2 hours daily."
      },
      {
        id: "crops",
        title: "Crop Water Demand",
        value: "1,250 mm / season",
        severity: "High",
        score: 88,
        description: "68% of agricultural acreage under water-intensive flood-irrigated Kharif Paddy.",
        impact: "High evapotranspiration loss during peak summer pre-sowing period."
      }
    ],
    historicalDepth: [
      { year: "2018", preMonsoon: 33.5, postMonsoon: 31.8 },
      { year: "2019", preMonsoon: 35.1, postMonsoon: 33.4 },
      { year: "2020", preMonsoon: 36.8, postMonsoon: 35.2 },
      { year: "2021", preMonsoon: 38.6, postMonsoon: 36.9 },
      { year: "2022", preMonsoon: 40.2, postMonsoon: 38.6 },
      { year: "2023", preMonsoon: 41.8, postMonsoon: 40.1 },
      { year: "2024", preMonsoon: 43.4, postMonsoon: 41.5 },
      { year: "2025", preMonsoon: 44.9, postMonsoon: 42.8 },
      { year: "2026", preMonsoon: 46.2, postMonsoon: 42.6 },
    ],
    forecast12Months: [
      { month: "Nov 26", depth: 42.9, lowerBound: 42.4, upperBound: 43.4, season: "1 Season" },
      { month: "Dec 26", depth: 43.4, lowerBound: 42.8, upperBound: 44.0, season: "1 Season" },
      { month: "Jan 27", depth: 44.1, lowerBound: 43.4, upperBound: 44.8, season: "1 Season" },
      { month: "Feb 27", depth: 44.8, lowerBound: 44.0, upperBound: 45.6, season: "1 Season" },
      { month: "Mar 27", depth: 45.6, lowerBound: 44.7, upperBound: 46.5, season: "2 Seasons" },
      { month: "Apr 27", depth: 46.5, lowerBound: 45.4, upperBound: 47.6, season: "2 Seasons" },
      { month: "May 27", depth: 47.4, lowerBound: 46.2, upperBound: 48.6, season: "2 Seasons" },
      { month: "Jun 27", depth: 48.0, lowerBound: 46.6, upperBound: 49.4, season: "2 Seasons" },
      { month: "Jul 27", depth: 46.5, lowerBound: 45.1, upperBound: 47.9, season: "3 Seasons" },
      { month: "Aug 27", depth: 44.7, lowerBound: 43.2, upperBound: 46.2, season: "3 Seasons" },
      { month: "Sep 27", depth: 43.5, lowerBound: 42.0, upperBound: 45.0, season: "3 Seasons" },
      { month: "Oct 27", depth: 44.2, lowerBound: 42.6, upperBound: 45.8, season: "3 Seasons" },
    ],
    recommendations: [
      "Incentivize 30% acreage transition to Direct Seeded Rice (DSR) and summer Moong.",
      "Install solar automated tensiometer arrays to reduce flood pumping by 35%.",
      "Construct artificial groundwater recharge shafts along existing irrigation canals.",
      "Deploy PMKSY subsidized drip systems for cotton and vegetable belts."
    ]
  },
  {
    id: "PB-SNG-01",
    name: "Sangrur Central",
    district: "Sangrur",
    state: "Punjab",
    coordinates: [30.2458, 75.8421],
    riskLevel: "Critical",
    currentDepthMeters: 38.4,
    depthTrendMetersPerYear: -0.95,
    stageOfExtraction: 165.2, // > 100% is Over-exploited
    annualRainfallMm: 520,
    rainfallDeficitPercent: -18.4,
    aquiferType: "Alluvial (Indo-Gangetic Deep Aquifer)",
    soilType: "Sandy Loam to Clayey Loam",
    primaryCrops: [
      { name: "Paddy (Rice)", areaPercent: 62, waterIntensive: true, waterReqMm: 1250 },
      { name: "Wheat", areaPercent: 28, waterIntensive: false, waterReqMm: 450 },
      { name: "Mustard & Fodder", areaPercent: 10, waterIntensive: false, waterReqMm: 280 }
    ],
    borewellDensityPerSqKm: 42,
    pumpingHoursDaily: 9.5,
    historicalDepth: [
      { year: "2018", preMonsoon: 30.2, postMonsoon: 28.5 },
      { year: "2019", preMonsoon: 31.8, postMonsoon: 30.1 },
      { year: "2020", preMonsoon: 33.4, postMonsoon: 31.9 },
      { year: "2021", preMonsoon: 35.1, postMonsoon: 33.2 },
      { year: "2022", preMonsoon: 36.5, postMonsoon: 34.8 },
      { year: "2023", preMonsoon: 37.9, postMonsoon: 36.1 },
      { year: "2024", preMonsoon: 39.4, postMonsoon: 37.5 },
      { year: "2025", preMonsoon: 40.8, postMonsoon: 38.9 },
      { year: "2026", preMonsoon: 41.9, postMonsoon: 39.8 },
    ],
    forecast12Months: [
      { month: "Nov 26", depth: 38.6, lowerBound: 38.2, upperBound: 39.0 },
      { month: "Dec 26", depth: 39.1, lowerBound: 38.6, upperBound: 39.6 },
      { month: "Jan 27", depth: 39.8, lowerBound: 39.2, upperBound: 40.4 },
      { month: "Feb 27", depth: 40.5, lowerBound: 39.8, upperBound: 41.2 },
      { month: "Mar 27", depth: 41.2, lowerBound: 40.4, upperBound: 42.0 },
      { month: "Apr 27", depth: 42.1, lowerBound: 41.1, upperBound: 43.1 },
      { month: "May 27", depth: 42.9, lowerBound: 41.8, upperBound: 44.0 },
      { month: "Jun 27", depth: 43.4, lowerBound: 42.1, upperBound: 44.7 },
      { month: "Jul 27", depth: 42.0, lowerBound: 40.8, upperBound: 43.2 },
      { month: "Aug 27", depth: 40.2, lowerBound: 38.9, upperBound: 41.5 },
      { month: "Sep 27", depth: 39.1, lowerBound: 37.8, upperBound: 40.4 },
      { month: "Oct 27", depth: 39.7, lowerBound: 38.3, upperBound: 41.1 },
    ],
    recommendations: [
      "Incentivize 25% acreage shift from Summer Paddy (Boro/Sathi) to Direct-Seeded Rice (DSR) and Maize.",
      "Install solar automated tensiometers to cut pumping cycles by 35%.",
      "Mandate artificial groundwater recharge shafts in existing agricultural drainage ponds.",
      "Leverage PM-KUSUM for regulated micro-irrigation scheduling."
    ]
  },
  {
    id: "RJ-JDP-02",
    name: "Osian Block",
    district: "Jodhpur",
    state: "Rajasthan",
    coordinates: [26.7264, 72.8753],
    riskLevel: "Critical",
    currentDepthMeters: 53.6,
    depthTrendMetersPerYear: -1.20,
    stageOfExtraction: 198.4,
    annualRainfallMm: 310,
    rainfallDeficitPercent: -26.0,
    aquiferType: "Sandstone & Fractured Sedimentary",
    soilType: "Arid Sandy Desert Soil",
    primaryCrops: [
      { name: "Bajra (Pearl Millet)", areaPercent: 44, waterIntensive: false, waterReqMm: 320 },
      { name: "Mustard & Guar", areaPercent: 36, waterIntensive: false, waterReqMm: 350 },
      { name: "Groundnut (Tubewell)", areaPercent: 20, waterIntensive: true, waterReqMm: 700 }
    ],
    borewellDensityPerSqKm: 28,
    pumpingHoursDaily: 11.0,
    historicalDepth: [
      { year: "2018", preMonsoon: 44.0, postMonsoon: 43.1 },
      { year: "2020", preMonsoon: 46.8, postMonsoon: 45.9 },
      { year: "2022", preMonsoon: 49.5, postMonsoon: 48.7 },
      { year: "2024", preMonsoon: 52.4, postMonsoon: 51.5 },
      { year: "2026", preMonsoon: 54.8, postMonsoon: 53.6 },
    ],
    forecast12Months: [
      { month: "Nov 26", depth: 53.9, lowerBound: 53.3, upperBound: 54.5 },
      { month: "Jan 27", depth: 54.6, lowerBound: 53.9, upperBound: 55.3 },
      { month: "Mar 27", depth: 55.4, lowerBound: 54.5, upperBound: 56.3 },
      { month: "May 27", depth: 56.5, lowerBound: 55.4, upperBound: 57.6 },
      { month: "Jul 27", depth: 55.8, lowerBound: 54.6, upperBound: 57.0 },
      { month: "Sep 27", depth: 54.7, lowerBound: 53.5, upperBound: 55.9 },
    ],
    recommendations: [
      "Strict ban on commercial flood irrigation for high water crops in hyper-arid zones.",
      "Subsidize rooftop & farm-scale Kundi/Taanka rainwater harvesting cisterns.",
      "Expand drought-hardy pulses (Moth bean, Moong) and medicinal Isabgol cultivation."
    ]
  },
  {
    id: "HR-KRN-03",
    name: "Karnal Sadar",
    district: "Karnal",
    state: "Haryana",
    coordinates: [29.6857, 76.9905],
    riskLevel: "Watch",
    currentDepthMeters: 22.4,
    depthTrendMetersPerYear: -0.42,
    stageOfExtraction: 88.5,
    annualRainfallMm: 680,
    rainfallDeficitPercent: -8.5,
    aquiferType: "Yamuna Alluvium",
    soilType: "Loamy Alluvial Soil",
    primaryCrops: [
      { name: "Basmati Paddy", areaPercent: 48, waterIntensive: true, waterReqMm: 1100 },
      { name: "Wheat", areaPercent: 40, waterIntensive: false, waterReqMm: 440 },
      { name: "Sugarcane", areaPercent: 12, waterIntensive: true, waterReqMm: 1500 }
    ],
    borewellDensityPerSqKm: 34,
    pumpingHoursDaily: 7.2,
    historicalDepth: [
      { year: "2018", preMonsoon: 19.5, postMonsoon: 18.2 },
      { year: "2020", preMonsoon: 20.8, postMonsoon: 19.6 },
      { year: "2022", preMonsoon: 21.9, postMonsoon: 20.7 },
      { year: "2024", preMonsoon: 23.0, postMonsoon: 21.9 },
      { year: "2026", preMonsoon: 23.8, postMonsoon: 22.4 },
    ],
    forecast12Months: [
      { month: "Nov 26", depth: 22.6, lowerBound: 22.1, upperBound: 23.1 },
      { month: "Jan 27", depth: 23.2, lowerBound: 22.6, upperBound: 23.8 },
      { month: "Mar 27", depth: 23.9, lowerBound: 23.2, upperBound: 24.6 },
      { month: "May 27", depth: 24.7, lowerBound: 23.9, upperBound: 25.5 },
      { month: "Jul 27", depth: 23.4, lowerBound: 22.5, upperBound: 24.3 },
      { month: "Sep 27", depth: 22.8, lowerBound: 21.9, upperBound: 23.7 },
    ],
    recommendations: [
      "Promote 'Mera Pani Meri Virasat' incentive for moving away from paddy.",
      "Laser land leveling across 100% of irrigated acreage to reduce field loss by 20%.",
      "Introduce canal conjunctive use scheduling."
    ]
  },
  {
    id: "MH-AUR-04",
    name: "Paithan Block",
    district: "Chhatrapati Sambhaji Nagar",
    state: "Maharashtra",
    coordinates: [19.4795, 75.3854],
    riskLevel: "Watch",
    currentDepthMeters: 14.8,
    depthTrendMetersPerYear: -0.36,
    stageOfExtraction: 79.2,
    annualRainfallMm: 720,
    rainfallDeficitPercent: -12.0,
    aquiferType: "Deccan Trap Basalt (Hard Rock Fractured)",
    soilType: "Deep Black Cotton Soil (Vertisol)",
    primaryCrops: [
      { name: "Cotton", areaPercent: 42, waterIntensive: false, waterReqMm: 550 },
      { name: "Soybean", areaPercent: 32, waterIntensive: false, waterReqMm: 450 },
      { name: "Sugarcane", areaPercent: 26, waterIntensive: true, waterReqMm: 1800 }
    ],
    borewellDensityPerSqKm: 22,
    pumpingHoursDaily: 6.0,
    historicalDepth: [
      { year: "2018", preMonsoon: 13.0, postMonsoon: 9.8 },
      { year: "2020", preMonsoon: 14.2, postMonsoon: 11.0 },
      { year: "2022", preMonsoon: 15.6, postMonsoon: 12.4 },
      { year: "2024", preMonsoon: 16.4, postMonsoon: 13.5 },
      { year: "2026", preMonsoon: 17.5, postMonsoon: 14.8 },
    ],
    forecast12Months: [
      { month: "Nov 26", depth: 14.9, lowerBound: 14.4, upperBound: 15.4 },
      { month: "Jan 27", depth: 15.6, lowerBound: 15.0, upperBound: 16.2 },
      { month: "Mar 27", depth: 16.5, lowerBound: 15.8, upperBound: 17.2 },
      { month: "May 27", depth: 17.8, lowerBound: 17.0, upperBound: 18.6 },
      { month: "Jul 27", depth: 15.2, lowerBound: 14.2, upperBound: 16.2 },
      { month: "Sep 27", depth: 14.3, lowerBound: 13.4, upperBound: 15.2 },
    ],
    recommendations: [
      "Strict drip irrigation mandate for all perennial sugarcane cultivators.",
      "Desilt check dams and nalas under Jalyukt Shivar Abhiyan.",
      "Shift post-kharif water to sorghum (Jowar) and chickpeas."
    ]
  },
  {
    id: "KA-KOL-05",
    name: "Kolar Central",
    district: "Kolar",
    state: "Karnataka",
    coordinates: [13.1367, 78.1291],
    riskLevel: "Critical",
    currentDepthMeters: 46.2,
    depthTrendMetersPerYear: -1.05,
    stageOfExtraction: 178.6,
    annualRainfallMm: 740,
    rainfallDeficitPercent: -22.5,
    aquiferType: "Granitic Hard Rock (Fractured Gneiss)",
    soilType: "Red Sandy Loam",
    primaryCrops: [
      { name: "Tomato & Vegetables", areaPercent: 40, waterIntensive: true, waterReqMm: 600 },
      { name: "Ragi (Finger Millet)", areaPercent: 35, waterIntensive: false, waterReqMm: 310 },
      { name: "Mulberry (Sericulture)", areaPercent: 25, waterIntensive: false, waterReqMm: 450 }
    ],
    borewellDensityPerSqKm: 56,
    pumpingHoursDaily: 10.5,
    historicalDepth: [
      { year: "2018", preMonsoon: 37.8, postMonsoon: 36.5 },
      { year: "2020", preMonsoon: 40.5, postMonsoon: 39.2 },
      { year: "2022", preMonsoon: 43.1, postMonsoon: 41.9 },
      { year: "2024", preMonsoon: 45.8, postMonsoon: 44.5 },
      { year: "2026", preMonsoon: 48.0, postMonsoon: 46.2 },
    ],
    forecast12Months: [
      { month: "Nov 26", depth: 46.5, lowerBound: 45.8, upperBound: 47.2 },
      { month: "Jan 27", depth: 47.3, lowerBound: 46.5, upperBound: 48.1 },
      { month: "Mar 27", depth: 48.2, lowerBound: 47.3, upperBound: 49.1 },
      { month: "May 27", depth: 49.4, lowerBound: 48.4, upperBound: 50.4 },
      { month: "Jul 27", depth: 48.1, lowerBound: 47.0, upperBound: 49.2 },
      { month: "Sep 27", depth: 46.8, lowerBound: 45.7, upperBound: 47.9 },
    ],
    recommendations: [
      "Limit borewell drilling depths beyond 150m via local Panchayati groundwater boards.",
      "Subsidized mulching paper and precision drip for tomato clusters.",
      "Revitalize community percolation tanks using KC Valley treated inflows."
    ]
  },
  {
    id: "UP-VRN-06",
    name: "Arajiline Block",
    district: "Varanasi",
    state: "Uttar Pradesh",
    coordinates: [25.2812, 82.8821],
    riskLevel: "Safe",
    currentDepthMeters: 8.8,
    depthTrendMetersPerYear: +0.08,
    stageOfExtraction: 62.4,
    annualRainfallMm: 1040,
    rainfallDeficitPercent: +4.2,
    aquiferType: "Central Gangetic Deep Alluvial",
    soilType: "Fine Silt & Clayey Alluvium",
    primaryCrops: [
      { name: "Paddy", areaPercent: 45, waterIntensive: true, waterReqMm: 1150 },
      { name: "Wheat", areaPercent: 35, waterIntensive: false, waterReqMm: 420 },
      { name: "Vegetables & Mustard", areaPercent: 20, waterIntensive: false, waterReqMm: 330 }
    ],
    borewellDensityPerSqKm: 18,
    pumpingHoursDaily: 4.8,
    historicalDepth: [
      { year: "2018", preMonsoon: 9.8, postMonsoon: 8.2 },
      { year: "2020", preMonsoon: 9.5, postMonsoon: 7.9 },
      { year: "2022", preMonsoon: 9.9, postMonsoon: 8.3 },
      { year: "2024", preMonsoon: 9.4, postMonsoon: 7.8 },
      { year: "2026", preMonsoon: 9.6, postMonsoon: 8.8 },
    ],
    forecast12Months: [
      { month: "Nov 26", depth: 8.9, lowerBound: 8.5, upperBound: 9.3 },
      { month: "Jan 27", depth: 9.3, lowerBound: 8.8, upperBound: 9.8 },
      { month: "Mar 27", depth: 9.8, lowerBound: 9.2, upperBound: 10.4 },
      { month: "May 27", depth: 10.4, lowerBound: 9.7, upperBound: 11.1 },
      { month: "Jul 27", depth: 8.9, lowerBound: 8.2, upperBound: 9.6 },
      { month: "Sep 27", depth: 8.4, lowerBound: 7.8, upperBound: 9.0 },
    ],
    recommendations: [
      "Maintain active recharge structures to preserve Safe category aquifer status.",
      "Enhance drainage management to prevent seasonal waterlogging in low-lying pockets.",
      "Support solar micro-irrigation for winter vegetable nurseries."
    ]
  },
  {
    id: "GJ-BAN-07",
    name: "Deesa Block",
    district: "Banaskantha",
    state: "Gujarat",
    coordinates: [24.2586, 72.1792],
    riskLevel: "Watch",
    currentDepthMeters: 28.5,
    depthTrendMetersPerYear: -0.48,
    stageOfExtraction: 86.8,
    annualRainfallMm: 620,
    rainfallDeficitPercent: -14.2,
    aquiferType: "Semi-consolidated Quaternary Alluvium",
    soilType: "Sandy Loam to Fine Sand",
    primaryCrops: [
      { name: "Potato", areaPercent: 46, waterIntensive: true, waterReqMm: 650 },
      { name: "Castor & Mustard", areaPercent: 34, waterIntensive: false, waterReqMm: 380 },
      { name: "Bajra (Summer)", areaPercent: 20, waterIntensive: false, waterReqMm: 340 }
    ],
    borewellDensityPerSqKm: 31,
    pumpingHoursDaily: 6.8,
    historicalDepth: [
      { year: "2018", preMonsoon: 24.2, postMonsoon: 22.8 },
      { year: "2020", preMonsoon: 25.6, postMonsoon: 24.3 },
      { year: "2022", preMonsoon: 27.1, postMonsoon: 25.9 },
      { year: "2024", preMonsoon: 28.7, postMonsoon: 27.2 },
      { year: "2026", preMonsoon: 29.9, postMonsoon: 28.5 },
    ],
    forecast12Months: [
      { month: "Nov 26", depth: 28.8, lowerBound: 28.2, upperBound: 29.4 },
      { month: "Jan 27", depth: 29.5, lowerBound: 28.8, upperBound: 30.2 },
      { month: "Mar 27", depth: 30.3, lowerBound: 29.5, upperBound: 31.1 },
      { month: "May 27", depth: 31.2, lowerBound: 30.3, upperBound: 32.1 },
      { month: "Jul 27", depth: 29.6, lowerBound: 28.7, upperBound: 30.5 },
      { month: "Sep 27", depth: 28.7, lowerBound: 27.8, upperBound: 29.6 },
    ],
    recommendations: [
      "Expand sprinkler adoption for potato furrow watering (reduces 30% consumption).",
      "Encourage community borewell pooling to avert predatory drawdowns.",
      "Scale check dams along the Banas river basin catchment."
    ]
  },
  {
    id: "TN-CBE-08",
    name: "Pollachi North",
    district: "Coimbatore",
    state: "Tamil Nadu",
    coordinates: [10.6609, 77.0048],
    riskLevel: "Watch",
    currentDepthMeters: 19.8,
    depthTrendMetersPerYear: -0.38,
    stageOfExtraction: 84.1,
    annualRainfallMm: 850,
    rainfallDeficitPercent: -9.8,
    aquiferType: "Charnockite & Hornblende Gneiss (Hard Rock)",
    soilType: "Red Gravelly to Clay Loam",
    primaryCrops: [
      { name: "Coconut Plantations", areaPercent: 55, waterIntensive: true, waterReqMm: 1100 },
      { name: "Vegetables & Tomato", areaPercent: 25, waterIntensive: false, waterReqMm: 480 },
      { name: "Nutritious Millets", areaPercent: 20, waterIntensive: false, waterReqMm: 300 }
    ],
    borewellDensityPerSqKm: 27,
    pumpingHoursDaily: 6.2,
    historicalDepth: [
      { year: "2018", preMonsoon: 17.5, postMonsoon: 16.2 },
      { year: "2020", preMonsoon: 18.4, postMonsoon: 17.1 },
      { year: "2022", preMonsoon: 19.5, postMonsoon: 18.2 },
      { year: "2024", preMonsoon: 20.3, postMonsoon: 19.0 },
      { year: "2026", preMonsoon: 21.1, postMonsoon: 19.8 },
    ],
    forecast12Months: [
      { month: "Nov 26", depth: 19.9, lowerBound: 19.4, upperBound: 20.4 },
      { month: "Jan 27", depth: 20.4, lowerBound: 19.8, upperBound: 21.0 },
      { month: "Mar 27", depth: 21.2, lowerBound: 20.5, upperBound: 21.9 },
      { month: "May 27", depth: 22.0, lowerBound: 21.2, upperBound: 22.8 },
      { month: "Jul 27", depth: 20.6, lowerBound: 19.8, upperBound: 21.4 },
      { month: "Sep 27", depth: 20.0, lowerBound: 19.2, upperBound: 20.8 },
    ],
    recommendations: [
      "Mandate subsurface drip irrigation in mature coconut grooves.",
      "Coir pith mulching to conserve topsoil moisture during intense heat spikes.",
      "Recharge borewells with rainwater run-off from coconut drying yards."
    ]
  },
  {
    id: "MP-HOS-09",
    name: "Narmadapuram Sadar",
    district: "Narmadapuram",
    state: "Madhya Pradesh",
    coordinates: [22.7533, 77.7249],
    riskLevel: "Safe",
    currentDepthMeters: 7.4,
    depthTrendMetersPerYear: +0.05,
    stageOfExtraction: 54.3,
    annualRainfallMm: 1220,
    rainfallDeficitPercent: +6.5,
    aquiferType: "Narmada Alluvial Valley",
    soilType: "Deep Heavy Black Soil",
    primaryCrops: [
      { name: "Wheat (Sharbati)", areaPercent: 52, waterIntensive: false, waterReqMm: 420 },
      { name: "Soybean", areaPercent: 36, waterIntensive: false, waterReqMm: 460 },
      { name: "Summer Moong", areaPercent: 12, waterIntensive: false, waterReqMm: 300 }
    ],
    borewellDensityPerSqKm: 14,
    pumpingHoursDaily: 4.2,
    historicalDepth: [
      { year: "2018", preMonsoon: 8.2, postMonsoon: 6.9 },
      { year: "2020", preMonsoon: 8.0, postMonsoon: 6.8 },
      { year: "2022", preMonsoon: 8.4, postMonsoon: 7.1 },
      { year: "2024", preMonsoon: 8.1, postMonsoon: 6.9 },
      { year: "2026", preMonsoon: 8.3, postMonsoon: 7.4 },
    ],
    forecast12Months: [
      { month: "Nov 26", depth: 7.5, lowerBound: 7.1, upperBound: 7.9 },
      { month: "Jan 27", depth: 7.9, lowerBound: 7.4, upperBound: 8.4 },
      { month: "Mar 27", depth: 8.4, lowerBound: 7.8, upperBound: 9.0 },
      { month: "May 27", depth: 8.9, lowerBound: 8.2, upperBound: 9.6 },
      { month: "Jul 27", depth: 7.6, lowerBound: 7.0, upperBound: 8.2 },
      { month: "Sep 27", depth: 7.1, lowerBound: 6.6, upperBound: 7.6 },
    ],
    recommendations: [
      "Prevent over-irrigation during Rabi wheat through automated canal sluices.",
      "Sustain soil organic carbon via no-till residue retention.",
      "Monitor nitrate runoff from intensive fertilizer applications."
    ]
  },
  {
    id: "AP-ANA-10",
    name: "Dharmavaram Block",
    district: "Anantapur",
    state: "Andhra Pradesh",
    coordinates: [14.4144, 77.7196],
    riskLevel: "Critical",
    currentDepthMeters: 41.2,
    depthTrendMetersPerYear: -0.92,
    stageOfExtraction: 142.7,
    annualRainfallMm: 550,
    rainfallDeficitPercent: -24.1,
    aquiferType: "Archean Granitic Gneiss (Hard Rock)",
    soilType: "Red Gravelly Sandy Loam",
    primaryCrops: [
      { name: "Groundnut", areaPercent: 48, waterIntensive: false, waterReqMm: 450 },
      { name: "Paddy (Tubewell)", areaPercent: 28, waterIntensive: true, waterReqMm: 1200 },
      { name: "Sweet Orange / Horticulture", areaPercent: 24, waterIntensive: false, waterReqMm: 650 }
    ],
    borewellDensityPerSqKm: 46,
    pumpingHoursDaily: 9.8,
    historicalDepth: [
      { year: "2018", preMonsoon: 33.5, postMonsoon: 32.2 },
      { year: "2020", preMonsoon: 35.8, postMonsoon: 34.6 },
      { year: "2022", preMonsoon: 38.2, postMonsoon: 37.0 },
      { year: "2024", preMonsoon: 40.6, postMonsoon: 39.4 },
      { year: "2026", preMonsoon: 42.8, postMonsoon: 41.2 },
    ],
    forecast12Months: [
      { month: "Nov 26", depth: 41.5, lowerBound: 40.8, upperBound: 42.2 },
      { month: "Jan 27", depth: 42.4, lowerBound: 41.6, upperBound: 43.2 },
      { month: "Mar 27", depth: 43.3, lowerBound: 42.4, upperBound: 44.2 },
      { month: "May 27", depth: 44.6, lowerBound: 43.5, upperBound: 45.7 },
      { month: "Jul 27", depth: 43.2, lowerBound: 42.0, upperBound: 44.4 },
      { month: "Sep 27", depth: 41.8, lowerBound: 40.7, upperBound: 42.9 },
    ],
    recommendations: [
      "Phase out tubewell paddy completely in favor of millets (Korralu/Foxtail) and pulses.",
      "Expand YSR Jalakala community solar pumps with recharge pits.",
      "Promote farm ponds (Panta Sanjeevani) for critical supplementary irrigation."
    ]
  }
];

export const STATES_DATA = [
  {
    state: "Punjab",
    totalBlocks: 153,
    safeBlocks: 22,
    watchBlocks: 5,
    criticalBlocks: 126,
    stageOfExtraction: 164.4,
    safePercent: 14.4,
    watchPercent: 3.3,
    criticalPercent: 82.3,
    avgDepthMeters: 28.5,
    avgYearlyDecline: -0.85,
    monitoringWellsCount: 1482,
    annualRechargeBcm: 19.5,
    annualDraftBcm: 32.1,
    primaryRiskDriver: "Extensive flood-irrigated Paddy monoculture & free tubewell power",
    dominantAquifer: "Deep Indo-Gangetic Alluvial",
    dominantCrops: "Paddy, Wheat, Cotton"
  },
  {
    state: "Rajasthan",
    totalBlocks: 302,
    safeBlocks: 37,
    watchBlocks: 26,
    criticalBlocks: 239,
    stageOfExtraction: 151.1,
    safePercent: 12.3,
    watchPercent: 8.6,
    criticalPercent: 79.1,
    avgDepthMeters: 36.2,
    avgYearlyDecline: -0.94,
    monitoringWellsCount: 2340,
    annualRechargeBcm: 11.8,
    annualDraftBcm: 17.8,
    primaryRiskDriver: "Hyper-arid climate, low rainfall (<400mm), tubewell cash crops",
    dominantAquifer: "Sandstone & Hard Rock",
    dominantCrops: "Bajra, Mustard, Groundnut, Wheat"
  },
  {
    state: "Haryana",
    totalBlocks: 143,
    safeBlocks: 32,
    watchBlocks: 18,
    criticalBlocks: 93,
    stageOfExtraction: 134.6,
    safePercent: 22.4,
    watchPercent: 12.6,
    criticalPercent: 65.0,
    avgDepthMeters: 21.0,
    avgYearlyDecline: -0.62,
    monitoringWellsCount: 1120,
    annualRechargeBcm: 10.2,
    annualDraftBcm: 13.7,
    primaryRiskDriver: "Intensive paddy-wheat rotation and canal tail-end deficits",
    dominantAquifer: "Alluvium",
    dominantCrops: "Basmati Paddy, Wheat, Mustard, Sugarcane"
  },
  {
    state: "Tamil Nadu",
    totalBlocks: 388,
    safeBlocks: 134,
    watchBlocks: 62,
    criticalBlocks: 192,
    stageOfExtraction: 77.3,
    safePercent: 34.5,
    watchPercent: 16.0,
    criticalPercent: 49.5,
    avgDepthMeters: 17.4,
    avgYearlyDecline: -0.44,
    monitoringWellsCount: 3120,
    annualRechargeBcm: 22.4,
    annualDraftBcm: 17.3,
    primaryRiskDriver: "Hard rock low storativity aquifers combined with erratic NE monsoon",
    dominantAquifer: "Crystalline Hard Rock (Gneiss/Charnockite)",
    dominantCrops: "Paddy, Sugarcane, Coconut, Groundnut"
  },
  {
    state: "Karnataka",
    totalBlocks: 236,
    safeBlocks: 124,
    watchBlocks: 38,
    criticalBlocks: 74,
    stageOfExtraction: 69.8,
    safePercent: 52.5,
    watchPercent: 16.1,
    criticalPercent: 31.4,
    avgDepthMeters: 19.8,
    avgYearlyDecline: -0.52,
    monitoringWellsCount: 1890,
    annualRechargeBcm: 18.1,
    annualDraftBcm: 12.6,
    primaryRiskDriver: "Borewell over-drilling (>200m) in granite regions for horticulture",
    dominantAquifer: "Hard Rock (Granite / Schist)",
    dominantCrops: "Ragi, Maize, Sugarcane, Vegetables"
  },
  {
    state: "Gujarat",
    totalBlocks: 251,
    safeBlocks: 171,
    watchBlocks: 32,
    criticalBlocks: 48,
    stageOfExtraction: 53.4,
    safePercent: 68.1,
    watchPercent: 12.7,
    criticalPercent: 19.1,
    avgDepthMeters: 18.2,
    avgYearlyDecline: -0.32,
    monitoringWellsCount: 1750,
    annualRechargeBcm: 26.4,
    annualDraftBcm: 14.1,
    primaryRiskDriver: "Coastal salinity ingress in Saurashtra and cash-crop tubewell pumping in North Gujarat",
    dominantAquifer: "Alluvium & Basalt",
    dominantCrops: "Cotton, Groundnut, Potato, Castor"
  },
  {
    state: "Maharashtra",
    totalBlocks: 353,
    safeBlocks: 279,
    watchBlocks: 46,
    criticalBlocks: 28,
    stageOfExtraction: 53.1,
    safePercent: 79.0,
    watchPercent: 13.0,
    criticalPercent: 7.9,
    avgDepthMeters: 12.4,
    avgYearlyDecline: -0.28,
    monitoringWellsCount: 2980,
    annualRechargeBcm: 32.6,
    annualDraftBcm: 17.3,
    primaryRiskDriver: "Water-guzzling sugarcane in rain-shadow Marathwada/Western belt",
    dominantAquifer: "Deccan Traps (Basalt)",
    dominantCrops: "Soybean, Cotton, Sugarcane, Jowar"
  },
  {
    state: "Uttar Pradesh",
    totalBlocks: 826,
    safeBlocks: 658,
    watchBlocks: 86,
    criticalBlocks: 82,
    stageOfExtraction: 68.7,
    safePercent: 79.7,
    watchPercent: 10.4,
    criticalPercent: 9.9,
    avgDepthMeters: 11.2,
    avgYearlyDecline: -0.21,
    monitoringWellsCount: 5420,
    annualRechargeBcm: 72.8,
    annualDraftBcm: 50.0,
    primaryRiskDriver: "Western UP tubewell density and sugar mills encouragement",
    dominantAquifer: "Ganga-Yamuna Deep Alluvium",
    dominantCrops: "Wheat, Paddy, Sugarcane, Pulses"
  },
  {
    state: "Madhya Pradesh",
    totalBlocks: 317,
    safeBlocks: 265,
    watchBlocks: 32,
    criticalBlocks: 20,
    stageOfExtraction: 56.4,
    safePercent: 83.6,
    watchPercent: 10.1,
    criticalPercent: 6.3,
    avgDepthMeters: 9.8,
    avgYearlyDecline: -0.18,
    monitoringWellsCount: 2650,
    annualRechargeBcm: 36.5,
    annualDraftBcm: 20.6,
    primaryRiskDriver: "Summer moong expansion and canal seepage disparities",
    dominantAquifer: "Alluvium & Vindhyan Sandstone",
    dominantCrops: "Wheat, Soybean, Gram, Mustard"
  },
  {
    state: "Andhra Pradesh",
    totalBlocks: 671,
    safeBlocks: 538,
    watchBlocks: 78,
    criticalBlocks: 55,
    stageOfExtraction: 32.8,
    safePercent: 80.2,
    watchPercent: 11.6,
    criticalPercent: 8.2,
    avgDepthMeters: 14.5,
    avgYearlyDecline: -0.24,
    monitoringWellsCount: 2140,
    annualRechargeBcm: 27.2,
    annualDraftBcm: 8.9,
    primaryRiskDriver: "Rayalaseema drought belt tubewell failures",
    dominantAquifer: "Granitic & Coastal Sedimentary",
    dominantCrops: "Paddy, Groundnut, Cotton, Chillies"
  }
];

export const CROPS_METADATA = [
  {
    id: "paddy",
    name: "Paddy (Traditional Flood)",
    shortName: "Paddy",
    category: "Cereals",
    waterReqMm: 1250,
    waterReqCubicMetersPerHa: 12500,
    avgYieldQuintalPerHa: 45,
    expectedIncomePerHa: 95000,
    waterEfficiencyScore: 1.8, // out of 10
    isWaterIntensive: true,
    riskFactor: "High"
  },
  {
    id: "maize",
    name: "Maize (Corn)",
    shortName: "Maize",
    category: "Coarse Cereals",
    waterReqMm: 480,
    waterReqCubicMetersPerHa: 4800,
    avgYieldQuintalPerHa: 50,
    expectedIncomePerHa: 76000,
    waterEfficiencyScore: 7.5,
    isWaterIntensive: false,
    riskFactor: "Low"
  },
  {
    id: "dsr_paddy",
    name: "Direct Seeded Rice (DSR)",
    shortName: "DSR Paddy",
    category: "Cereals",
    waterReqMm: 900,
    waterReqCubicMetersPerHa: 9000,
    avgYieldQuintalPerHa: 42,
    expectedIncomePerHa: 92000,
    waterEfficiencyScore: 5.5,
    isWaterIntensive: false,
    riskFactor: "Medium"
  },
  {
    id: "wheat",
    name: "Wheat (Rabi)",
    shortName: "Wheat",
    category: "Cereals",
    waterReqMm: 450,
    waterReqCubicMetersPerHa: 4500,
    avgYieldQuintalPerHa: 48,
    expectedIncomePerHa: 78000,
    waterEfficiencyScore: 6.2,
    isWaterIntensive: false,
    riskFactor: "Medium"
  },
  {
    id: "millets",
    name: "Nutri-Millets (Bajra / Jowar / Ragi)",
    shortName: "Millets",
    category: "Millets",
    waterReqMm: 300,
    waterReqCubicMetersPerHa: 3000,
    avgYieldQuintalPerHa: 26,
    expectedIncomePerHa: 68000,
    waterEfficiencyScore: 9.4,
    isWaterIntensive: false,
    riskFactor: "Low"
  },
  {
    id: "pulses",
    name: "Pulses (Moong / Gram / Arhar)",
    shortName: "Pulses",
    category: "Pulses",
    waterReqMm: 280,
    waterReqCubicMetersPerHa: 2800,
    avgYieldQuintalPerHa: 18,
    expectedIncomePerHa: 72000,
    waterEfficiencyScore: 9.6,
    isWaterIntensive: false,
    riskFactor: "Low"
  },
  {
    id: "mustard",
    name: "Mustard / Oilseeds",
    shortName: "Mustard",
    category: "Oilseeds",
    waterReqMm: 320,
    waterReqCubicMetersPerHa: 3200,
    avgYieldQuintalPerHa: 20,
    expectedIncomePerHa: 65000,
    waterEfficiencyScore: 8.8,
    isWaterIntensive: false,
    riskFactor: "Low"
  },
  {
    id: "sugarcane",
    name: "Sugarcane (Perennial)",
    shortName: "Sugarcane",
    category: "Cash Crop",
    waterReqMm: 1800,
    waterReqCubicMetersPerHa: 18000,
    avgYieldQuintalPerHa: 820,
    expectedIncomePerHa: 165000,
    waterEfficiencyScore: 2.1,
    isWaterIntensive: true,
    riskFactor: "High"
  },
  {
    id: "cotton",
    name: "Cotton",
    shortName: "Cotton",
    category: "Fibre",
    waterReqMm: 600,
    waterReqCubicMetersPerHa: 6000,
    avgYieldQuintalPerHa: 22,
    expectedIncomePerHa: 88000,
    waterEfficiencyScore: 6.0,
    isWaterIntensive: false,
    riskFactor: "Medium"
  },
  {
    id: "drip_horticulture",
    name: "Drip Horticulture / Vegetables",
    shortName: "Drip Veg",
    category: "Horticulture",
    waterReqMm: 420,
    waterReqCubicMetersPerHa: 4200,
    avgYieldQuintalPerHa: 210,
    expectedIncomePerHa: 140000,
    waterEfficiencyScore: 8.9,
    isWaterIntensive: false,
    riskFactor: "Low"
  }
];

export const ADVISOR_SUGGESTED_QUESTIONS = [
  {
    id: "crop_change",
    en: "Should I change my crop?",
    hi: "क्या मुझे अपनी फसल बदलनी चाहिए?",
    pa: "ਕੀ ਮੈਨੂੰ ਆਪਣੀ ਫ਼ਸਲ ਬਦਲਣੀ ਚਾਹੀਦੀ ਹੈ?",
  },
  {
    id: "groundwater_declining",
    en: "Why is groundwater declining?",
    hi: "भूजल स्तर क्यों गिर रहा है?",
    pa: "ਧਰਤੀ ਹੇਠਲਾ ਪਾਣੀ ਕਿਉਂ ਡਿੱਗ ਰਿਹਾ ਹੈ?",
  },
  {
    id: "current_risk",
    en: "What is the current risk?",
    hi: "वर्तमान भूजल जोखिम क्या है?",
    pa: "ਮੌਜੂਦਾ ਪਾਣੀ ਦਾ ਜੋਖਮ ਕੀ ਹੈ?",
  },
  {
    id: "reduce_demand",
    en: "How can I reduce irrigation demand?",
    hi: "मैं सिंचाई की मांग कैसे कम कर सकता हूँ?",
    pa: "ਮੈਂ ਸਿੰਚਾਈ ਦੀ ਮੰਗ ਕਿਵੇਂ ਘਟਾ ਸਕਦਾ ਹਾਂ?",
  },
];

export const ADVISOR_PRESET_QUERIES = [
  "Should I change my crop?",
  "Why is groundwater declining?",
  "What is the current risk?",
  "How can I reduce irrigation demand?",
  "How can farmers reduce groundwater extraction while keeping income stable?",
  "What government subsidies exist under PMKSY for drip irrigation?",
];

export const MOCK_ADVISOR_RESPONSES = {
  sangrur: {
    title: "Groundwater Conservation Strategy for Sangrur Central (Punjab)",
    riskStatus: "Critical (Depth: 38.4m bgl, Extraction: 165%)",
    keyFindings: [
      "Paddy-wheat mono-cropping currently accounts for 90% of agricultural groundwater draft.",
      "The water table is sinking at an alarming rate of ~0.95 meters per year.",
      "Summer puddle preparation during May/June coincides with peak evaporation rates."
    ],
    recommendedActions: [
      {
        action: "Direct Seeded Rice (DSR) & Short-Duration PR-126",
        impact: "Saves ~20-25% irrigation water (approx 2,500 m³/ha) and reduces pumping electricity by 28%.",
        incentive: "Punjab State Govt provides ₹1,500/acre direct benefit transfer for verified DSR adoption."
      },
      {
        action: "Diversification to Summer Moong / Maize / Basmati",
        impact: "Cuts water usage by 60% compared to traditional non-basmati varieties.",
        incentive: "Assured MSP procurement support under National Food Security Mission."
      },
      {
        action: "Laser Land Leveling & Soil Tensiometer Installation",
        impact: "Improves water application uniformity, saving 15-20% water without any crop yield loss.",
        incentive: "Up to 50% capital subsidy under Sub-Mission on Agricultural Mechanization (SMAM)."
      }
    ],
    projectedOutcome: "If 30% of Sangrur's paddy acreage transitions to DSR and millets/pulses, net extraction drops by ~14.2 million m³/season, halting the negative depth spiral within 2.5 hydrological cycles."
  },
  subsidies: {
    title: "Government Schemes & Financial Assistance for Groundwater Management",
    riskStatus: "National Policy Guidance",
    keyFindings: [
      "Pradhan Mantri Krishi Sinchayee Yojana (PMKSY) - Per Drop More Crop (PDMC) provides substantial subsidies for micro-irrigation.",
      "Atal Bhujal Yojana (ABHY) operates in 7 states focusing on community-led groundwater demand management.",
      "PM-KUSUM Component-B supports solar agricultural pumps connected to micro-irrigation systems."
    ],
    recommendedActions: [
      {
        action: "Drip & Sprinkler Subsidies (PMKSY-PDMC)",
        impact: "55% subsidy for Small & Marginal farmers; 45% subsidy for other farmers.",
        incentive: "States like Haryana, Gujarat, and Tamil Nadu offer top-up subsidies reaching up to 75-85% total cost."
      },
      {
        action: "Atal Bhujal Yojana Water Security Plans",
        impact: "Gram Panchayat level incentives based on verified reduction in water extraction.",
        incentive: "Direct village infrastructure funds for building check dams and percolation ponds."
      },
      {
        action: "PM-KUSUM Solar Agricultural Pumps",
        impact: "Eliminates diesel emissions and enables metered, scheduled irrigation during daylight.",
        incentive: "60% total subsidy (30% Central + 30% State) with 30% bank loan and 10% farmer share."
      }
    ],
    projectedOutcome: "Farmers can access application forms through the respective state horticulture/agriculture portals or via their local Krishi Vigyan Kendra (KVK)."
  },
  generic: {
    title: "AI Agro-Hydrological Advisory",
    riskStatus: "Tailored Groundwater Recommendations",
    keyFindings: [
      "Groundwater sustainability requires balancing aquifer recharge rates with seasonal irrigation extraction.",
      "Soil moisture retention practices and precision watering are the fastest levers to prevent over-exploitation.",
      "Switching just 15-25% of acreage from flood-irrigated staples to nutri-cereals saves billions of liters."
    ],
    recommendedActions: [
      {
        action: "Adopt Micro-Irrigation (Drip / Micro-Sprinklers)",
        impact: "Reduces conveyance and evaporation losses by 40-60% while increasing crop yield by 15-20%.",
        incentive: "Eligible for PMKSY-PDMC subsidy via local district agriculture officer."
      },
      {
        action: "Implement Farm-Level Groundwater Recharge",
        impact: "Diverts filtered surplus monsoon runoff into defunct tubewells or recharge shafts.",
        incentive: "Technical design drawings and partial funding available via CGWB Model Recharge Schemes."
      },
      {
        action: "Soil Mulching and Organic Matter Enhancement",
        impact: "Reduces soil evaporation by up to 35% during peak hot-dry months.",
        incentive: "Incentivized through Paramparagat Krishi Vikas Yojana (PKVY)."
      }
    ],
    projectedOutcome: "Consistently applying these measures reduces localized drawdown rate by 0.35 to 0.70 meters annually."
  }
};
