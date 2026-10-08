import { AlertTriangle, TrendingDown, CloudRain, Gauge, Wheat } from "lucide-react";
import Card from "./Card";
import RiskBadge from "./RiskBadge";

export default function RiskDriversCard({
  drivers = [],
  blockName = "",
}) {
  const defaultDrivers = [
    {
      id: "trend",
      title: "Declining Groundwater Trend",
      value: "-1.12 m / year",
      severity: "Critical",
      icon: TrendingDown,
      color: "red",
      description: "Severe multi-year hydraulic head decline exceeding the safe natural replenishment threshold.",
      impact: "High risk of tube well drying during summer pumping cycles.",
    },
    {
      id: "rainfall",
      title: "Rainfall Variation",
      value: "-22.5% Deficit",
      severity: "Moderate",
      icon: CloudRain,
      color: "amber",
      description: "Monsoon precipitation anomaly significantly lower than the 30-year IMD baseline.",
      impact: "Reduced natural percolation and surface recharge into shallow unconfined aquifers.",
    },
    {
      id: "irrigation",
      title: "Irrigation Pressure",
      value: "174.5% Extraction",
      severity: "Critical",
      icon: Gauge,
      color: "red",
      description: "Stage of groundwater extraction exceeds 100%, classified by CGWB as Over-Exploited.",
      impact: "Tubewell density causing regional drawdown and falling static water tables.",
    },
    {
      id: "crops",
      title: "Crop Water Demand",
      value: "1,250 mm / season",
      severity: "High",
      icon: Wheat,
      color: "red",
      description: "Extensive agricultural acreage under water-intensive flood-irrigated Paddy monoculture.",
      impact: "High agricultural consumptive water demand outpacing seasonal dynamic recharge.",
    },
  ];

  const list = drivers && drivers.length ? drivers : defaultDrivers;

  const iconMap = {
    trend: TrendingDown,
    rainfall: CloudRain,
    irrigation: Gauge,
    crops: Wheat,
  };

  return (
    <Card
      title="Key Groundwater Risk Drivers"
      subtitle={`Hydrological and agricultural stress factors contributing to vulnerability in ${blockName}`}
      icon={AlertTriangle}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {list.map((item) => {
          const Icon = iconMap[item.id] || item.icon || AlertTriangle;
          const isCritical = item.severity === "Critical" || item.severity === "High";

          return (
            <div
              key={item.id}
              className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 hover:bg-white hover:border-slate-300 transition-colors shadow-2xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1.5 rounded ${
                      isCritical
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    <Icon size={16} aria-hidden="true" />
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-[#0f2942]">
                    {item.title}
                  </h4>
                </div>
                <RiskBadge level={item.severity === "Critical" ? "Critical" : item.severity === "Safe" ? "Safe" : "Watch"} size="sm" />
              </div>

              <div className="flex items-baseline justify-between pt-1 border-t border-slate-200">
                <span className="text-xs text-slate-500 font-medium">Observed Value:</span>
                <span className="text-sm font-extrabold text-[#0f2942] font-mono">
                  {item.value}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {item.description}
              </p>

              {item.impact && (
                <div className="p-2 bg-white border border-slate-200 rounded text-[11px] text-slate-700">
                  <strong className="text-slate-900">Hydrogeological Impact: </strong>
                  {item.impact}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
