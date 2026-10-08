// JalDrishti API Abstraction Layer
// Currently powered by realistic local mock data.
// Ready for direct transition to FastAPI backend endpoints.

import {
  NATIONAL_STATS,
  BLOCKS_DATA,
  STATES_DATA,
  CROPS_METADATA
} from "../data/mockData";
import { askAdvisorChat } from "./apiClient";

// Simulate network latency for realistic loading states
const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

export const api = {
  // 1. National Overview
  async getNationalOverview() {
    await delay();
    return { ...NATIONAL_STATS };
  },

  // 2. Blocks list with optional filters
  async getBlocks(filters = {}) {
    await delay();
    let result = [...BLOCKS_DATA];

    if (filters.state && filters.state !== "All") {
      result = result.filter((b) => b.state.toLowerCase() === filters.state.toLowerCase());
    }

    if (filters.riskLevel && filters.riskLevel !== "All") {
      result = result.filter((b) => b.riskLevel.toLowerCase() === filters.riskLevel.toLowerCase());
    }

    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.district.toLowerCase().includes(q) ||
          b.state.toLowerCase().includes(q) ||
          b.id.toLowerCase().includes(q)
      );
    }

    return result;
  },

  // 3. Single block detail
  async getBlockById(blockId) {
    await delay();
    if (!blockId) return BLOCKS_DATA[0];

    const cleanId = blockId.toLowerCase().replace(/-/g, " ");
    const block =
      BLOCKS_DATA.find((b) => b.id.toLowerCase() === blockId.toLowerCase()) ||
      BLOCKS_DATA.find((b) => b.name.toLowerCase().includes(cleanId) || cleanId.includes(b.name.toLowerCase())) ||
      BLOCKS_DATA[0];

    // Ensure all required fields exist
    const baseLat = block.coordinates[0];
    const baseLng = block.coordinates[1];

    const defaultWells = [
      {
        id: `DWLR-${block.id}-01`,
        name: `${block.name} Block HQ Station`,
        coordinates: [baseLat + 0.006, baseLng - 0.004],
        depthMeters: Number((block.currentDepthMeters - 0.3).toFixed(1)),
        type: "Digital Water Level Recorder (DWLR)",
        status: "Active Telemetry",
        battery: "96%",
      },
      {
        id: `DWLR-${block.id}-02`,
        name: `${block.district} East Observational Piezometer`,
        coordinates: [baseLat - 0.008, baseLng + 0.007],
        depthMeters: Number((block.currentDepthMeters + 0.6).toFixed(1)),
        type: "Piezometer Telemetry Station",
        status: "Active Telemetry",
        battery: "91%",
      },
      {
        id: `DWLR-${block.id}-03`,
        name: `${block.name} North Agricultural Grid`,
        coordinates: [baseLat + 0.012, baseLng + 0.003],
        depthMeters: Number((block.currentDepthMeters - 0.5).toFixed(1)),
        type: "Digital Water Level Recorder (DWLR)",
        status: "Active Telemetry",
        battery: "89%",
      },
      {
        id: `DWLR-${block.id}-04`,
        name: `Gram Panchayat Monitored Well`,
        coordinates: [baseLat - 0.005, baseLng - 0.009],
        depthMeters: Number((block.currentDepthMeters + 0.2).toFixed(1)),
        type: "Dug-cum-Bore Well Station",
        status: "Active Telemetry",
        battery: "84%",
      },
    ];

    const defaultRiskDrivers = [
      {
        id: "trend",
        title: "Declining Groundwater Trend",
        value: `${block.depthTrendMetersPerYear > 0 ? "+" : ""}${block.depthTrendMetersPerYear} m / year`,
        severity: block.depthTrendMetersPerYear < -0.8 ? "Critical" : block.depthTrendMetersPerYear < 0 ? "Watch" : "Safe",
        score: block.depthTrendMetersPerYear < -0.8 ? 92 : block.depthTrendMetersPerYear < 0 ? 65 : 20,
        description: `Annual drawdown of ${Math.abs(block.depthTrendMetersPerYear)} m/yr indicates chronic extraction exceeding natural aquifer recharge.`,
        impact: "Accelerated lowering of water column in shallow tubewells.",
      },
      {
        id: "rainfall",
        title: "Rainfall Variation",
        value: `${block.rainfallDeficitPercent}% Deficit`,
        severity: block.rainfallDeficitPercent < -15 ? "Critical" : block.rainfallDeficitPercent < 0 ? "Watch" : "Safe",
        score: Math.min(95, Math.max(15, Math.abs(block.rainfallDeficitPercent) * 3)),
        description: `Precipitation of ${block.annualRainfallMm} mm is currently ${block.rainfallDeficitPercent}% anomalous vs 30-year normal monsoon levels.`,
        impact: "Reduced percolation and slower seasonal hydraulic head recovery.",
      },
      {
        id: "irrigation",
        title: "Irrigation Pressure",
        value: `${block.stageOfExtraction}% Extraction`,
        severity: block.stageOfExtraction > 100 ? "Critical" : block.stageOfExtraction >= 70 ? "Watch" : "Safe",
        score: Math.min(100, Math.round(block.stageOfExtraction * 0.6)),
        description: `Total extraction vs dynamic replenishable resource is at ${block.stageOfExtraction}%. ${block.stageOfExtraction > 100 ? "Classified as Over-Exploited by CGWB." : ""}`,
        impact: `High pump run-time of ~${block.pumpingHoursDaily} hours daily across agricultural tubewells.`,
      },
      {
        id: "crops",
        title: "Crop Water Demand",
        value: `${block.primaryCrops?.[0]?.waterReqMm || 1100} mm / season`,
        severity: block.primaryCrops?.[0]?.waterIntensive ? "Critical" : "Watch",
        score: block.primaryCrops?.[0]?.waterIntensive ? 88 : 50,
        description: `${block.primaryCrops?.[0]?.areaPercent || 60}% acreage dominated by ${block.primaryCrops?.[0]?.name || "Paddy"} demanding intensive irrigation.`,
        impact: "Severe evapotranspiration loss during peak summer pre-sowing period.",
      },
    ];

    return {
      ...block,
      monitoringWellsCount: block.monitoringWellsCount || 24,
      latestReadingDate: block.latestReadingDate || "02 Oct 2026",
      monitoringWells: block.monitoringWells || defaultWells,
      riskDrivers: block.riskDrivers || defaultRiskDrivers,
    };
  },

  // 4. State comparisons
  async getStatesComparison() {
    await delay();
    return [...STATES_DATA];
  },

  // 5. Crops reference list for simulator
  async getCropsList() {
    await delay();
    return [...CROPS_METADATA];
  },

  // 6. Interactive Scenario Simulator Calculation (Ready for future POST /simulate)
  async runScenarioSimulation({
    blockId,
    state,
    district,
    block: blockNameParam,
    currentCropId = "paddy",
    replacementCropId = "maize",
    areaShiftPercent = 30,
    forecastHorizonSeasons = 2, // 1, 2, or 3
  }) {
    await delay(180);

    const cleanId = String(blockId || "").toLowerCase();
    const cleanName = String(blockNameParam || "").toLowerCase();
    const cleanDist = String(district || "").toLowerCase();
    const cleanState = String(state || "").toLowerCase();

    const matchedBlock =
      BLOCKS_DATA.find((b) => b.id?.toLowerCase() === cleanId) ||
      BLOCKS_DATA.find((b) => cleanName && b.name?.toLowerCase() === cleanName) ||
      BLOCKS_DATA.find(
        (b) =>
          cleanDist &&
          b.district?.toLowerCase() === cleanDist &&
          (!cleanState || b.state?.toLowerCase() === cleanState)
      ) ||
      BLOCKS_DATA.find((b) => cleanState && b.state?.toLowerCase() === cleanState);

    const resolvedBlockName =
      blockNameParam ||
      (matchedBlock && matchedBlock.id?.toLowerCase() === cleanId ? matchedBlock.name : "") ||
      district ||
      "Selected Block";
    const resolvedDistrict = district || matchedBlock?.district || "";
    const resolvedState = state || matchedBlock?.state || "";

    const block = {
      id: blockId || matchedBlock?.id || `${resolvedState}_${resolvedDistrict}_${resolvedBlockName}`,
      name: resolvedBlockName,
      district: resolvedDistrict,
      state: resolvedState,
      currentDepthMeters: matchedBlock?.currentDepthMeters ?? 28.5,
      depthTrendMetersPerYear: matchedBlock?.depthTrendMetersPerYear ?? -0.92,
      riskLevel: matchedBlock?.riskLevel ?? "Critical",
      stageOfExtraction: matchedBlock?.stageOfExtraction ?? 115.0,
      pumpingHoursDaily: matchedBlock?.pumpingHoursDaily ?? 9.5,
    };

    const currentCrop =
      CROPS_METADATA.find((c) => c.id === currentCropId) ||
      CROPS_METADATA.find((c) => c.id === "paddy") ||
      CROPS_METADATA[0];

    const replacementCrop =
      CROPS_METADATA.find((c) => c.id === replacementCropId) ||
      CROPS_METADATA.find((c) => c.id === "maize") ||
      CROPS_METADATA[1];

    // Crop water metrics (mm and m³/ha)
    const currentWaterReq = currentCrop.waterReqMm;
    const replacementWaterReq = replacementCrop.waterReqMm;
    const waterDifferenceMm = Math.max(0, currentWaterReq - replacementWaterReq);
    const waterDifferenceM3PerHa = Math.max(0, currentCrop.waterReqCubicMetersPerHa - replacementCrop.replacementWaterReqCubicMetersPerHa || (waterDifferenceMm * 10));

    // % reduction per shifted hectare
    const pctSavedOnShiftedAcreage = currentWaterReq > 0
      ? Number(((waterDifferenceMm / currentWaterReq) * 100).toFixed(1))
      : 0;

    // Total block irrigation water demand reduction (%)
    // Assuming dominant crop represents ~65% of block cultivated water budget
    const targetCropWeightInBlock = 0.65;
    const shiftFraction = areaShiftPercent / 100;
    const totalDemandReductionPercent = Number(
      (shiftFraction * pctSavedOnShiftedAcreage * targetCropWeightInBlock).toFixed(1)
    );

    // Volumetric baseline per season (MCM)
    const baseSeasonalDraftMcm = Number(((block.stageOfExtraction / 100) * 26.5).toFixed(1)); // ~25-45 MCM depending on extraction stage
    const seasonalWaterSavedMcm = Number(
      ((baseSeasonalDraftMcm * (totalDemandReductionPercent / 100))).toFixed(2)
    );
    const cumulativeWaterSavedMcm = Number(
      (seasonalWaterSavedMcm * forecastHorizonSeasons).toFixed(2)
    );

    // Groundwater hydraulic response
    // Natural seasonal drawdown rate (m/season)
    const baseSeasonalDrawdownM = Math.max(0.25, Math.abs(block.depthTrendMetersPerYear) * 0.5);
    
    // Hydraulic head recovery from conserved water column: ~0.085m per MCM saved
    const seasonalDepthRecoveryM = Number((seasonalWaterSavedMcm * 0.086).toFixed(2));
    const cumulativeDepthRecoveryM = Number(
      (seasonalDepthRecoveryM * forecastHorizonSeasons).toFixed(2)
    );

    // Projected depths after horizon (m bgl - higher value is deeper/worse)
    const baselineProjectedDepth = Number(
      (block.currentDepthMeters + (baseSeasonalDrawdownM * forecastHorizonSeasons)).toFixed(1)
    );
    const simulatedProjectedDepth = Number(
      Math.max(
        2.5,
        (block.currentDepthMeters + (baseSeasonalDrawdownM * forecastHorizonSeasons) - cumulativeDepthRecoveryM)
      ).toFixed(1)
    );
    const netDepthBenefitM = Number(
      Math.max(0.1, baselineProjectedDepth - simulatedProjectedDepth).toFixed(2)
    );

    // Extraction stage change
    const stageOriginal = block.stageOfExtraction;
    const stageProjected = Number(
      Math.max(38, (stageOriginal * (1 - (totalDemandReductionPercent / 100)))).toFixed(1)
    );
    const stageDifference = Number((stageOriginal - stageProjected).toFixed(1));

    // Risk classification mapping
    let newRiskLevel = "Safe";
    if (stageProjected > 100) {
      newRiskLevel = stageProjected < 115 && stageOriginal > 130 ? "Watch" : "Critical";
    } else if (stageProjected >= 70) {
      newRiskLevel = "Watch";
    } else {
      newRiskLevel = "Safe";
    }

    // Daily tubewell pumping reduction (hours)
    const baselinePumpingHrs = block.pumpingHoursDaily || 9.5;
    const pumpingHoursReduction = Number(
      (baselinePumpingHrs * (totalDemandReductionPercent / 100)).toFixed(1)
    );
    const projectedPumpingHrs = Number(
      Math.max(2.5, (baselinePumpingHrs - pumpingHoursReduction)).toFixed(1)
    );

    // Build Recharts Before/After Trend Timeline
    const curDepth = block.currentDepthMeters;
    const trendChartData = [
      {
        period: "Oct '24",
        label: "2 Years Ago",
        baselineDepth: Number((curDepth - 2.1).toFixed(1)),
        simulatedDepth: Number((curDepth - 2.1).toFixed(1)),
        isHistorical: true,
      },
      {
        period: "May '25",
        label: "Pre-Monsoon '25",
        baselineDepth: Number((curDepth - 1.4).toFixed(1)),
        simulatedDepth: Number((curDepth - 1.4).toFixed(1)),
        isHistorical: true,
      },
      {
        period: "Oct '25",
        label: "1 Year Ago",
        baselineDepth: Number((curDepth - 0.9).toFixed(1)),
        simulatedDepth: Number((curDepth - 0.9).toFixed(1)),
        isHistorical: true,
      },
      {
        period: "May '26",
        label: "Pre-Monsoon '26",
        baselineDepth: Number((curDepth - 0.4).toFixed(1)),
        simulatedDepth: Number((curDepth - 0.4).toFixed(1)),
        isHistorical: true,
      },
      {
        period: "Current",
        label: "Oct 2026 (Now)",
        baselineDepth: curDepth,
        simulatedDepth: curDepth,
        isCurrent: true,
      },
    ];

    // Forecast horizons
    const seasonNames = [
      { id: 1, name: "Season 1", label: "Kharif 2027" },
      { id: 2, name: "Season 2", label: "Rabi 2027-28" },
      { id: 3, name: "Season 3", label: "Kharif 2028" },
    ];

    for (let i = 1; i <= forecastHorizonSeasons; i++) {
      const s = seasonNames[i - 1];
      const baseD = Number((curDepth + (baseSeasonalDrawdownM * i)).toFixed(1));
      const simD = Number(
        Math.max(2.5, (curDepth + (baseSeasonalDrawdownM * i) - (seasonalDepthRecoveryM * i))).toFixed(1)
      );

      trendChartData.push({
        period: s.name,
        label: s.label,
        baselineDepth: baseD,
        simulatedDepth: simD,
        isForecast: true,
      });
    }

    return {
      blockId: block.id,
      blockName: block.name,
      district: block.district,
      state: block.state,
      currentCrop,
      replacementCrop,
      areaShiftPercent,
      forecastHorizonSeasons,

      // Impact summary
      groundwaterImpact: {
        depthRecoveryMeters: netDepthBenefitM,
        seasonalWaterSavedMcm,
        cumulativeWaterSavedMcm,
        currentDepthMeters: block.currentDepthMeters,
        baselineProjectedDepth,
        simulatedProjectedDepth,
      },

      waterDemandChange: {
        totalDemandReductionPercent,
        pctSavedOnShiftedAcreage,
        waterDifferenceM3PerHa,
        baselinePumpingHrs,
        projectedPumpingHrs,
        pumpingHoursReduction,
      },

      riskChange: {
        originalRiskLevel: block.riskLevel,
        newRiskLevel,
        stageOriginal,
        stageProjected,
        stageDifference,
      },

      currentScenario: {
        title: "Current Baseline Scenario",
        cropName: currentCrop.name,
        waterReqMm: currentCrop.waterReqMm,
        depthMeters: block.currentDepthMeters,
        stageOfExtraction: stageOriginal,
        riskLevel: block.riskLevel,
        annualTrend: `${block.depthTrendMetersPerYear} m/yr`,
        pumpingHours: `${baselinePumpingHrs} hrs/day`,
      },

      suggestedScenario: {
        title: "Simulated Intervention Scenario",
        cropName: replacementCrop.name,
        waterReqMm: replacementCrop.waterReqMm,
        areaShiftPercent,
        forecastHorizon: `${forecastHorizonSeasons} Season${forecastHorizonSeasons > 1 ? "s" : ""}`,
        projectedDepthMeters: simulatedProjectedDepth,
        stageOfExtraction: stageProjected,
        riskLevel: newRiskLevel,
        waterSavedMcm: cumulativeWaterSavedMcm,
        demandReductionPercent: totalDemandReductionPercent,
        pumpingHours: `${projectedPumpingHrs} hrs/day`,
      },

      trendChartData,

      // Future API Contract Payload (Ready for POST /simulate)
      apiContract: {
        endpoint: "POST /simulate",
        requestPayload: {
          state: block.state,
          district: block.district,
          block_id: block.id,
          crop_currently_grown: currentCrop.id,
          replacement_crop: replacementCrop.id,
          area_shift_percent: areaShiftPercent,
          forecast_horizon_seasons: forecastHorizonSeasons,
        },
      },
    };
  },

  // 7. JalDrishti Advisor Conversational Flow (Delegated to backend POST /api/advisor/chat)
  async askAdvisor(paramsOrQuery, currentBlock = null, preferredLang = "English") {
    let queryText = "";
    let language = preferredLang;
    let block = currentBlock || BLOCKS_DATA[0];
    let messages = [];

    if (typeof paramsOrQuery === "object" && paramsOrQuery !== null) {
      queryText = paramsOrQuery.query || "";
      language = paramsOrQuery.language || language;
      block = paramsOrQuery.block || block;
      messages = paramsOrQuery.messages || [];
    } else {
      queryText = paramsOrQuery || "";
    }

    const state = block?.state || "Punjab";
    const district = block?.district || "Bathinda";
    const blockName = block?.name || block?.block || "Talwandi Sabo";

    return await askAdvisorChat({
      query: queryText,
      state,
      district,
      block: blockName,
      language,
      messages,
    });
  },
};

export default api;
