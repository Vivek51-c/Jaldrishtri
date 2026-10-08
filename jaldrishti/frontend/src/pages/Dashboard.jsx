import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Droplets,
  AlertOctagon,
  AlertTriangle,
  ShieldCheck,
  TrendingDown,
  ArrowRight,
  Filter,
  Search,
  Sliders,
  Sparkles,
} from "lucide-react";
import { useGroundwater } from "../context/GroundwaterContext";
import PageContainer from "../components/layout/PageContainer";
import KpiCard from "../components/common/KpiCard";
import Card from "../components/common/Card";
import RiskBadge from "../components/common/RiskBadge";
import Button from "../components/common/Button";
import AlertBanner from "../components/common/AlertBanner";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";
import GroundwaterMap from "../components/map/GroundwaterMap";

export default function Dashboard() {
  const {
    nationalStats,
    filteredBlocks,
    filterRisk,
    setFilterRisk,
    filterState,
    setFilterState,
    searchQuery,
    setSearchQuery,
    selectBlock,
    loading,
  } = useGroundwater();

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  useEffect(() => {
    setCurrentPage(1);
  }, [filterRisk, filterState, searchQuery]);

  const totalPages = Math.ceil(filteredBlocks.length / pageSize) || 1;
  const paginatedBlocks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBlocks.slice(start, start + pageSize);
  }, [filteredBlocks, currentPage, pageSize]);

  if (loading && !nationalStats) {
    return (
      <PageContainer>
        <LoadingState
          message="Loading national groundwater telemetry & assessment units..."
          submessage="Synchronizing with Central Ground Water Board (CGWB) observation networks"
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="National Groundwater Intelligence Dashboard"
      subtitle="Real-time assessment of hydraulic head, extraction risk tiers, and irrigation stress across India's agro-climatic zones."
      showStateSelector={false} // State selector is accessible right in the top navigation bar
      actions={
        <div className="flex items-center gap-2">
          <Link to="/simulator">
            <Button variant="teal" size="sm" icon={Sliders}>
              Crop Simulator
            </Button>
          </Link>
          <Link to="/advisor">
            <Button variant="primary" size="sm" icon={Sparkles}>
              Ask Advisor
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Advisory Banner */}
        <AlertBanner
          type="warning"
          title="Monsoon 2026 Post-Assessment Advisory"
          message={`${nationalStats?.criticalPercentage || 6.9}% of monitored assessment units currently breach Critical extraction limits. Targeted micro-irrigation interventions and Kharif crop diversification are advised under Atal Bhujal Yojana.`}
          action={
            <Link to="/about">
              <span className="text-xs font-bold text-amber-900 underline hover:text-amber-950 flex items-center gap-1">
                Read Assessment Norms <ArrowRight size={13} />
              </span>
            </Link>
          }
        />

        {/* Primary KPI Grid - Large Numbers with Risk Labels */}
        {nationalStats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Total Monitored Assessment Units"
              value={nationalStats.totalMonitoredBlocks.toLocaleString()}
              unit="Blocks"
              subtitle={`Across ${nationalStats.totalStates || 35} States & UTs`}
              accentColor="blue"
              icon={Droplets}
            />

            <KpiCard
              title="Critical & Over-Exploited"
              value={nationalStats.criticalBlocks.toLocaleString()}
              unit={`(${nationalStats.criticalPercentage}%)`}
              subtitle="Stage of extraction exceeds 90%"
              accentColor="red"
              icon={AlertOctagon}
              badge={<RiskBadge level="Critical" size="sm" />}
              trend={{
                value: "+1.2%",
                direction: "up",
                label: "vs 2024",
                isGood: false,
              }}
            />

            <KpiCard
              title="Watch Category (Semi-Critical)"
              value={nationalStats.watchBlocks.toLocaleString()}
              unit={`(${nationalStats.watchPercentage}%)`}
              subtitle="Extraction between 70% and 90%"
              accentColor="amber"
              icon={AlertTriangle}
              badge={<RiskBadge level="Watch" size="sm" />}
              trend={{
                value: "-0.4%",
                direction: "down",
                label: "vs 2024",
                isGood: true,
              }}
            />

            <KpiCard
              title="Safe Category Units"
              value={nationalStats.safeBlocks.toLocaleString()}
              unit={`(${nationalStats.safePercentage}%)`}
              subtitle="Sustainable extraction < 70%"
              accentColor="teal"
              icon={ShieldCheck}
              badge={<RiskBadge level="Safe" size="sm" />}
              trend={{
                value: "Sustainable",
                direction: "neutral",
                label: "natural recharge",
                isGood: true,
              }}
            />
          </div>
        )}

        {/* Interactive Map Section */}
        <Card
          title="Geospatial Aquifer Risk Explorer"
          subtitle="Visualizing telemetry observation wells and groundwater vulnerability across India"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {/* Risk filter selector */}
              <div className="flex items-center rounded-md border border-slate-300 bg-white p-0.5 text-xs shadow-2xs">
                <span className="px-2 py-1 text-slate-500 font-medium">Risk:</span>
                {["All", "Critical", "Watch", "Safe"].map((risk) => (
                  <button
                    key={risk}
                    type="button"
                    onClick={() => setFilterRisk(risk)}
                    className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                      filterRisk === risk
                        ? "bg-[#0f2942] text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {risk}
                  </button>
                ))}
              </div>
            </div>
          }
        >
          <GroundwaterMap blocks={filteredBlocks} />
        </Card>

        {/* High-Risk Monitored Blocks Table */}
        <Card
          title="Monitored Blocks & Aquifer Vulnerability Registry"
          subtitle={
            filterState !== "All"
              ? `Showing blocks in ${filterState} (${filteredBlocks.length} matching)`
              : `Showing ${filteredBlocks.length} monitored blocks nationwide`
          }
          actions={
            <div className="relative w-64">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder="Search block, district or state..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0d9488]"
              />
            </div>
          }
        >
          {filteredBlocks.length === 0 ? (
            <EmptyState
              title="No blocks match filter criteria"
              description={`No monitored assessment units found for risk "${filterRisk}" in state "${filterState}". Try resetting the search or filter settings.`}
              onReset={() => {
                setFilterState("All");
                setFilterRisk("All");
                setSearchQuery("");
              }}
              resetLabel="Clear All Filters"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <th className="py-2.5 px-3 font-semibold">Block & District</th>
                    <th className="py-2.5 px-3 font-semibold">State</th>
                    <th className="py-2.5 px-3 font-semibold">Risk Classification</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Current Depth</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Extraction Stage</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Annual Trend</th>
                    <th className="py-2.5 px-3 font-semibold">Principal Aquifer</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedBlocks.map((block) => (
                    <tr
                      key={block.id}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#0f2942]">{block.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {block.district} &bull; ID: {block.id}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-700">
                        {block.state}
                      </td>
                      <td className="py-3 px-3">
                        <RiskBadge level={block.riskLevel} size="sm" />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="font-extrabold text-[#0f2942]">
                          {block.currentDepthMeters != null ? block.currentDepthMeters : "N/A"}
                        </span>
                        {block.currentDepthMeters != null && (
                          <span className="text-[11px] text-slate-500 ml-1">m bgl</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`font-bold ${
                            block.stageOfExtraction > 100
                              ? "text-red-700"
                              : block.stageOfExtraction >= 70
                              ? "text-amber-700"
                              : "text-emerald-700"
                          }`}
                        >
                          {block.stageOfExtraction != null ? `${block.stageOfExtraction}%` : "N/A"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`font-semibold ${
                            block.depthTrendMetersPerYear != null && block.depthTrendMetersPerYear < 0
                              ? "text-red-700"
                              : "text-emerald-700"
                          }`}
                        >
                          {block.depthTrendMetersPerYear != null
                            ? `${block.depthTrendMetersPerYear > 0 ? "+" : ""}${block.depthTrendMetersPerYear} m/yr`
                            : "N/A"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 text-[11px]">
                        {block.aquiferType || "Regional Aquifer"}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Link
                          to={`/block/${encodeURIComponent(block.id)}`}
                          onClick={() => selectBlock(block.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#0f2942] bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                        >
                          <span>Inspect</span>
                          <ArrowRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredBlocks.length > pageSize && (
                <div className="flex items-center justify-between px-3 py-3 border-t border-slate-200 bg-slate-50 text-xs">
                  <span className="text-slate-600 font-medium">
                    Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredBlocks.length)} of {filteredBlocks.length.toLocaleString()} blocks
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="px-2.5 py-1 rounded border border-slate-300 bg-white text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-slate-600 font-semibold px-1">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="px-2.5 py-1 rounded border border-slate-300 bg-white text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Quick Action Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 flex items-center justify-between gap-4 shadow-xs">
            <div>
              <h3 className="font-bold text-[#0f2942] text-sm mb-1">
                Test Crop Diversification Scenarios
              </h3>
              <p className="text-xs text-slate-600 max-w-md">
                Simulate shifting from water-intensive paddy to nutri-cereals and evaluate
                the projected rise in local water tables.
              </p>
            </div>
            <Link to="/simulator" className="shrink-0">
              <Button variant="teal" size="sm" icon={Sliders}>
                Open Simulator
              </Button>
            </Link>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 flex items-center justify-between gap-4 shadow-xs">
            <div>
              <h3 className="font-bold text-[#0f2942] text-sm mb-1">
                Ask AI Irrigation & Subsidies Advisor
              </h3>
              <p className="text-xs text-slate-600 max-w-md">
                Receive localized guidance on drip irrigation subsidies under PMKSY,
                recharge structures, and crop advisory.
              </p>
            </div>
            <Link to="/advisor" className="shrink-0">
              <Button variant="primary" size="sm" icon={Sparkles}>
                Consult Advisor
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
