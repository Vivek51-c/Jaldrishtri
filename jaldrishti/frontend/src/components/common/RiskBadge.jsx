import { ShieldCheck, AlertTriangle, AlertOctagon } from "lucide-react";

/**
 * RiskBadge
 * Displays risk classification with explicit text label and accessible color contrast.
 * Supported levels: "Safe" (Green), "Watch" (Amber), "Critical" (Red)
 */
export default function RiskBadge({ level = "Safe", size = "md", showIcon = true, className = "" }) {
  const normalizedLevel = (level || "Safe").toLowerCase();

  let config = {
    label: "Safe",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-300",
    dot: "bg-emerald-600",
    Icon: ShieldCheck,
  };

  if (normalizedLevel.includes("watch") || normalizedLevel.includes("semi")) {
    config = {
      label: "Watch",
      bg: "bg-amber-50",
      text: "text-amber-800",
      border: "border-amber-300",
      dot: "bg-amber-600",
      Icon: AlertTriangle,
    };
  } else if (normalizedLevel.includes("critical") || normalizedLevel.includes("over")) {
    config = {
      label: "Critical",
      bg: "bg-red-50",
      text: "text-red-800",
      border: "border-red-300",
      dot: "bg-red-600",
      Icon: AlertOctagon,
    };
  } else if (normalizedLevel.includes("unknown") || !level) {
    config = {
      label: "Monitored",
      bg: "bg-slate-50",
      text: "text-slate-700",
      border: "border-slate-300",
      dot: "bg-slate-500",
      Icon: ShieldCheck,
    };
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-semibold gap-1",
    md: "px-2.5 py-1 text-xs font-semibold gap-1.5",
    lg: "px-3 py-1.5 text-sm font-semibold gap-2",
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  const { Icon } = config;

  return (
    <span
      className={`inline-flex items-center rounded-md border ${config.bg} ${config.text} ${config.border} ${sizeClasses[size] || sizeClasses.md} ${className}`}
      role="status"
      aria-label={`Groundwater risk status: ${config.label}`}
    >
      {showIcon ? (
        <Icon size={iconSizes[size] || 14} className="shrink-0" aria-hidden="true" />
      ) : (
        <span className={`w-2 h-2 rounded-full ${config.dot} shrink-0`} aria-hidden="true" />
      )}
      <span>{config.label}</span>
    </span>
  );
}
