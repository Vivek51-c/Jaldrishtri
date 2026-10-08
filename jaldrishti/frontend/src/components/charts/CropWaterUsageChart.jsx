import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";

export default function CropWaterUsageChart({ crops = [] }) {
  if (!crops || !crops.length) {
    return (
      <div className="text-center py-8 text-xs text-slate-400">
        No crop distribution data available
      </div>
    );
  }

  const data = crops.map((c) => ({
    name: c.name,
    areaPercent: c.areaPercent,
    waterReqMm: c.waterReqMm,
    isWaterIntensive: c.waterIntensive,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0].payload;
    return (
      <div className="bg-white border border-slate-300 rounded p-2.5 shadow-md text-xs">
        <p className="font-bold text-[#0f2942] mb-1">{item.name}</p>
        <div className="space-y-1">
          <p className="text-slate-600">
            Acreage Share: <span className="font-bold text-slate-900">{item.areaPercent}%</span>
          </p>
          <p className="text-slate-600">
            Water Requirement:{" "}
            <span className="font-bold text-[#0d9488]">{item.waterReqMm} mm/season</span>
          </p>
          <p className="text-slate-500 text-[10px]">
            {item.isWaterIntensive ? "⚠️ Water-intensive crop" : "✓ Climate-resilient demand"}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis
              type="number"
              unit="mm"
              stroke="#64748b"
              tick={{ fontSize: 11 }}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#1e293b"
              tick={{ fontSize: 11, fontWeight: 500 }}
              width={100}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="waterReqMm" name="Water Requirement (mm)" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isWaterIntensive ? "#dc2626" : "#0d9488"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-6 mt-2 text-xs font-medium">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-xs bg-[#dc2626] inline-block"></span>
          <span className="text-slate-700">Water-Intensive (&gt;800mm)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-xs bg-[#0d9488] inline-block"></span>
          <span className="text-slate-700">Low/Moderate (&lt;600mm)</span>
        </div>
      </div>
    </div>
  );
}
