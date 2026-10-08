import {
  Droplets,
  Database,
  Layers,
  TrendingDown,
  ShieldCheck,
  Sliders,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Info,
  Sprout,
  Bot,
  CheckCircle2,
  Calendar,
  FileText,
  Activity,
} from "lucide-react";
import PageContainer from "../components/layout/PageContainer";
import Card from "../components/common/Card";
import RiskBadge from "../components/common/RiskBadge";

/**
 * JalDrishti About Page (/about)
 * 
 * Concise, professional overview covering:
 * 1. What is JalDrishti?
 * 2. Data Sources
 * 3. How It Works (includes simple pipeline visual)
 * 4. Forecasting Method
 * 5. Risk Classification
 * 6. Irrigation Simulator
 * 7. AI Advisor
 * 8. Limitations
 */
export default function About() {
  const pipelineSteps = [
    {
      id: "data",
      title: "Groundwater Data",
      desc: "Telemetry wells & rainfall",
      icon: Database,
    },
    {
      id: "processing",
      title: "Data Processing",
      desc: "Quality checks & baselines",
      icon: Layers,
    },
    {
      id: "forecasting",
      title: "Forecasting",
      desc: "Multi-season projections",
      icon: TrendingDown,
    },
    {
      id: "risk",
      title: "Risk Analysis",
      desc: "Safe, Watch & Critical tiers",
      icon: ShieldCheck,
    },
    {
      id: "simulation",
      title: "Irrigation Simulation",
      desc: "Crop substitution modeling",
      icon: Sliders,
    },
    {
      id: "advisory",
      title: "AI Advisory",
      desc: "Tailored multi-lingual advice",
      icon: Sparkles,
    },
  ];

  return (
    <PageContainer
      title="About JalDrishti"
      subtitle="AI-Based Groundwater Forecasting & Irrigation Advisory for India. A decision-support platform for groundwater management and crop planning."
      badge={
        <span className="text-xs font-bold uppercase tracking-wider text-[#0d9488] px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200">
          Platform Overview
        </span>
      }
    >
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Pipeline Visual Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0f2942] flex items-center gap-1.5">
              <Activity size={15} className="text-[#0d9488]" />
              JalDrishti Architecture Pipeline
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              End-to-End Decision Workflow
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
            {pipelineSteps.map((step, idx) => {
              const Icon = step.icon;
              const isLast = idx === pipelineSteps.length - 1;

              return (
                <div key={step.id} className="relative flex flex-col">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center text-center space-y-1.5 h-full hover:border-teal-300 transition-colors">
                    <div className="p-2 rounded-full bg-white border border-slate-200 text-[#0f2942] shrink-0 shadow-2xs">
                      <Icon size={16} className="text-[#0d9488]" />
                    </div>
                    <span className="font-bold text-[#0f2942] text-xs leading-tight">
                      {step.title}
                    </span>
                    <span className="text-[10px] text-slate-500 leading-tight">
                      {step.desc}
                    </span>
                  </div>

                  {!isLast && (
                    <div className="hidden lg:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-slate-400">
                      <ArrowRight size={14} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 1. What is JalDrishti? */}
        <Card
          title="1. What is JalDrishti?"
          subtitle="Platform mission and purpose"
          icon={Droplets}
        >
          <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <p>
              <strong>JalDrishti (जल दृष्टि)</strong> is a decision-support platform designed to help
              farmers, agricultural extension officers, and water resource planners address
              groundwater depletion across India.
            </p>
            <p>
              India is the world's largest consumer of groundwater, with agriculture accounting for
              over 85% of total annual extraction. JalDrishti translates complex hydrogeological
              measurements into accessible forecasts, risk classifications, and what-if crop
              diversification simulations to encourage sustainable water demand management.
            </p>
          </div>
        </Card>

        {/* 2. Data Sources */}
        <Card
          title="2. Data Sources"
          subtitle="Telemetry networks and observational benchmarks"
          icon={Database}
        >
          <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <p>
              JalDrishti references public hydrogeological and meteorological observation frameworks:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <span className="font-bold text-[#0f2942] block">
                  Groundwater Telemetry & Observation Wells
                </span>
                <p className="text-slate-600">
                  Historical and seasonal water level depth observations from Digital Water Level
                  Recorders (DWLR) and monitoring piezometers benchmarked against Central Ground Water
                  Board (CGWB) monitoring network conventions.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <span className="font-bold text-[#0f2942] block">
                  Precipitation & Monsoon Metrics
                </span>
                <p className="text-slate-600">
                  Seasonal precipitation totals, long-period average normal rainfall, and localized
                  rainfall deficit indicators aligned with India Meteorological Department (IMD)
                  regional weather bulletins.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <span className="font-bold text-[#0f2942] block">
                  Crop Evapotranspiration Benchmarks
                </span>
                <p className="text-slate-600">
                  Consumptive crop water requirements (mm/season) and per-hectare volumetric demand
                  factors sourced from standard agronomic reference tables (FAO-56 and ICAR guidelines).
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <span className="font-bold text-[#0f2942] block">
                  National Resource Assessments
                </span>
                <p className="text-slate-600">
                  Block-level replenishable dynamic groundwater recharge, annual extraction draft, and
                  stage of extraction metrics based on Groundwater Estimation Committee (GEC)
                  methodology.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* 3. How It Works */}
        <Card
          title="3. How It Works"
          subtitle="Operational workflow and decision architecture"
          icon={Layers}
        >
          <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <p>
              JalDrishti operates through an integrated multi-tier workflow:
            </p>
            <ol className="space-y-2 pl-4 list-decimal text-xs sm:text-sm">
              <li>
                <strong>Telemetry Aggregation:</strong> Reads groundwater level observations and
                computes depth trends (meters below ground level) across agricultural blocks.
              </li>
              <li>
                <strong>Baseline Calibration:</strong> Couples pre-monsoon and post-monsoon water
                levels with local rainfall variations to evaluate net aquifer replenishment.
              </li>
              <li>
                <strong>Predictive Trajectory:</strong> Projects multi-season water table depth
                scenarios over 1 to 3 seasons based on prevailing extraction patterns.
              </li>
              <li>
                <strong>Interactive Simulation:</strong> Allows users to model what-if crop shifts,
                quantifying potential water savings and hydraulic head recovery.
              </li>
              <li>
                <strong>Decision Advisory:</strong> Delivers site-specific crop recommendations,
                micro-irrigation advice, and government subsidy linkages in regional languages.
              </li>
            </ol>
          </div>
        </Card>

        {/* 4. Forecasting Method */}
        <Card
          title="4. Forecasting Method"
          subtitle="Multi-season time-series projection approach"
          icon={Calendar}
        >
          <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <p>
              Groundwater depth projections are generated using a multi-season time-series approach
              that models depth trajectories across 1 season (6 months), 2 seasons (1 year), and 3
              seasons (18 months):
            </p>
            <ul className="space-y-1.5 pl-4 list-disc text-xs sm:text-sm">
              <li>
                <strong>Historical Trend Extrapolation:</strong> Projects the baseline annual rate of
                water table change (m/year) calculated from multi-year telemetry observations.
              </li>
              <li>
                <strong>Seasonal Monsoon Adjustments:</strong> Accounts for historical pre-monsoon
                drawdown and post-monsoon recharge cycles.
              </li>
              <li>
                <strong>Confidence Intervals:</strong> Computes an estimated lower and upper range
                reflecting natural precipitation and extraction variability.
              </li>
            </ul>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
              <Info size={15} className="text-amber-700 shrink-0 mt-0.5" />
              <span>
                <strong>Note:</strong> Forecasts are mathematical estimates based on scenario
                assumptions and historical patterns. They serve as indicative planning tools, not
                exact physical certainties.
              </span>
            </div>
          </div>
        </Card>

        {/* 5. Risk Classification */}
        <Card
          title="5. Risk Classification"
          subtitle="Categorization based on stage of groundwater extraction"
          icon={ShieldCheck}
        >
          <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <p>
              Blocks are categorized into three standardized risk levels aligned with Central Ground
              Water Board (CGWB) assessment conventions:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {/* Safe */}
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-lg space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <RiskBadge level="Safe" size="sm" />
                  <span className="font-bold text-emerald-800">&lt; 70% Extraction</span>
                </div>
                <h4 className="font-bold text-[#0f2942]">Safe Category</h4>
                <p className="text-slate-600 leading-relaxed">
                  Stage of groundwater extraction is below 70% with no significant long-term decline
                  in seasonal water levels. Replenishment generally matches or exceeds draft.
                </p>
              </div>

              {/* Watch */}
              <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-lg space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <RiskBadge level="Watch" size="sm" />
                  <span className="font-bold text-amber-800">70% – 100% Extraction</span>
                </div>
                <h4 className="font-bold text-[#0f2942]">Watch Category</h4>
                <p className="text-slate-600 leading-relaxed">
                  Stage of extraction is between 70% and 100%, or notable water table decline is
                  observed in pre- or post-monsoon readings. Precautionary demand management is
                  advised.
                </p>
              </div>

              {/* Critical */}
              <div className="p-4 bg-red-50/50 border border-red-200 rounded-lg space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <RiskBadge level="Critical" size="sm" />
                  <span className="font-bold text-red-800">&gt; 100% Extraction</span>
                </div>
                <h4 className="font-bold text-[#0f2942]">Critical Category</h4>
                <p className="text-slate-600 leading-relaxed">
                  Stage of extraction exceeds 100% (classified as Over-Exploited), indicating gross
                  groundwater draft surpasses annual replenishable recharge. Sustained water table
                  drawdown is observed.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* 6. Irrigation Simulator */}
        <Card
          title="6. Irrigation Simulator"
          subtitle="Scenario modeling for crop substitution"
          icon={Sliders}
        >
          <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <p>
              The <strong>Irrigation Simulator</strong> enables interactive what-if analysis to evaluate
              how shifting acreage away from water-intensive crops impacts local groundwater resources:
            </p>
            <ul className="space-y-1.5 pl-4 list-disc text-xs sm:text-sm">
              <li>
                <strong>Crop Diversification Levers:</strong> Model replacing a percentage of current
                high-water crops (such as flood paddy or sugarcane) with climate-smart alternatives (such
                as maize, nutri-millets, or pulses).
              </li>
              <li>
                <strong>Demand Reduction & Water Saved:</strong> Calculates the percentage reduction in
                irrigation demand and estimates the net volume of water conserved (Million Cubic
                Meters).
              </li>
              <li>
                <strong>Groundwater Head Response:</strong> Projects the stabilized water table depth
                and compares the intervention trajectory against the baseline status-quo decline.
              </li>
            </ul>
            <p className="text-xs text-slate-500">
              <em>All simulation outcomes are estimates based on scenario assumptions and representative crop water requirements.</em>
            </p>
          </div>
        </Card>

        {/* 7. AI Advisor */}
        <Card
          title="7. AI Advisor"
          subtitle="Contextual agro-hydrological recommendations"
          icon={Bot}
        >
          <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <p>
              The <strong>JalDrishti Advisor</strong> provides automated, context-specific guidance
              grounded in block-level telemetry data:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <span className="font-bold text-[#0f2942] block">
                  Structured Guidance Format
                </span>
                <p className="text-slate-600">
                  Every advisory response highlights an actionable recommendation, supporting
                  groundwater telemetry numbers, the assessed risk level, and a concise explanation.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <span className="font-bold text-[#0f2942] block">
                  Multilingual Accessibility
                </span>
                <p className="text-slate-600">
                  Offers guidance in English, Hindi (हिंदी), and Punjabi (ਪੰਜਾਬੀ), enabling accessible
                  communication for diverse farming communities.
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-600">
              Guidance aligns with government schemes including the Pradhan Mantri Krishi Sinchayee
              Yojana (PMKSY — Per Drop More Crop), Atal Bhujal Yojana, and state-level crop
              diversification incentives.
            </p>
          </div>
        </Card>

        {/* 8. Limitations */}
        <Card
          title="8. Limitations & Disclaimers"
          subtitle="Model boundaries and decision-support context"
          icon={AlertTriangle}
        >
          <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <p>
              To ensure responsible use, stakeholders should understand the methodological boundaries
              of the platform:
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <strong className="text-[#0f2942] block">
                  Estimates, Not Engineering Guarantees
                </strong>
                <p className="text-slate-600">
                  Forecasts and simulation results are indicative estimates derived from scenario
                  assumptions, simplified specific yield parameters, and generalized crop water
                  coefficients. They do not claim absolute scientific precision.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <strong className="text-[#0f2942] block">
                  Not a Substitute for Hydrogeological Pump Tests
                </strong>
                <p className="text-slate-600">
                  JalDrishti does not replace localized geophysical resistivity surveys, borehole
                  pumping tests, or 3D numerical aquifer simulations (such as MODFLOW). Local aquifer
                  heterogeneity and unmetered private pumping can cause variations from block-level
                  averages.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <strong className="text-[#0f2942] block">
                  Decision-Support Purpose
                </strong>
                <p className="text-slate-600">
                  The tool is intended for participatory planning, educational demonstrations, and
                  macro-level policy exploration under community water security initiatives.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
