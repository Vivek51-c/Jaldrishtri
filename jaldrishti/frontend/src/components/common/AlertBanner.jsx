import { AlertTriangle, Info, AlertOctagon, CheckCircle2 } from "lucide-react";

/**
 * AlertBanner
 * Clean government-style alert banner for high-risk warnings or advisories.
 */
export default function AlertBanner({
  type = "info", // "info" | "warning" | "critical" | "success"
  title,
  message,
  action,
  className = "",
}) {
  const configs = {
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-900",
      iconColor: "text-blue-700",
      Icon: Info,
    },
    warning: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-900",
      iconColor: "text-amber-700",
      Icon: AlertTriangle,
    },
    critical: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-900",
      iconColor: "text-red-700",
      Icon: AlertOctagon,
    },
    success: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-900",
      iconColor: "text-emerald-700",
      Icon: CheckCircle2,
    },
  };

  const { bg, border, text, iconColor, Icon } = configs[type] || configs.info;

  return (
    <div
      role="alert"
      className={`rounded-lg border p-4 ${bg} ${border} ${text} flex items-start gap-3.5 shadow-2xs ${className}`}
    >
      <div className={`shrink-0 mt-0.5 ${iconColor}`} aria-hidden="true">
        <Icon size={19} />
      </div>
      <div className="flex-1 text-sm">
        {title && <h4 className="font-bold tracking-tight mb-0.5">{title}</h4>}
        <div className="text-slate-700 leading-relaxed text-xs sm:text-sm">{message}</div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
