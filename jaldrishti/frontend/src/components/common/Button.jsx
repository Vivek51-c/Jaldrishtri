/**
 * Button
 * Professional gov-tech action button with accessible contrast.
 */
export default function Button({
  children,
  variant = "primary", // "primary" | "teal" | "secondary" | "danger" | "ghost"
  size = "md", // "sm" | "md" | "lg"
  icon: Icon,
  iconPosition = "left",
  disabled = false,
  className = "",
  onClick,
  type = "button",
  ...props
}) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-hidden focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const variants = {
    primary:
      "bg-[#0f2942] hover:bg-[#0c2035] text-white focus:ring-[#0f2942] shadow-xs",
    teal:
      "bg-[#0d9488] hover:bg-[#0f766e] text-white focus:ring-[#0d9488] shadow-xs",
    secondary:
      "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 focus:ring-slate-400 shadow-2xs",
    outlineTeal:
      "bg-white hover:bg-teal-50 text-[#0d9488] border border-[#0d9488] focus:ring-[#0d9488]",
    danger:
      "bg-red-600 hover:bg-red-700 text-white focus:ring-red-600 shadow-xs",
    ghost:
      "bg-transparent hover:bg-slate-100 text-slate-700 focus:ring-slate-300",
  };

  const sizes = {
    sm: "px-2.5 py-1.5 text-xs gap-1.5",
    md: "px-3.5 py-2 text-sm gap-2",
    lg: "px-4.5 py-2.5 text-base gap-2.5",
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18,
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${
        sizes[size] || sizes.md
      } ${className}`}
      {...props}
    >
      {Icon && iconPosition === "left" && (
        <Icon size={iconSizes[size] || 16} className="shrink-0" aria-hidden="true" />
      )}
      <span>{children}</span>
      {Icon && iconPosition === "right" && (
        <Icon size={iconSizes[size] || 16} className="shrink-0" aria-hidden="true" />
      )}
    </button>
  );
}
