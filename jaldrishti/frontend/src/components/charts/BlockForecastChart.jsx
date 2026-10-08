import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { Sparkles, Calendar, Info, TrendingDown } from "lucide-react";

export default function BlockForecastChart({
  historicalData = [],
  forecastData = [],
  criticalThreshold = 35,
}) {
  // Horizon selector: "1 Season" | "2 Seasons" | "3 Seasons"
  const [horizon, setHorizon] = useState("2 Seasons");

  // Filter forecast data according to chosen horizon
  // 1 Season: 4 months (Nov-Feb)
  // 2 Seasons: 8 months (Nov-Jun)
  // 3 Seasons: 12 months (Nov-Oct)
  const slicedForecast = useMemo(() => {
    if (!forecastData || !forecastData.length) return [];
    if (horizon === "1 Season") return forecastData.slice(0, 4);
    if (horizon === "2 Seasons") return forecastData.slice(0, 8);
    return forecastData.slice(0, 12);
  }, [forecastData, horizon]);

  // Combine historical and forecast timeline into a unified chart dataset
  const combinedTimeline = useMemo(() => {
    const historicalPoints = (historicalData || []).map((h) => ({
      period: h.year,
      historicalDepth: h.postMonsoon || h.preMonsoon,
      isHistorical: true,
    }));

    // Connect the last historical point with the first forecast point
    const lastHistorical = historicalPoints[historicalPoints.length - 1];

    const forecastPoints = slicedForecast.map((f, index) => ({
      period: f.month,
      // On the first forecast point, anchor it to historical depth so the line connects cleanly
      forecastEstimate: f.depth,
      lowerBound: f.lowerBound,
      upperBound: f.upperBound,
      isForecast: true,
    }));

    return [...historicalPoints, ...forecastPoints];
  }, [historicalData, slicedForecast]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-white border border-slate-300 rounded-md p-3 shadow-md text-xs space-y-1">
        <p className="font-bold text-[#0f2942] border-b border-slate-100 pb-1">
          {label}
        </p>
        {payload.map((entry, index) => {
          if (entry.dataKey === "lowerBound" || entry.dataKey === "upperBound") {
            return null; // hide raw bound entries in legend
          }
          return (
            <div key={`tip-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}:
              </span>
              <span className="font-bold text-slate-900">
                {entry.value} m bgl
              </span>
            </div>
          );
        })}
        {payload.some((p) => p.dataKey === "lowerBound") && (
          <p className="text-[10px] text-teal-700 font-medium pt-1 border-t border-slate-100">
            Shaded band: 90% AI Confidence Interval
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="w-full space-y-3">
      {/* Horizon Selector and Chart Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-600 font-medium">
          <TrendingDown size={14} className="text-[#0d9488]" />
          <span>Hydraulic Head Dynamics & Seasonal Trajectory</span>
        </div>

        {/* Horizon selector buttons: 1 Season, 2 Seasons, 3 Seasons */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-semibold text-xs">Horizon:</span>
          <div className="inline-flex rounded-md border border-slate-300 bg-white p-0.5 shadow-2xs">
            {["1 Season", "2 Seasons", "3 Seasons"].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHorizon(h)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                  horizon === h
                    ? "bg-[#0f2942] text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {h}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={combinedTimeline}
            margin={{ top: 15, right: 20, left: -10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="period"
              stroke="#64748b"
              tick={{ fontSize: 11 }}
              axisLine={{ stroke: "#cbd5e1" }}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fontSize: 11 }}
              unit="m"
              domain={["auto", "auto"]}
              axisLine={{ stroke: "#cbd5e1" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />

            {/* Critical Depth Threshold line */}
            <ReferenceLine
              y={criticalThreshold}
              stroke="#dc2626"
              strokeDasharray="4 4"
              label={{
                value: `Critical Depletion Limit (${criticalThreshold}m)`,
                position: "top",
                fill: "#dc2626",
                fontSize: 10,
                fontWeight: 600,
              }}
            />

            {/* Shaded band for confidence interval */}
            <Area
              type="monotone"
              dataKey="upperBound"
              fill="#ccfbf1"
              stroke="none"
              name="Confidence Range (Upper)"
              legendType="none"
            />
            <Area
              type="monotone"
              dataKey="lowerBound"
              fill="#ffffff"
              stroke="none"
              name="Confidence Range (Lower)"
              legendType="none"
            />

            {/* Historical Depth: Solid Line */}
            <Line
              type="monotone"
              dataKey="historicalDepth"
              name="Historical Depth"
              stroke="#0f2942"
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: "#0f2942" }}
              activeDot={{ r: 5 }}
              connectNulls={false}
            />

            {/* Forecast: Dashed Line clearly labeled as "Estimate" */}
            <Line
              type="monotone"
              dataKey="forecastEstimate"
              name="Forecast (Estimate)"
              stroke="#0d9488"
              strokeWidth={2.5}
              strokeDasharray="5 5"
              dot={{ r: 4, fill: "#0d9488" }}
              activeDot={{ r: 6 }}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Mandatory note & guidance footer */}
      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md text-xs flex flex-wrap items-center justify-between gap-2 text-slate-600">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700">
          <Info size={14} className="text-[#0d9488] shrink-0" />
          <span>Forecast Horizon: {horizon} ({slicedForecast.length} Months ahead &bull; Model: LSTM-ARIMA Hybrid)</span>
        </div>
        <div className="text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
          Higher value = deeper groundwater = worse condition
        </div>
      </div>
    </div>
  );
}
