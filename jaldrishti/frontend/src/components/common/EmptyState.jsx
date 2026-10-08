import { Inbox, RotateCcw } from "lucide-react";
import Button from "./Button";

/**
 * EmptyState
 * Clean government-style empty state for when filters return no records or lists are empty.
 */
export default function EmptyState({
  title = "No records found",
  description = "No groundwater monitoring blocks match your current filter parameters.",
  icon: Icon = Inbox,
  action,
  onReset,
  resetLabel = "Reset Filters",
  className = "",
}) {
  return (
    <div
      className={`py-12 px-6 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center flex flex-col items-center justify-center ${className}`}
    >
      <div
        className="w-11 h-11 rounded-lg bg-white border border-slate-200 text-slate-400 flex items-center justify-center mb-3 shadow-2xs"
        aria-hidden="true"
      >
        <Icon size={22} className="text-[#0f2942]/60" />
      </div>
      <h4 className="text-sm font-bold text-[#0f2942] tracking-tight">{title}</h4>
      <p className="text-xs text-slate-500 mt-1 max-w-md leading-relaxed">{description}</p>

      {(onReset || action) && (
        <div className="mt-4 flex items-center gap-2">
          {onReset && (
            <Button
              variant="secondary"
              size="sm"
              icon={RotateCcw}
              onClick={onReset}
            >
              {resetLabel}
            </Button>
          )}
          {action}
        </div>
      )}
    </div>
  );
}
