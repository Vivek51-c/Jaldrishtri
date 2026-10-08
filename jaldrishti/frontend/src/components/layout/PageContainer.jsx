import { MapPin } from "lucide-react";
import { useGroundwater } from "../../context/GroundwaterContext";

/**
 * PageContainer
 * Standardized responsive wrapper for all JalDrishti pages.
 * Handles desktop, tablet, and mobile spacing, header hierarchy, state selector slot, and actions.
 */
export default function PageContainer({
  title,
  subtitle,
  badge,
  actions,
  breadcrumbs,
  showStateSelector = false,
  className = "",
  children,
}) {
  const { filterState, setFilterState, statesList } = useGroundwater();

  const hasHeader = title || subtitle || actions || breadcrumbs || showStateSelector;

  return (
    <div className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 ${className}`}>
      {/* Optional Breadcrumb */}
      {breadcrumbs && (
        <nav aria-label="Breadcrumb" className="text-xs text-slate-500 font-medium">
          {breadcrumbs}
        </nav>
      )}

      {/* Page Header */}
      {hasHeader && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              {title && (
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f2942] tracking-tight">
                  {title}
                </h1>
              )}
              {badge && <div>{badge}</div>}
            </div>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
                {subtitle}
              </p>
            )}
          </div>

          {/* Right Header Area: State Selector and Actions */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {showStateSelector && (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 shadow-2xs">
                <MapPin size={13} className="text-[#0d9488] shrink-0" aria-hidden="true" />
                <label htmlFor="page-state-selector" className="text-xs font-semibold text-slate-600">
                  State:
                </label>
                <select
                  id="page-state-selector"
                  value={filterState}
                  onChange={(e) => setFilterState(e.target.value)}
                  className="text-xs font-bold text-[#0f2942] bg-white border border-slate-300 rounded px-2 py-0.5 focus:outline-hidden focus:ring-1 focus:ring-[#0d9488] cursor-pointer"
                >
                  {statesList.map((st) => (
                    <option key={st} value={st}>
                      {st === "All" ? "All States (National)" : st}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div>{children}</div>
    </div>
  );
}
