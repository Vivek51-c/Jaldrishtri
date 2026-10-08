import { useState } from "react";
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
import { TrendingDown, Calendar, Sparkles } from "lucide-react";

export default function DepthTrendChart({
  historicalData = [],
  forecastData = [],
  criticalThreshold = 30,
}) {
  const [viewMode, setViewMode] = useState("all"); // "all" | "forecast" | "historical"

  // Prepare combined timeline if viewMode === "all"
  const formattedHistorical = (historicalData || []).map((d) => ({
    period: d.year,
    preMonsoon: d.preMonsoon,
    postMonsoon: d.postMonsoon,
    type: "Historical",
  }));

  const formattedForecast = (forecastData || []).map((f) => ({
    period: f.month,
    forecast: f.depth,
    lowerBound: f.lowerBound,
    upperBound: f.upperBound,
    type: "AI Forecast",
  }));

  // Custom clean tooltip for government charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-white border border-slate-300 rounded-md p-3 shadow-md text-xs">
        <p className="font-bold text-[#0f2942] mb-1.5 border-b border-slate-100 pb-1">
          {label}
        </p>
        <div className="space-y-1">
          {payload.map((entry, index) => {
            if (entry.dataKey === "lowerBound" || entry.dataKey === "upperBound") {
              return null; // keep confidence bounds clean
            }
            return (
              <div key={`item-${index}`} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: entry.color }}
                  ></span>
                  {entry.name}:
                </span>
                <span className="font-bold text-slate-900">
                  {entry.value} m bgl
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-2 pt-1 border-t border-slate-100 text-[10px] text-slate-400">
          Meters below ground level (higher = deeper)
        </p>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Controls & Subheader */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <TrendingDown size={14} className="text-[#0d9488]" />
          <span>
            Hydraulic Head (m bgl) &bull;{" "}
            <span className="text-slate-500 font-normal">
              Pre-Monsoon (Apr–May) vs Post-Monsoon (Oct–Nov)
            </span>
          </span>
        </div>

        {/* View mode toggle */}
        <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("all")}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === "all"
                ? "bg-white text-[#0f2942] font-semibold shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Combined Timeline
          </button>
          <button
            type="button"
            onClick={() => setViewMode("historical")}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === "historical"
                ? "bg-white text-[#0f2942] font-semibold shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Historical (9 Yrs)
          </button>
          <button
            type="button"
            onClick={() => setViewMode("forecast")}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
              viewMode === "forecast"
                ? "bg-white text-[#0f2942] font-semibold shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles size={11} className="text-[#0d9488]" />
            12M AI Forecast
          </button>
        </div>
      </div>

      {/* Recharts Container */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === "forecast" ? (
            <ComposedChart
              data={formattedForecast}
              margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
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
                domain={["auto", "auto"]}
                unit="m"
                axisLine={{ stroke: "#cbd5e1" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
              />
              <ReferenceLine
                y={criticalThreshold}
                stroke="#dc2626"
                strokeDasharray="4 4"
                label={{
                  value: `Critical Threshold (${criticalThreshold}m)`,
                  position: "top",
                  fill: "#dc2626",
                  fontSize: 10,
                }}
              />
              <Area
                type="monotone"
                dataKey="upperBound"
                fill="#ccfbf1"
                stroke="none"
                name="Confidence Range (Upper)"
              />
              <Area
                type="monotone"
                dataKey="lowerBound"
                fill="#ffffff"
                stroke="none"
                name="Confidence Range (Lower)"
              />
              <Line
                type="monotone"
                dataKey="forecast"
                name="AI Predicted Depth (m bgl)"
                stroke="#0d9488"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#0d9488" }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          ) : viewMode === "historical" ? (
            <ComposedChart
              data={formattedHistorical}
              margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
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
                domain={["auto", "auto"]}
                unit="m"
                axisLine={{ stroke: "#cbd5e1" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
              />
              <ReferenceLine
                y={criticalThreshold}
                stroke="#dc2626"
                strokeDasharray="4 4"
                label={{
                  value: `Critical Threshold (${criticalThreshold}m)`,
                  position: "top",
                  fill: "#dc2626",
                  fontSize: 10,
                }}
              />
              <Line
                type="monotone"
                dataKey="preMonsoon"
                name="Pre-Monsoon (Summer Drawdown)"
                stroke="#dc2626"
                strokeWidth={2}
                dot={{ r: 3, fill: "#dc2626" }}
              />
              <Line
                type="monotone"
                dataKey="postMonsoon"
                name="Post-Monsoon (Recharge Level)"
                stroke="#0f2942"
                strokeWidth={2}
                dot={{ r: 3, fill: "#0f2942" }}
              />
            </ComposedChart>
          ) : (
            // Combined View
            <ComposedChart
              data={[
                ...formattedHistorical.map((h) => ({
                  period: h.period,
                  HistoricalDepth: h.postMonsoon,
                })),
                ...formattedForecast.slice(0, 8).map((f) => ({
                  period: f.period,
                  ForecastDepth: f.forecast,
                })),
              ]}
              margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
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
                domain={["auto", "auto"]}
                unit="m"
                axisLine={{ stroke: "#cbd5e1" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
              />
              <ReferenceLine
                y={criticalThreshold}
                stroke="#dc2626"
                strokeDasharray="4 4"
                label={{
                  value: `Critical Threshold (${criticalThreshold}m)`,
                  position: "top",
                  fill: "#dc2626",
                  fontSize: 10,
                }}
              />
              <Line
                type="monotone"
                dataKey="HistoricalDepth"
                name="Observed Depth (Post-Monsoon m bgl)"
                stroke="#0f2942"
                strokeWidth={2}
                dot={{ r: 3, fill: "#0f2942" }}
              />
              <Line
                type="monotone"
                dataKey="ForecastDepth"
                name="AI Model Forecast (m bgl)"
                stroke="#0d9488"
                strokeWidth={2.5}
                strokeDasharray="4 4"
                dot={{ r: 4, fill: "#0d9488" }}
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <span>
          <strong className="text-slate-700">Measurement Guide:</strong> Water table depth is measured in meters below ground level (m bgl).
        </span>
        <span className="font-medium text-[#0f2942]">
          Higher meter value = Deeper water table = Depleted aquifer
        </span>
      </div>
    </div>
  );
}
