/**
 * Card
 * Reusable light-grey container card adhering to government ag-tech design requirements.
 */
export default function Card({
  title,
  subtitle,
  icon: Icon,
  badge,
  actions,
  children,
  footer,
  className = "",
  headerClassName = "",
  bodyClassName = "",
}) {
  const hasHeader = title || subtitle || Icon || badge || actions;

  return (
    <div
      className={`bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden ${className}`}
    >
      {hasHeader && (
        <div
          className={`px-5 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 ${headerClassName}`}
        >
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className="p-1.5 rounded bg-white border border-slate-200 text-[#0f2942] shrink-0" aria-hidden="true">
                <Icon size={18} />
              </div>
            )}
            <div>
              {title && (
                <h3 className="text-sm font-bold text-[#0f2942] tracking-tight">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {badge && <div>{badge}</div>}
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </div>
      )}

      <div className={`p-5 ${bodyClassName}`}>{children}</div>

      {footer && (
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600">
          {footer}
        </div>
      )}
    </div>
  );
}
