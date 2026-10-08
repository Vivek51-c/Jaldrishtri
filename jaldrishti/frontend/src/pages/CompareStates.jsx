import { useState, useEffect, useMemo } from "react";
import {
  RotateCcw,
  Droplets,
  TrendingDown,
  Layers,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Radio,
  Check,
  Info,
  BarChart2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
} from "recharts";
import { apiClient } from "../api/apiClient";
import PageContainer from "../components/layout/PageContainer";
import Card from "../components/common/Card";
import RiskBadge from "../components/common/RiskBadge";
import LoadingState from "../components/common/LoadingState";

/**
 * JalDrishti Compare States Page (/compare)
 * 
 * Compares up to 3 selected states (Default: Punjab, Haryana, Rajasthan).
 * Displays:
 * - Three comparison columns showing:
 *   * Critical blocks
 *   * Watch blocks
 *   * Safe blocks
 *   * Average groundwater depth
 *   * Average yearly decline
 *   * Number of monitoring wells
 * - Small Recharts visualizations comparing:
 *   * Groundwater depth
 *   * Yearly decline
 *   * Risk distribution (Critical, Watch, Safe)
 */
export default function CompareStates() {
  const [allStates, setAllStates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected states (up to 3, default: Punjab, Haryana, Rajasthan)
  const defaultSelection = ["Punjab", "Haryana", "Rajasthan"];
  const [selectedStateNames, setSelectedStateNames] = useState(defaultSelection);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const data = await apiClient.getStatesComparison();
        if (isMounted) setAllStates(data);
      } catch (err) {
        console.error("Failed to load states comparison data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle toggling state selection (max 3)
  const toggleState = (stateName) => {
    if (selectedStateNames.includes(stateName)) {
      if (selectedStateNames.length > 1) {
        setSelectedStateNames(selectedStateNames.filter((s) => s !== stateName));
      }
    } else {
      if (selectedStateNames.length < 3) {
        setSelectedStateNames([...selectedStateNames, stateName]);
      } else {
        // If already 3, replace the last one
        setSelectedStateNames([selectedStateNames[0], selectedStateNames[1], stateName]);
      }
    }
  };

  const resetToDefault = () => {
    setSelectedStateNames(defaultSelection);
  };

  // Filter selected states in order
  const comparedStates = useMemo(() => {
    return selectedStateNames
      .map((name) => allStates.find((s) => s.state.toLowerCase() === name.toLowerCase()))
      .filter(Boolean);
  }, [allStates, selectedStateNames]);

  // Chart datasets
  const depthComparisonData = useMemo(() => {
    return comparedStates.map((s) => ({
      state: s.state,
      avgDepth: s.avgDepthMeters,
    }));
  }, [comparedStates]);

  const declineComparisonData = useMemo(() => {
    return comparedStates.map((s) => ({
      state: s.state,
      // Positive number for magnitude of decline
      yearlyDecline: Math.abs(s.avgYearlyDecline || 0.5),
      rawDecline: s.avgYearlyDecline,
    }));
  }, [comparedStates]);

  const riskDistributionData = useMemo(() => {
    return comparedStates.map((s) => ({
      state: s.state,
      Critical: s.criticalBlocks,
      Watch: s.watchBlocks,
      Safe: s.safeBlocks,
      total: s.totalBlocks,
    }));
  }, [comparedStates]);

  if (loading && allStates.length === 0) {
    return (
      <PageContainer>
        <LoadingState
          message="Loading inter-state groundwater datasets..."
          submessage="Compiling dynamic annual recharge, decline trends, and block assessments"
        />
      </PageContainer>
    );
  }

  // Custom tooltips for clean Recharts display
  const CustomDepthTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-300 rounded p-2.5 shadow-md text-xs">
          <p className="font-bold text-[#0f2942] mb-1">{label}</p>
          <p className="text-slate-600">
            Average Groundwater Depth:{" "}
            <span className="font-bold text-[#0f2942]">
              {payload[0].value} m bgl
            </span>
          </p>
          <span className="text-[10px] text-slate-400 block mt-1">
            Higher value = deeper / worse
          </span>
        </div>
      );
    }
    return null;
  };

  const CustomDeclineTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-slate-300 rounded p-2.5 shadow-md text-xs">
          <p className="font-bold text-[#0f2942] mb-1">{label}</p>
          <p className="text-slate-600">
            Annual Decline Rate:{" "}
            <span className="font-bold text-rose-700">
              {data.rawDecline} m / year
            </span>
          </p>
          <span className="text-[10px] text-slate-400 block mt-1">
            Drawdown exceeding natural recharge
          </span>
        </div>
      );
    }
    return null;
  };

  const CustomRiskTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-slate-300 rounded p-2.5 shadow-md text-xs space-y-1">
          <p className="font-bold text-[#0f2942]">{label} ({data.total} Blocks)</p>
          <p className="text-red-700 flex justify-between gap-3">
            <span>Critical Blocks:</span>
            <span className="font-bold">{data.Critical} ({((data.Critical / data.total) * 100).toFixed(1)}%)</span>
          </p>
          <p className="text-amber-700 flex justify-between gap-3">
            <span>Watch Blocks:</span>
            <span className="font-bold">{data.Watch} ({((data.Watch / data.total) * 100).toFixed(1)}%)</span>
          </p>
          <p className="text-emerald-700 flex justify-between gap-3">
            <span>Safe Blocks:</span>
            <span className="font-bold">{data.Safe} ({((data.Safe / data.total) * 100).toFixed(1)}%)</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <PageContainer
      title="Compare States"
      subtitle="Comparative analysis of groundwater depth, annual decline rates, and risk distribution across up to 3 Indian states."
      badge={
        <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-teal-50 text-[#0d9488] border border-teal-200">
          State Benchmarks
        </span>
      }
      actions={
        <button
          type="button"
          onClick={resetToDefault}
          className="text-xs text-slate-600 hover:text-[#0f2942] bg-white border border-slate-300 hover:border-slate-400 rounded-md px-3 py-1.5 flex items-center gap-1.5 font-semibold transition-colors shadow-2xs cursor-pointer"
          title="Reset to default comparison: Punjab, Haryana, Rajasthan"
        >
          <RotateCcw size={12} />
          <span>Reset to Default (Punjab, Haryana, Rajasthan)</span>
        </button>
      }
    >
      <div className="space-y-6">
        {/* State Selection Bar */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <MapPin size={15} className="text-[#0d9488]" />
              <span className="text-xs font-bold text-slate-700">
                Select Up to 3 States to Compare:
              </span>
            </div>
            <span className="text-[11px] text-slate-500">
              Selected: <strong className="text-[#0f2942]">{selectedStateNames.length} / 3</strong>
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {allStates.map((s) => {
              const isSelected = selectedStateNames.includes(s.state);
              return (
                <button
                  key={s.state}
                  type="button"
                  onClick={() => toggleState(s.state)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-[#0f2942] text-white border-[#0f2942] shadow-2xs"
                      : "bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100"
                  }`}
                >
                  <span>{s.state}</span>
                  {isSelected ? (
                    <span className="text-slate-300 text-xs font-bold">✕</span>
                  ) : (
                    <span className="text-slate-400 text-xs">+</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Three Comparison Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {comparedStates.map((st) => {
            const riskTier =
              st.stageOfExtraction > 100
                ? "Critical"
                : st.stageOfExtraction >= 70
                ? "Watch"
                : "Safe";

            return (
              <div
                key={st.state}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col justify-between"
              >
                {/* Column Header */}
                <div className="p-5 bg-slate-50 border-b border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-lg text-[#0f2942]">
                      {st.state}
                    </h3>
                    <RiskBadge level={riskTier} size="sm" />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Monitored Blocks: <strong>{st.totalBlocks}</strong></span>
                    <span>Extraction: <strong>{st.stageOfExtraction}%</strong></span>
                  </div>
                </div>

                {/* Column Body / Metrics */}
                <div className="p-5 space-y-4 text-xs flex-1">
                  {/* 1. Risk Blocks Breakdown */}
                  <div className="space-y-2 pb-3 border-b border-slate-100">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                      Block Risk Classification:
                    </span>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      {/* Critical Blocks */}
                      <div className="p-2 rounded bg-red-50 border border-red-200">
                        <span className="text-[10px] font-bold text-red-700 block uppercase">
                          Critical
                        </span>
                        <span className="text-base font-extrabold text-red-800 block">
                          {st.criticalBlocks}
                        </span>
                        <span className="text-[10px] text-red-600 font-semibold">
                          {st.criticalPercent}%
                        </span>
                      </div>

                      {/* Watch Blocks */}
                      <div className="p-2 rounded bg-amber-50 border border-amber-200">
                        <span className="text-[10px] font-bold text-amber-700 block uppercase">
                          Watch
                        </span>
                        <span className="text-base font-extrabold text-amber-800 block">
                          {st.watchBlocks}
                        </span>
                        <span className="text-[10px] text-amber-600 font-semibold">
                          {st.watchPercent}%
                        </span>
                      </div>

                      {/* Safe Blocks */}
                      <div className="p-2 rounded bg-emerald-50 border border-emerald-200">
                        <span className="text-[10px] font-bold text-emerald-700 block uppercase">
                          Safe
                        </span>
                        <span className="text-base font-extrabold text-emerald-800 block">
                          {st.safeBlocks}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-semibold">
                          {st.safePercent}%
                        </span>
                      </div>
                    </div>

                    {/* Proportional Distribution Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-200 flex overflow-hidden mt-1">
                      <div
                        style={{ width: `${st.criticalPercent}%` }}
                        className="bg-red-600 h-full"
                        title={`Critical: ${st.criticalPercent}%`}
                      ></div>
                      <div
                        style={{ width: `${st.watchPercent}%` }}
                        className="bg-amber-500 h-full"
                        title={`Watch: ${st.watchPercent}%`}
                      ></div>
                      <div
                        style={{ width: `${st.safePercent}%` }}
                        className="bg-emerald-600 h-full"
                        title={`Safe: ${st.safePercent}%`}
                      ></div>
                    </div>
                  </div>

                  {/* 2. Average Groundwater Depth */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 block uppercase">
                        Average Groundwater Depth:
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Meters below ground level
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-extrabold text-[#0f2942]">
                        {st.avgDepthMeters}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 ml-1">
                        m bgl
                      </span>
                    </div>
                  </div>

                  {/* 3. Average Yearly Decline */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 block uppercase">
                        Average Yearly Decline:
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Hydraulic drawdown rate
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-extrabold text-rose-700">
                        {st.avgYearlyDecline}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 ml-1">
                        m / yr
                      </span>
                    </div>
                  </div>

                  {/* 4. Number of Monitoring Wells */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-slate-500 block uppercase">
                        Monitoring Wells:
                      </span>
                      <span className="text-[11px] text-slate-400">
                        DWLR & Telemetry Piezometers
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-extrabold text-[#0d9488]">
                        {st.monitoringWellsCount?.toLocaleString() || "1,200"}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 ml-1">
                        wells
                      </span>
                    </div>
                  </div>

                  {/* Regional Aquifer & Driver */}
                  <div className="pt-2 text-[11px] text-slate-500 space-y-1 border-t border-slate-100">
                    <div>
                      <strong className="text-slate-700">Primary Aquifer:</strong> {st.dominantAquifer}
                    </div>
                    <div>
                      <strong className="text-slate-700">Dominant Crops:</strong> {st.dominantCrops}
                    </div>
                  </div>
                </div>

                {/* Column Footer */}
                <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-200 text-[11px] text-slate-600 flex justify-between">
                  <span>Annual Recharge: <strong>{st.annualRechargeBcm} BCM</strong></span>
                  <span>Annual Draft: <strong>{st.annualDraftBcm} BCM</strong></span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Small Recharts Visualizations Comparing Key Parameters */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 px-1">
            <BarChart2 size={15} className="text-[#0d9488]" />
            <h4 className="font-bold text-sm text-[#0f2942]">
              Comparative Visual Benchmarks for Selected States
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Chart 1: Average Groundwater Depth */}
            <Card
              title="Average Groundwater Depth"
              subtitle="Comparison in meters below ground level (m bgl)"
            >
              <div className="h-56 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={depthComparisonData}
                    margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="state"
                      stroke="#475569"
                      tick={{ fontSize: 11, fontWeight: 600 }}
                    />
                    <YAxis
                      stroke="#64748b"
                      tick={{ fontSize: 10 }}
                      unit="m"
                    />
                    <Tooltip content={<CustomDepthTooltip />} />
                    <Bar
                      dataKey="avgDepth"
                      name="Avg Depth (m bgl)"
                      fill="#0f2942"
                      radius={[4, 4, 0, 0]}
                    >
                      {depthComparisonData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 0 ? "#0f2942" : index === 1 ? "#1e3a5f" : "#334155"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 text-center">
                Higher depth denotes deeper water table and higher extraction stress
              </p>
            </Card>

            {/* Chart 2: Average Yearly Decline */}
            <Card
              title="Average Yearly Decline"
              subtitle="Annual drawdown rate in meters / year"
            >
              <div className="h-56 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={declineComparisonData}
                    margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="state"
                      stroke="#475569"
                      tick={{ fontSize: 11, fontWeight: 600 }}
                    />
                    <YAxis
                      stroke="#64748b"
                      tick={{ fontSize: 10 }}
                      unit="m"
                    />
                    <Tooltip content={<CustomDeclineTooltip />} />
                    <Bar
                      dataKey="yearlyDecline"
                      name="Annual Drawdown (m/yr)"
                      fill="#dc2626"
                      radius={[4, 4, 0, 0]}
                    >
                      {declineComparisonData.map((entry, index) => (
                        <Cell
                          key={`cell-decline-${index}`}
                          fill={entry.yearlyDecline > 0.8 ? "#b91c1c" : entry.yearlyDecline > 0.5 ? "#ea580c" : "#d97706"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 text-center">
                Magnitude of yearly water table sinking exceeding recharge
              </p>
            </Card>

            {/* Chart 3: Risk Distribution */}
            <Card
              title="Block Risk Distribution"
              subtitle="Comparison of Critical, Watch, and Safe blocks"
            >
              <div className="h-56 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={riskDistributionData}
                    margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="state"
                      stroke="#475569"
                      tick={{ fontSize: 11, fontWeight: 600 }}
                    />
                    <YAxis
                      stroke="#64748b"
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip content={<CustomRiskTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
                    <Bar
                      dataKey="Critical"
                      name="Critical"
                      fill="#ef4444"
                      stackId="riskStack"
                    />
                    <Bar
                      dataKey="Watch"
                      name="Watch"
                      fill="#f59e0b"
                      stackId="riskStack"
                    />
                    <Bar
                      dataKey="Safe"
                      name="Safe"
                      fill="#10b981"
                      stackId="riskStack"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 text-center">
                Absolute count of blocks assessed under CGWB classification norms
              </p>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
