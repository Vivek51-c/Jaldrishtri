import { Droplets } from "lucide-react";

/**
 * LoadingState
 * Clean government/agtech loading indicator with accessible status announcements.
 */
export default function LoadingState({
  message = "Loading groundwater metrics...",
  submessage = "Calibrating observational telemetry and hydrological models",
  inline = false,
  className = "",
}) {
  if (inline) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`inline-flex items-center gap-2 text-xs text-slate-600 font-medium ${className}`}
      >
        <span
          className="w-3.5 h-3.5 border-2 border-[#0d9488] border-t-transparent rounded-full animate-spin shrink-0"
          aria-hidden="true"
        />
        <span>{message}</span>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`py-14 px-4 flex flex-col items-center justify-center text-center ${className}`}
    >
      <div className="relative mb-3.5">
        <div
          className="w-10 h-10 border-3 border-[#0d9488]/20 border-t-[#0d9488] rounded-full animate-spin"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 flex items-center justify-center text-[#0f2942]"
          aria-hidden="true"
        >
          <Droplets size={16} className="text-[#0d9488]" />
        </div>
      </div>
      <p className="text-sm font-bold text-[#0f2942] tracking-tight">{message}</p>
      {submessage && (
        <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">{submessage}</p>
      )}
    </div>
  );
}
