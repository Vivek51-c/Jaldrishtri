import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from "recharts";

export default function StateComparisonChart({
  statesData = [],
  metric = "stageOfExtraction", // "stageOfExtraction" | "criticalPercent" | "avgDepthMeters"
}) {
  const metricConfigs = {
    stageOfExtraction: {
      name: "Stage of Extraction (%)",
      unit: "%",
      color: "#0f2942",
      threshold: 100,
      thresholdLabel: "Over-Exploited Threshold (100%)",
    },
    criticalPercent: {
      name: "Critical Blocks Share (%)",
      unit: "%",
      color: "#dc2626",
      threshold: 50,
      thresholdLabel: "Severe Vulnerability (>50%)",
    },
    avgDepthMeters: {
      name: "Average Water Table Depth (m bgl)",
      unit: "m",
      color: "#0d9488",
      threshold: 25,
      thresholdLabel: "Deep Aquifer Concern (25m)",
    },
  };

  const config = metricConfigs[metric] || metricConfigs.stageOfExtraction;

  const data = statesData.map((s) => ({
    state: s.state,
    value: s[metric],
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div className="bg-white border border-slate-300 rounded p-2.5 shadow-md text-xs">
        <p className="font-bold text-[#0f2942] mb-1">{label}</p>
        <p className="text-slate-700">
          {config.name}:{" "}
          <span className="font-bold text-[#0f2942]">
            {payload[0].value} {config.unit}
          </span>
        </p>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 15, right: 20, left: -10, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="state"
              stroke="#64748b"
              tick={{ fontSize: 11 }}
              interval={0}
              angle={-25}
              textAnchor="end"
            />
            <YAxis
              stroke="#64748b"
              tick={{ fontSize: 11 }}
              unit={config.unit}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={config.threshold}
              stroke="#dc2626"
              strokeDasharray="4 4"
              label={{
                value: config.thresholdLabel,
                position: "top",
                fill: "#dc2626",
                fontSize: 10,
              }}
            />
            <Bar
              dataKey="value"
              name={config.name}
              fill={config.color}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
