import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Droplets,
  BarChart3,
  Sliders,
  MessageSquare,
  Info,
  Menu,
  X,
  MapPin,
} from "lucide-react";
import { useGroundwater } from "../../context/GroundwaterContext";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const {
    filterState,
    setFilterState,
    statesList,
    blocks,
    selectBlock,
  } = useGroundwater();

  const navigate = useNavigate();

  // Links in specified exact order:
  // 1. Dashboard, 2. Compare, 3. Simulator, 4. Advisor, 5. About
  const navItems = [
    { to: "/", label: "Dashboard", icon: BarChart3, exact: true },
    { to: "/compare", label: "Compare", icon: BarChart3 },
    { to: "/simulator", label: "Simulator", icon: Sliders },
    { to: "/advisor", label: "Advisor", icon: MessageSquare },
    { to: "/about", label: "About", icon: Info },
  ];

  const handleQuickBlockSelect = (e) => {
    const blockId = e.target.value;
    if (blockId) {
      selectBlock(blockId);
      navigate(`/block/${blockId}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Gov-Tech Utility Ribbon */}
      <div className="bg-slate-50 border-b border-slate-200 text-xs px-4 sm:px-6 lg:px-8 py-1.5 text-slate-600">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Left: Platform Authority Context */}
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-2 h-2 rounded-full bg-emerald-500"
              aria-hidden="true"
            />
            <span className="font-semibold text-[#0f2942]">
              JalDrishti (जल दृष्टि)
            </span>
            <span className="text-slate-400 hidden sm:inline">&bull;</span>
            <span className="text-slate-500 hidden sm:inline">
              National Groundwater Telemetry & Irrigation Intelligence
            </span>
            <span className="text-slate-400 hidden md:inline">&bull;</span>
            <span className="text-slate-500 hidden md:inline">
              CGWB / Ministry of Jal Shakti Aligned
            </span>
          </div>

          {/* Right: State Selector */}
          <div className="flex items-center gap-3">
            {/* Simple State Selector Area */}
            <div className="flex items-center gap-1.5 text-xs">
              <MapPin size={13} className="text-[#0d9488] shrink-0" aria-hidden="true" />
              <label
                htmlFor="global-state-selector"
                className="font-semibold text-slate-700 hidden sm:inline"
              >
                State:
              </label>
              <select
                id="global-state-selector"
                value={filterState}
                onChange={(e) => setFilterState(e.target.value)}
                className="py-0.5 pl-2 pr-6 text-xs font-semibold text-[#0f2942] bg-white border border-slate-300 rounded shadow-2xs focus:outline-hidden focus:ring-1 focus:ring-[#0d9488] cursor-pointer"
                title="Filter platform data by Indian State"
              >
                {statesList.map((st) => (
                  <option key={st} value={st}>
                    {st === "All" ? "All States (National)" : st}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Platform Name */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-10 h-10 rounded-lg bg-[#0f2942] flex items-center justify-center text-[#0d9488] shadow-2xs group-hover:bg-[#0c2035] transition-colors">
              <Droplets size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-[#0f2942]">
                  Jal<span className="text-[#0d9488]">Drishti</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
                  Agri-AI
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 leading-tight">
                Groundwater Forecasting & Irrigation Advisory
              </p>
            </div>
          </Link>

          {/* Desktop & Tablet Navigation Links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center space-x-1 lg:space-x-2"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-slate-100 text-[#0f2942] border-b-2 border-[#0d9488] shadow-2xs"
                        : "text-slate-600 hover:text-[#0f2942] hover:bg-slate-50"
                    }`
                  }
                >
                  <Icon size={16} className="shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Right Action Area: Quick Block Switcher */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="relative">
              <select
                aria-label="Quick jump to monitored block"
                onChange={handleQuickBlockSelect}
                defaultValue=""
                className="py-1.5 pl-3 pr-8 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0d9488] cursor-pointer"
              >
                <option value="" disabled>
                  Jump to Monitored Block...
                </option>
                {blocks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.state}) &bull; {b.riskLevel}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mobile & Tablet Hamburger Toggle */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#0f2942]"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer (Responsive on Tablet and Mobile) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3 shadow-md">
          {/* Nav Links */}
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold ${
                      isActive
                        ? "bg-slate-100 text-[#0f2942] border-l-4 border-[#0d9488]"
                        : "text-slate-600 hover:bg-slate-50"
                    }`
                  }
                >
                  <Icon size={18} aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Mobile State Selector */}
          <div className="pt-2 border-t border-slate-200">
            <label
              htmlFor="mobile-state-selector"
              className="block text-xs font-semibold text-slate-600 mb-1"
            >
              Filter by State:
            </label>
            <select
              id="mobile-state-selector"
              value={filterState}
              onChange={(e) => {
                setFilterState(e.target.value);
                setMobileMenuOpen(false);
              }}
              className="w-full p-2 text-xs font-semibold text-[#0f2942] bg-slate-50 border border-slate-300 rounded-md"
            >
              {statesList.map((st) => (
                <option key={st} value={st}>
                  {st === "All" ? "All States (National)" : st}
                </option>
              ))}
            </select>
          </div>



          {/* Mobile Jump to Block */}
          <div className="pt-2 border-t border-slate-200">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Jump to Monitored Block:
            </label>
            <select
              aria-label="Quick jump to block mobile"
              onChange={(e) => {
                handleQuickBlockSelect(e);
                setMobileMenuOpen(false);
              }}
              defaultValue=""
              className="w-full p-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-300 rounded-md"
            >
              <option value="" disabled>
                Select Monitored Block...
              </option>
              {blocks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.state}) &bull; {b.riskLevel}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </header>
  );
}
