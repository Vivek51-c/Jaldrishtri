import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

/**
 * KpiCard
 * Clean, high-contrast KPI card with large numerical values and semantic status cues.
 */
export default function KpiCard({
  title,
  value,
  unit = "",
  subtitle,
  trend, // { value: "+0.8", direction: "up" | "down" | "neutral", label: "vs last year", isGood: boolean }
  icon: Icon,
  badge,
  accentColor = "blue", // "blue" | "teal" | "amber" | "red"
  className = "",
}) {
  const accentBorder = {
    blue: "border-l-4 border-l-[#0f2942]",
    teal: "border-l-4 border-l-[#0d9488]",
    amber: "border-l-4 border-l-[#d97706]",
    red: "border-l-4 border-l-[#dc2626]",
    neutral: "border-l-4 border-l-slate-400",
  }[accentColor] || "border-l-4 border-l-[#0f2942]";

  const iconBg = {
    blue: "bg-blue-50 text-[#0f2942]",
    teal: "bg-teal-50 text-[#0d9488]",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    neutral: "bg-slate-100 text-slate-700",
  }[accentColor] || "bg-blue-50 text-[#0f2942]";

  return (
    <div
      className={`bg-white border border-slate-200 rounded-lg p-5 shadow-xs ${accentBorder} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            {title}
          </p>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-3xl font-extrabold text-[#0f2942] tracking-tight">
              {value}
            </span>
            {unit && (
              <span className="text-sm font-semibold text-slate-500">
                {unit}
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div className={`p-2.5 rounded-lg shrink-0 ${iconBg}`} aria-hidden="true">
            <Icon size={20} />
          </div>
        )}
      </div>

      {(subtitle || trend || badge) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 gap-2 flex-wrap">
          {trend ? (
            <div className="flex items-center gap-1 font-medium">
              {trend.direction === "up" && (
                <ArrowUpRight
                  size={15}
                  className={trend.isGood ? "text-emerald-600" : "text-red-600"}
                />
              )}
              {trend.direction === "down" && (
                <ArrowDownRight
                  size={15}
                  className={trend.isGood ? "text-emerald-600" : "text-red-600"}
                />
              )}
              {trend.direction === "neutral" && (
                <Minus size={15} className="text-slate-400" />
              )}
              <span
                className={
                  trend.direction === "neutral"
                    ? "text-slate-600"
                    : trend.isGood
                    ? "text-emerald-700 font-semibold"
                    : "text-red-700 font-semibold"
                }
              >
                {trend.value}
              </span>
              <span className="text-slate-500">{trend.label}</span>
            </div>
          ) : (
            <span className="text-slate-500">{subtitle}</span>
          )}

          {badge && <div className="shrink-0">{badge}</div>}
        </div>
      )}
    </div>
  );
}
