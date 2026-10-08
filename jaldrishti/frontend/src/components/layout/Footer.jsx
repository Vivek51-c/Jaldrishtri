import { Link } from "react-router-dom";
import { Droplets, Shield, ExternalLink, HelpCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 mt-auto text-slate-600 text-xs">
      {/* Top Footer Data Source Bar */}
      <div className="border-b border-slate-200 py-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#0f2942] flex items-center justify-center text-teal-400">
              <Droplets size={18} />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">
                JalDrishti Groundwater Decision Support System
              </p>
              <p className="text-slate-500 text-xs">
                Data calibrated against CGWB National Groundwater Assessment & IMD Gridded Rainfall
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              CGWB 2024–2026 Assessment
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-500"></span>
              PMKSY Scheme Metrics
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              IMD Hydrometeorological Grid
            </span>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-3">About JalDrishti</h4>
            <p className="text-slate-500 leading-relaxed text-xs">
              JalDrishti leverages time-series aquifer models and machine learning to forecast
              groundwater depths, assess critical extraction risks, and provide actionable crop
              diversification pathways for agricultural policymakers and farmers.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-3">Quick Navigation</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="hover:text-[#0f2942] transition-colors">
                  National Risk Dashboard
                </Link>
              </li>
              <li>
                <Link to="/simulator" className="hover:text-[#0f2942] transition-colors">
                  Crop & Irrigation Simulator
                </Link>
              </li>
              <li>
                <Link to="/advisor" className="hover:text-[#0f2942] transition-colors">
                  AI Irrigation Advisor
                </Link>
              </li>
              <li>
                <Link to="/compare" className="hover:text-[#0f2942] transition-colors">
                  Inter-State Vulnerability Matrix
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#0f2942] transition-colors">
                  Methodology & Classification Rubric
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-3">Official Water Schemes</h4>
            <ul className="space-y-2 text-slate-500">
              <li>
                <a
                  href="https://pmksy.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#0f2942] flex items-center gap-1"
                >
                  PMKSY Per Drop More Crop <ExternalLink size={12} />
                </a>
              </li>
              <li>
                <a
                  href="https://ataljal.mowr.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#0f2942] flex items-center gap-1"
                >
                  Atal Bhujal Yojana (ABHY) <ExternalLink size={12} />
                </a>
              </li>
              <li>
                <a
                  href="http://cgwb.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#0f2942] flex items-center gap-1"
                >
                  Central Ground Water Board (CGWB) <ExternalLink size={12} />
                </a>
              </li>
              <li>
                <a
                  href="https://pmkusum.mnre.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#0f2942] flex items-center gap-1"
                >
                  PM-KUSUM Solar Irrigation <ExternalLink size={12} />
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-3">Emergency & Advisory</h4>
            <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2 text-xs">
              <p className="font-semibold text-slate-800">Kisan Call Centre (Toll Free):</p>
              <p className="text-base font-bold text-[#0d9488]">1800-180-1551</p>
              <p className="text-slate-500 text-[11px]">
                Operational 6:00 AM to 10:00 PM for agricultural & groundwater guidance.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-slate-500 gap-4">
          <p>© 2026 JalDrishti. Built for National Groundwater Sustainability Hackathon.</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1 text-slate-500">
              <Shield size={13} className="text-teal-600" /> Open Public Agro-Informatics
            </span>
            <span>•</span>
            <span>Mock Simulation Environment</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
