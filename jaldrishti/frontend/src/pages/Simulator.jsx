import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Sliders,
  RotateCcw,
  Play,
  ArrowRight,
  Droplets,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Info,
  Sprout,
  Calendar,
  Layers,
  MapPin,
  CheckCircle2,
  Gauge,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from "recharts";
import { useGroundwater } from "../context/GroundwaterContext";
import { api } from "../api/mockClient";
import {
  getSupportedCrops,
  getBlockCrops,
  getBlockCanals,
  resolveBlockLocation,
} from "../api/apiClient";
import { BLOCKS_DATA, CROPS_METADATA } from "../data/mockData";
import PageContainer from "../components/layout/PageContainer";
import Card from "../components/common/Card";
import KpiCard from "../components/common/KpiCard";
import RiskBadge from "../components/common/RiskBadge";
import Button from "../components/common/Button";
import LoadingState from "../components/common/LoadingState";

/**
 * JalDrishti Irrigation Simulator (/simulator)
 * Clean two-column layout:
 * - LEFT: Scenario controls (State, District, Block, Current Crop, Replacement Crop, Area %, Horizon, "Run Simulation")
 * - RIGHT: Results (Impact, Demand Change, Risk Change, Current vs Suggested Scenario, Recharts Trend, Assumptions Card)
 * Ready for future POST /simulate integration.
 */
export default function Simulator() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { blocks, selectedState: globalState, setSelectedState } = useGroundwater();

  // All available blocks from dataset
  const allBlocks = useMemo(() => (blocks?.length ? blocks : BLOCKS_DATA), [blocks]);

  // Unique states
  const statesList = useMemo(() => {
    const set = new Set(allBlocks.map((b) => b.state));
    return Array.from(set).sort();
  }, [allBlocks]);

  // Read URL query params or defaults
  const queryBlockId = searchParams.get("blockId");
  const defaultBlock = useMemo(() => {
    if (queryBlockId) {
      const match = allBlocks.find((b) => b.id.toLowerCase() === queryBlockId.toLowerCase());
      if (match) return match;
    }
    return allBlocks[0] || null;
  }, [allBlocks, queryBlockId]);

  // 1. State Selector
  const [state, setState] = useState(defaultBlock?.state || "Punjab");

  // Filter districts based on selected State
  const districtsList = useMemo(() => {
    const set = new Set(
      allBlocks.filter((b) => b.state === state).map((b) => b.district)
    );
    return Array.from(set).sort();
  }, [allBlocks, state]);

  // 2. District Selector
  const [district, setDistrict] = useState(
    defaultBlock?.district && defaultBlock?.state === state
      ? defaultBlock.district
      : districtsList[0] || ""
  );

  // Filter blocks based on selected State and District
  const filteredBlocks = useMemo(() => {
    return allBlocks.filter(
      (b) => b.state === state && (district ? b.district === district : true)
    );
  }, [allBlocks, state, district]);

  // 3. Block Selector
  const [blockId, setBlockId] = useState(
    defaultBlock?.id && filteredBlocks.some((b) => b.id === defaultBlock.id)
      ? defaultBlock.id
      : filteredBlocks[0]?.id || allBlocks[0]?.id || ""
  );

  // 4. Crop currently grown (Default: paddy)
  const [currentCropId, setCurrentCropId] = useState("paddy");

  // 5. Replacement crop (Default: maize)
  const [replacementCropId, setReplacementCropId] = useState("maize");

  // 6. Area percentage slider (Default: 30%)
  const [areaPercent, setAreaPercent] = useState(30);

  // 7. Forecast horizon: 1 season | 2 seasons | 3 seasons (Default: 2)
  const [horizon, setHorizon] = useState(2);

  // UI & Simulation Results State
  const [simResult, setSimResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Backend crop & canal states loaded from FastAPI
  const [backendSupportedCrops, setBackendSupportedCrops] = useState([]);
  const [backendBlockCrops, setBackendBlockCrops] = useState([]);
  const [backendBlockCanals, setBackendBlockCanals] = useState([]);

  // 1. Fetch supported crops from backend (GET /api/crops/supported)
  useEffect(() => {
    let isMounted = true;
    async function fetchSupported() {
      try {
        const crops = await getSupportedCrops();
        if (isMounted && Array.isArray(crops) && crops.length > 0) {
          setBackendSupportedCrops(crops);
        }
      } catch (err) {
        console.warn("Supported crops endpoint unavailable:", err.message);
      }
    }
    fetchSupported();
    return () => {
      isMounted = false;
    };
  }, []);

  // Active selected block
  const activeBlock = useMemo(() => {
    return (
      filteredBlocks.find((b) => b.id === blockId) ||
      allBlocks.find((b) => b.id === blockId) ||
      filteredBlocks[0] ||
      allBlocks[0] ||
      null
    );
  }, [allBlocks, filteredBlocks, blockId]);

  // Selected crop objects
  const currentCrop = useMemo(() => {
    return (
      CROPS_METADATA.find((c) => c.id === currentCropId) ||
      CROPS_METADATA.find((c) => c.id === "paddy") ||
      CROPS_METADATA[0]
    );
  }, [currentCropId]);

  const replacementCrop = useMemo(() => {
    return (
      CROPS_METADATA.find((c) => c.id === replacementCropId) ||
      CROPS_METADATA.find((c) => c.id === "maize") ||
      CROPS_METADATA[1]
    );
  }, [replacementCropId]);

  // 2. Fetch block crop & canal features from backend (GET /api/crops and GET /api/canals)
  useEffect(() => {
    let isMounted = true;
    async function fetchBlockData() {
      if (!activeBlock) return;
      const loc = resolveBlockLocation(activeBlock.id, allBlocks);
      try {
        const [cropsRes, canalsRes] = await Promise.allSettled([
          getBlockCrops(loc.state, loc.district, loc.block),
          getBlockCanals(loc.state, loc.district, loc.block),
        ]);
        if (isMounted) {
          if (cropsRes.status === "fulfilled" && Array.isArray(cropsRes.value)) {
            setBackendBlockCrops(cropsRes.value);
          }
          if (canalsRes.status === "fulfilled" && Array.isArray(canalsRes.value)) {
            setBackendBlockCanals(canalsRes.value);
          }
        }
      } catch (err) {
        console.warn("Block crops/canals endpoint unavailable:", err.message);
      }
    }
    fetchBlockData();
    return () => {
      isMounted = false;
    };
  }, [state, district, activeBlock, allBlocks]);

  // Extract individual canal items from real backend data without fabricating names or locations
  const individualCanals = useMemo(() => {
    if (!backendBlockCanals || !Array.isArray(backendBlockCanals) || backendBlockCanals.length === 0) {
      return [];
    }

    const canalsList = [];

    backendBlockCanals.forEach((blockRecord) => {
      // 1. If backend explicitly provides canals array in record
      if (Array.isArray(blockRecord.canals) && blockRecord.canals.length > 0) {
        blockRecord.canals.forEach((c) => {
          canalsList.push({
            name: c.canal_name || c.name || "Canal Channel",
            block: c.block || blockRecord.block || activeBlock?.name || "",
            district: c.district || blockRecord.district || activeBlock?.district || "",
            state: c.state || blockRecord.state || activeBlock?.state || "",
            lengthKm: c.length_km != null ? Number(c.length_km) : null,
          });
        });
        return;
      }

      // 2. If blockRecord itself represents an individual canal with a name
      if (blockRecord.canal_name || blockRecord.name) {
        canalsList.push({
          name: blockRecord.canal_name || blockRecord.name,
          block: blockRecord.block || activeBlock?.name || "",
          district: blockRecord.district || activeBlock?.district || "",
          state: blockRecord.state || activeBlock?.state || "",
          lengthKm: blockRecord.length_km || blockRecord.canal_length_km,
        });
        return;
      }

      // 3. Decompose real canal channels from blockRecord
      const bName = blockRecord.block || activeBlock?.name || "";
      const dName = blockRecord.district || activeBlock?.district || "";
      const sName = blockRecord.state || activeBlock?.state || "";

      const mainLen = Number(blockRecord.main_canal_length_km || 0);
      const distLen = Number(blockRecord.distributary_length_km || 0);
      const minorLen = Number(blockRecord.minor_canal_length_km || 0);
      const totLen = Number(blockRecord.canal_length_km || 0);

      if (mainLen > 0) {
        canalsList.push({
          name: "Main Canal",
          block: bName,
          district: dName,
          state: sName,
          lengthKm: mainLen,
        });
      }
      if (distLen > 0) {
        canalsList.push({
          name: "Distributary Canal",
          block: bName,
          district: dName,
          state: sName,
          lengthKm: distLen,
        });
      }
      if (minorLen > 0) {
        canalsList.push({
          name: "Minor Canal",
          block: bName,
          district: dName,
          state: sName,
          lengthKm: minorLen,
        });
      }
      if (mainLen === 0 && distLen === 0 && minorLen === 0 && totLen > 0) {
        canalsList.push({
          name: "Irrigation Canal",
          block: bName,
          district: dName,
          state: sName,
          lengthKm: totLen,
        });
      }
    });

    return canalsList;
  }, [backendBlockCanals, activeBlock]);

  const totalCanalsCount = useMemo(() => {
    if (!backendBlockCanals || backendBlockCanals.length === 0) return 0;
    return backendBlockCanals.reduce((acc, b) => acc + (Number(b.canal_count) || 0), 0);
  }, [backendBlockCanals]);

  const totalCanalsLength = useMemo(() => {
    if (!backendBlockCanals || backendBlockCanals.length === 0) return 0;
    const len = backendBlockCanals.reduce((acc, b) => acc + (Number(b.canal_length_km) || 0), 0);
    return len > 0 ? Number(len.toFixed(1)) : 0;
  }, [backendBlockCanals]);

  // Keep district & block in sync when state changes
  const handleStateChange = (newState) => {
    setState(newState);
    const validDistricts = Array.from(
      new Set(allBlocks.filter((b) => b.state === newState).map((b) => b.district))
    ).sort();
    const newDistrict = validDistricts[0] || "";
    setDistrict(newDistrict);
    const validBlocks = allBlocks.filter(
      (b) => b.state === newState && (newDistrict ? b.district === newDistrict : true)
    );
    const nextBlockId = validBlocks[0]?.id || "";
    setBlockId(nextBlockId);
    if (nextBlockId) {
      setSearchParams({ blockId: nextBlockId }, { replace: true });
    }
  };

  // Keep block in sync when district changes
  const handleDistrictChange = (newDistrict) => {
    setDistrict(newDistrict);
    const validBlocks = allBlocks.filter(
      (b) => b.state === state && (newDistrict ? b.district === newDistrict : true)
    );
    const nextBlockId = validBlocks[0]?.id || "";
    setBlockId(nextBlockId);
    if (nextBlockId) {
      setSearchParams({ blockId: nextBlockId }, { replace: true });
    }
  };

  // When blockId changes
  const handleBlockChange = (newBlockId) => {
    setBlockId(newBlockId);
    setSearchParams({ blockId: newBlockId }, { replace: true });
  };

  // Function to execute simulation
  const executeSimulation = async () => {
    setLoading(true);
    try {
      const selectedBlockName = activeBlock?.name || activeBlock?.block || district || "";
      const selectedDistrict = activeBlock?.district || district || "";
      const selectedState = activeBlock?.state || state || "";
      const selectedBlockId = activeBlock?.id || blockId || "";

      const payload = {
        state: selectedState,
        district: selectedDistrict,
        blockId: selectedBlockId,
        block: selectedBlockName || selectedDistrict,
        currentCropId,
        replacementCropId,
        areaShiftPercent: areaPercent,
        forecastHorizonSeasons: horizon,
      };

      const result = await api.runScenarioSimulation(payload);
      setSimResult(result);
    } catch (err) {
      console.error("Simulation execution error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Run simulation on initial mount or when target block changes
  useEffect(() => {
    executeSimulation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockId]);

  // Dynamic scenario phrasing
  const scenarioDescription = `Shift ${areaPercent}% of ${currentCrop.shortName || currentCrop.name} area to ${replacementCrop.shortName || replacementCrop.name}`;

  // Reset to default scenario ("Shift 30% of Paddy area to Maize", 2 seasons)
  const resetToDefault = () => {
    setCurrentCropId("paddy");
    setReplacementCropId("maize");
    setAreaPercent(30);
    setHorizon(2);
  };

  // Complete crop options list from verified project/backend metadata
  const allCropOptions = useMemo(() => {
    return CROPS_METADATA.map((crop) => {
      let tag = "Diversification";
      if (crop.waterReqMm <= 300) tag = "Drought Hardy";
      else if (crop.id === "pulses") tag = "Soil Nitrogen";
      else if (crop.id === "mustard") tag = "Low Water";
      else if (crop.id === "drip_horticulture") tag = "High Income";
      else if (crop.id === "maize") tag = "Recommended";
      else if (crop.id === "wheat") tag = "Rabi Standard";
      else if (crop.id === "cotton") tag = "Cash Crop";
      else if (crop.id === "dsr_paddy") tag = "Water Saving";
      else if (crop.isWaterIntensive) tag = "Water Intensive";

      return {
        id: crop.id,
        label: crop.name,
        shortName: crop.shortName,
        category: crop.category,
        waterReq: `${crop.waterReqMm.toLocaleString()} mm`,
        waterReqMm: crop.waterReqMm,
        tag,
      };
    });
  }, []);

  // Recharts custom tooltip
  const CustomTrendTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="bg-white border border-slate-300 p-3 rounded-md shadow-md text-xs space-y-1 z-50">
          <p className="font-bold text-[#0f2942]">
            {point.label || label} ({point.period})
          </p>
          <div className="space-y-1 pt-1">
            <p className="text-slate-600 flex items-center justify-between gap-3">
              <span className="flex items-center gap-1 font-semibold text-rose-600">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                Baseline (No Shift):
              </span>
              <span className="font-mono font-bold text-slate-800">{point.baselineDepth} m bgl</span>
            </p>
            <p className="text-slate-600 flex items-center justify-between gap-3">
              <span className="flex items-center gap-1 font-semibold text-teal-700">
                <span className="w-2 h-2 rounded-full bg-teal-600 inline-block"></span>
                Simulated (Crop Shift):
              </span>
              <span className="font-mono font-bold text-teal-800">{point.simulatedDepth} m bgl</span>
            </p>
          </div>
          {point.isForecast && (
            <p className="text-[#0d9488] font-bold pt-1.5 border-t border-slate-100 flex items-center justify-between">
              <span>Groundwater Cushion:</span>
              <span>+{(point.baselineDepth - point.simulatedDepth).toFixed(2)} m</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <PageContainer
      title="Irrigation & Crop Diversification Simulator"
      subtitle="Model the impact of replacing water-intensive staples with climate-smart crops across agricultural blocks in India."
      badge={
        <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-teal-50 text-[#0d9488] border border-teal-200">
          Decision Support Model
        </span>
      }
      actions={
        <div className="flex items-center gap-2">
          <Link
            to={`/block/${activeBlock?.id || blockId || ""}`}
            className="text-xs font-semibold text-slate-600 hover:text-[#0f2942] bg-white border border-slate-300 px-3 py-1.5 rounded-md transition-colors"
          >
            View Block Profile →
          </Link>
        </div>
      }
    >
      {/* Top Banner Notice: Estimate Disclaimer */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-lg p-3 text-xs flex flex-wrap items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2 text-slate-700">
          <Info size={16} className="text-[#0d9488] shrink-0" />
          <span>
            <strong className="text-[#0f2942]">Estimate — based on scenario assumptions.</strong>{" "}
            Simulates dynamic aquifer head response and volumetric draft reduction under Atal Bhujal Yojana principles.
          </span>
        </div>
        <span className="text-[11px] text-slate-500 font-medium">
          Route: <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200">/simulator</code>
        </span>
      </div>

      {/* Two-Column Master Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ======================================================== */}
        {/* LEFT COLUMN: SCENARIO CONTROLS (5 cols on lg)           */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 space-y-5">
          <Card
            title="Scenario Controls"
            subtitle="Configure crop substitution parameters and temporal horizon"
            icon={Sliders}
            actions={
              <button
                type="button"
                onClick={resetToDefault}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium transition-colors"
                title="Reset controls to default example scenario"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            }
          >
            <div className="space-y-4 text-xs">
              {/* 1. State Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <MapPin size={13} className="text-[#0d9488]" />
                  1. State Selector:
                </label>
                <select
                  aria-label="Select state for simulation"
                  value={state}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#0d9488] transition-all cursor-pointer"
                >
                  {statesList.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. District Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Layers size={13} className="text-[#0d9488]" />
                  2. District Selector:
                </label>
                <select
                  aria-label="Select district for simulation"
                  value={district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  disabled={districtsList.length === 0}
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#0d9488] transition-all cursor-pointer disabled:bg-slate-100"
                >
                  {districtsList.map((dst) => (
                    <option key={dst} value={dst}>
                      {dst} District
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Block Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Gauge size={13} className="text-[#0d9488]" />
                  3. Block Selector:
                </label>
                <select
                  aria-label="Select block for simulation"
                  value={blockId}
                  onChange={(e) => handleBlockChange(e.target.value)}
                  disabled={filteredBlocks.length === 0}
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-800 font-bold focus:outline-hidden focus:ring-2 focus:ring-[#0d9488] transition-all cursor-pointer disabled:bg-slate-100"
                >
                  {filteredBlocks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} — {b.riskLevel} ({b.currentDepthMeters} m bgl)
                    </option>
                  ))}
                </select>
                <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                  <span>Current Baseline Risk:</span>
                  <RiskBadge level={activeBlock?.riskLevel} size="sm" />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3 space-y-4">
                {/* 4. Currently Grown Crop */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Sprout size={13} className="text-rose-600" />
                    4. Currently Grown Crop:
                  </label>
                  <select
                    aria-label="Select currently grown crop"
                    value={currentCropId}
                    onChange={(e) => setCurrentCropId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#0d9488] transition-all cursor-pointer"
                  >
                    {allCropOptions.map((crop) => (
                      <option key={crop.id} value={crop.id}>
                        {crop.label} — Water Req: {crop.waterReq}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Dominant staple currently driving peak summer/post-monsoon aquifer extraction.
                  </p>
                </div>

                {/* 5. Crop Recommendation */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Sprout size={13} className="text-[#0d9488]" />
                    5. Crop Recommendation:
                  </label>
                  <select
                    aria-label="Select recommended crop"
                    value={replacementCropId}
                    onChange={(e) => setReplacementCropId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-[#0d9488] transition-all cursor-pointer"
                  >
                    {allCropOptions.map((crop) => (
                      <option key={crop.id} value={crop.id}>
                        {crop.label} — Water Req: {crop.waterReq} ({crop.tag})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Diversification crop eligible for state incentives and assured minimum support price.
                  </p>
                </div>

                {/* 6. Area percentage slider */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center">
                    <label className="font-semibold text-slate-700">
                      6. Area Percentage Slider:
                    </label>
                    <span className="font-extrabold text-[#0f2942] px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-xs">
                      {areaPercent}% Acreage Shift
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="80"
                    step="5"
                    value={areaPercent}
                    onChange={(e) => setAreaPercent(Number(e.target.value))}
                    className="w-full accent-[#0d9488] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>5% (Pilot)</span>
                    <span>30% (Standard)</span>
                    <span>50%</span>
                    <span>80% (Aggressive)</span>
                  </div>

                  {/* Preset quick buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] text-slate-500">Quick set:</span>
                    {[15, 30, 50].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setAreaPercent(pct)}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                          areaPercent === pct
                            ? "bg-[#0f2942] text-white"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* 7. Forecast Horizon */}
                <div className="space-y-1.5 pt-2">
                  <label className="block font-semibold text-slate-700 flex items-center gap-1.5">
                    <Calendar size={13} className="text-[#0f2942]" />
                    7. Forecast Horizon:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 1, label: "1 Season", sub: "6 Months" },
                      { id: 2, label: "2 Seasons", sub: "1 Year" },
                      { id: 3, label: "3 Seasons", sub: "18 Months" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setHorizon(item.id)}
                        className={`p-2 rounded-md text-center border transition-all ${
                          horizon === item.id
                            ? "bg-[#0f2942] text-white border-[#0f2942] shadow-xs"
                            : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
                        }`}
                      >
                        <span className="block font-bold text-xs">{item.label}</span>
                        <span className={`block text-[10px] ${horizon === item.id ? "text-slate-300" : "text-slate-400"}`}>
                          {item.sub}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dynamic Example Scenario Box */}
              <div className="p-3.5 bg-teal-50/60 border border-teal-200 rounded-lg text-xs space-y-1 mt-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0d9488] block">
                  Configured Scenario Statement
                </span>
                <p className="font-extrabold text-[#0f2942] text-sm">
                  "{scenarioDescription}"
                </p>
                <p className="text-[11px] text-slate-600">
                  Targeted across {activeBlock?.name} ({activeBlock?.district}, {activeBlock?.state}) over {horizon} season{horizon > 1 ? "s" : ""}.
                </p>
              </div>

              {/* Real Backend Agro-Hydrological Features */}
              {(backendBlockCrops.length > 0 || backendBlockCanals.length > 0) && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0f2942] flex items-center gap-1">
                      <Sprout size={13} className="text-[#0d9488]" />
                      Local Crop & Canal Telemetry
                    </span>
                    <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-1.5 py-0.5 rounded">
                      Live Backend Data
                    </span>
                  </div>

                  {backendBlockCrops.length > 0 && (
                    <div className="text-[11px] text-slate-600">
                      <span className="font-semibold text-slate-700">Monitored Crops: </span>
                      {backendBlockCrops.slice(0, 3).map((c, idx) => (
                        <span key={idx} className="inline-block mr-2">
                          {c.crop_name} ({c.water_requirement_mm}mm, {c.water_demand_category || c.season})
                        </span>
                      ))}
                    </div>
                  )}

                  {individualCanals.length > 0 ? (
                    <div className="pt-2 border-t border-slate-200/80 space-y-1.5 text-[11px] text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">Canal Network Infrastructure:</span>
                        {totalCanalsCount > 0 && (
                          <span className="text-[10px] text-slate-500">
                            Total: <strong className="text-slate-700">{totalCanalsCount} canals</strong>
                            {totalCanalsLength > 0 ? ` (${totalCanalsLength} km)` : ""}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
                        {individualCanals.map((canal, idx) => (
                          <div
                            key={idx}
                            className="bg-white border border-slate-200 rounded p-1.5 flex items-center justify-between gap-2 shadow-2xs"
                          >
                            <div className="min-w-0">
                              <div className="font-bold text-[#0f2942] truncate">
                                {canal.name || canal.canal_name || "Canal Channel"}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate">
                                {canal.block ? `${canal.block}, ` : ""}{canal.district}{canal.state ? ` (${canal.state})` : ""}
                              </div>
                            </div>
                            {canal.lengthKm != null && canal.lengthKm > 0 && (
                              <div className="text-right text-[10px] font-mono text-slate-700 shrink-0 font-bold bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60">
                                {Number(canal.lengthKm).toFixed(1)} km
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : backendBlockCanals.length > 0 && (
                    <div className="text-[11px] text-slate-600 flex flex-wrap gap-x-3 gap-y-1 pt-2 border-t border-slate-200/80">
                      <span>
                        Canals: <strong className="text-slate-800">{backendBlockCanals[0].canal_count || 0}</strong>
                      </span>
                      <span>
                        Location: <strong className="text-slate-800">{backendBlockCanals[0].block || activeBlock?.name}, {backendBlockCanals[0].district || activeBlock?.district}</strong>
                      </span>
                      {backendBlockCanals[0].canal_length_km ? (
                        <span>
                          Length: <strong className="text-slate-800">{Number(backendBlockCanals[0].canal_length_km).toFixed(1)} km</strong>
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>
              )}

              {/* Primary Action: Run Simulation Button */}
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={executeSimulation}
                  disabled={loading}
                  icon={Play}
                  className="w-full justify-center text-sm py-2.5 font-bold shadow-xs bg-[#0f2942] hover:bg-[#163b5e]"
                >
                  {loading ? "Running Hydro-Simulation..." : "Run Simulation"}
                </Button>
              </div>
            </div>
          </Card>

          {/* Quick Guidance Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2 text-slate-600">
            <h4 className="font-bold text-[#0f2942] flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#0d9488]" />
              Simulation Mechanics
            </h4>
            <p className="leading-relaxed">
              When flood-irrigated paddy or sugarcane acreage is converted to maize or millets,
              evapotranspiration declines from ~1,250 mm to ~480 mm per season. This conserves roughly{" "}
              <strong>7,700 m³ of groundwater per shifted hectare</strong>, curtailing tubewell run hours and
              cushioning the hydraulic head drawdown.
            </p>
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: RESULTS (7 cols on lg)                     */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 space-y-5">
          {loading && !simResult ? (
            <div className="bg-white border border-slate-200 rounded-lg p-12">
              <LoadingState message="Recalculating block groundwater mass balance and trajectory..." />
            </div>
          ) : simResult ? (
            <>
              {/* Prominent Header / Results Notice */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg px-5 py-3.5 shadow-2xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0d9488]"></span>
                    <h3 className="font-bold text-sm text-[#0f2942]">
                      Simulation Results for {simResult.blockName || simResult.district || "Selected Location"}
                      {simResult.district && simResult.blockName && simResult.blockName !== simResult.district
                        ? ` (${simResult.district})`
                        : ""}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Evaluated over {simResult.forecastHorizonSeasons} season{simResult.forecastHorizonSeasons > 1 ? "s" : ""} horizon under normal rainfall baseline.
                  </p>
                </div>
                <div className="px-3 py-1 rounded bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1.5">
                  <AlertTriangle size={13} className="text-amber-600 shrink-0" />
                  <span>Estimate — based on scenario assumptions</span>
                </div>
              </div>

              {/* Top Results Metrics (3 Key Areas) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* 1. Estimated Groundwater Impact */}
                <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs border-l-4 border-l-[#0d9488]">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                    <Droplets size={12} className="text-[#0d9488]" />
                    Groundwater Impact
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-[#0f2942]">
                      +{simResult.groundwaterImpact.depthRecoveryMeters}
                    </span>
                    <span className="text-xs font-bold text-slate-500">meters</span>
                  </div>
                  <p className="text-[11px] text-[#0d9488] font-bold mt-1">
                    Saved {simResult.groundwaterImpact.cumulativeWaterSavedMcm} MCM cumulative
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Stabilizes depth at ~{simResult.groundwaterImpact.simulatedProjectedDepth}m bgl
                  </p>
                </div>

                {/* 2. Water Demand Change */}
                <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs border-l-4 border-l-[#0f2942]">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                    <TrendingUp size={12} className="text-[#0f2942]" />
                    Water Demand Change
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-[#0f2942]">
                      -{simResult.waterDemandChange.totalDemandReductionPercent}%
                    </span>
                    <span className="text-xs font-bold text-slate-500">gross draft</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 font-bold mt-1">
                    -{simResult.waterDemandChange.pumpingHoursReduction} hrs/day tubewell run
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Saves {simResult.waterDemandChange.pctSavedOnShiftedAcreage}% on shifted ha
                  </p>
                </div>

                {/* 3. Risk Change */}
                <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs border-l-4 border-l-amber-500">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                    <ShieldCheck size={12} className="text-amber-600" />
                    Risk Change
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <RiskBadge level={simResult.riskChange.originalRiskLevel} size="sm" />
                    <ArrowRight size={14} className="text-slate-400 shrink-0" />
                    <RiskBadge level={simResult.riskChange.newRiskLevel} size="sm" />
                  </div>
                  <p className="text-[11px] text-slate-700 font-bold mt-2">
                    Extraction: {simResult.riskChange.stageOriginal}% → {simResult.riskChange.stageProjected}%
                  </p>
                  <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                    -{simResult.riskChange.stageDifference}% extraction stress
                  </p>
                </div>
              </div>

              {/* Side-by-Side: Current Scenario vs Suggested Scenario */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Current Scenario Card */}
                <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Current Scenario
                    </span>
                    <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      Status Quo
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Dominant Crop:</span>
                      <span className="font-bold text-slate-800">{simResult.currentScenario.cropName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Water Requirement:</span>
                      <span className="font-bold text-slate-800">{simResult.currentScenario.waterReqMm} mm/season</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Current Depth:</span>
                      <span className="font-bold text-slate-800">{simResult.currentScenario.depthMeters} m bgl</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Extraction Stage:</span>
                      <span className="font-bold text-rose-700">{simResult.currentScenario.stageOfExtraction}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Annual Drawdown:</span>
                      <span className="font-bold text-slate-800">{simResult.currentScenario.annualTrend}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Pumping Hours:</span>
                      <span className="font-bold text-slate-800">{simResult.currentScenario.pumpingHours}</span>
                    </div>
                  </div>
                </div>

                {/* Suggested Scenario Card */}
                <div className="bg-teal-50/40 border border-teal-200 rounded-lg p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-teal-200/60">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0d9488]">
                      Suggested Scenario
                    </span>
                    <span className="text-[11px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                      Simulated Shift
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Intervention:</span>
                      <span className="font-bold text-[#0f2942]">
                        {simResult.suggestedScenario.areaShiftPercent}% to {simResult.suggestedScenario.cropName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Crop Water Req:</span>
                      <span className="font-bold text-[#0d9488]">{simResult.suggestedScenario.waterReqMm} mm/season</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Projected Depth:</span>
                      <span className="font-bold text-[#0f2942]">{simResult.suggestedScenario.projectedDepthMeters} m bgl</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Projected Extraction:</span>
                      <span className="font-bold text-teal-800">{simResult.suggestedScenario.stageOfExtraction}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Dynamic Water Saved:</span>
                      <span className="font-bold text-[#0d9488]">{simResult.suggestedScenario.waterSavedMcm} MCM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Projected Pumping:</span>
                      <span className="font-bold text-emerald-700">{simResult.suggestedScenario.pumpingHours}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recharts Before/After Groundwater Trend Chart */}
              <Card
                title="Groundwater Depth Trajectory: Baseline vs Simulated Scenario"
                subtitle="Historical trend and projected depth comparison across the selected forecast horizon"
                badge={
                  <span className="text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                    Recharts Visualization
                  </span>
                }
              >
                <div className="h-72 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={simResult.trendChartData}
                      margin={{ top: 15, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="period"
                        stroke="#475569"
                        tick={{ fontSize: 11, fontWeight: 500 }}
                      />
                      {/* Note: reversed={true} because depth in meters below ground level: higher number = deeper water table */}
                      <YAxis
                        reversed={true}
                        domain={["dataMin - 1", "dataMax + 1"]}
                        stroke="#64748b"
                        tick={{ fontSize: 11 }}
                        unit="m"
                        label={{
                          value: "Depth (m bgl) — Deeper ⬇️",
                          angle: -90,
                          position: "insideLeft",
                          style: { textAnchor: "middle", fontSize: 11, fill: "#64748b" },
                        }}
                      />
                      <Tooltip content={<CustomTrendTooltip />} />
                      <Legend
                        wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
                        verticalAlign="bottom"
                      />
                      <ReferenceLine
                        x="Current"
                        stroke="#0f2942"
                        strokeDasharray="3 3"
                        label={{
                          value: "Now (Oct '26)",
                          position: "top",
                          fill: "#0f2942",
                          fontSize: 10,
                          fontWeight: "bold",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="baselineDepth"
                        name="Baseline Trend (Status Quo - No Shift)"
                        stroke="#e11d48"
                        strokeWidth={2.5}
                        strokeDasharray="5 5"
                        dot={{ r: 4, stroke: "#e11d48", strokeWidth: 1.5, fill: "#fff" }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="simulatedDepth"
                        name="Simulated Trend (With Crop Shift)"
                        stroke="#0d9488"
                        strokeWidth={2.5}
                        dot={{ r: 4, stroke: "#0d9488", strokeWidth: 1.5, fill: "#0d9488" }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
                  <span>
                    Note: Values in <strong>m bgl</strong> (meters below ground level). Higher values indicate deeper water tables (worse condition).
                  </span>
                  <span className="font-semibold text-teal-700">
                    Gap between lines represents water table cushion saved.
                  </span>
                </div>
              </Card>

              {/* Assumptions Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 text-xs space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-1 rounded bg-amber-100 text-amber-800 shrink-0">
                    <Info size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0f2942] text-sm">
                      Model Assumptions & Methodological Limitations
                    </h4>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Decision-support heuristic — do not claim absolute scientific accuracy
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-600 pt-1">
                  <div className="p-2.5 bg-white rounded border border-slate-200 space-y-1">
                    <strong className="text-slate-800 block text-[11px]">
                      1. Evapotranspiration Benchmarks
                    </strong>
                    <p className="text-[11px] leading-relaxed">
                      Water demand calculated using standard FAO-56 crop coefficients ($K_c$) under normal weather conditions (Paddy: 1,250 mm; Maize: 480 mm).
                    </p>
                  </div>

                  <div className="p-2.5 bg-white rounded border border-slate-200 space-y-1">
                    <strong className="text-slate-800 block text-[11px]">
                      2. Aquifer Specific Yield
                    </strong>
                    <p className="text-[11px] leading-relaxed">
                      Approximated specific yield ($S_y \approx 0.08–0.12$) based on Central Ground Water Board (CGWB) regional hydrogeological parameters.
                    </p>
                  </div>

                  <div className="p-2.5 bg-white rounded border border-slate-200 space-y-1">
                    <strong className="text-slate-800 block text-[11px]">
                      3. Uniform Acreage Compliance
                    </strong>
                    <p className="text-[11px] leading-relaxed">
                      Assumes 100% adherence across the selected {areaPercent}% shifted acreage without compensatory pumping in neighboring holdings.
                    </p>
                  </div>

                  <div className="p-2.5 bg-white rounded border border-slate-200 space-y-1">
                    <strong className="text-slate-800 block text-[11px]">
                      4. Scientific Disclaimer
                    </strong>
                    <p className="text-[11px] leading-relaxed">
                      Calculations are mock estimates for participatory planning and policy what-if analyses. They do not replace local borehole pumping tests or MODFLOW 3D numerical models.
                    </p>
                  </div>
                </div>
              </div>

            </>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-500 text-xs">
              Select simulation parameters and click <strong>"Run Simulation"</strong> to evaluate groundwater outcomes.
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
