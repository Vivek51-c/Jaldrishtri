import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Activity,
  TrendingDown,
  Radio,
  Calendar,
  Sliders,
  Sparkles,
  ArrowRight,
  ChevronRight,
  ShieldAlert,
  Droplets,
  Layers,
  HelpCircle,
  Wheat,
} from "lucide-react";
import { useGroundwater } from "../context/GroundwaterContext";
import {
  apiClient,
  getBlockHistory,
  getBlockForecast,
  getBlockRisk,
  getBlockWells,
  getBlockCrops,
  getBlockCanals,
  getAdvisor,
} from "../api/apiClient";
import { BLOCKS_DATA } from "../data/mockData";
import PageContainer from "../components/layout/PageContainer";
import Card from "../components/common/Card";
import KpiCard from "../components/common/KpiCard";
import RiskBadge from "../components/common/RiskBadge";
import Button from "../components/common/Button";
import LoadingState from "../components/common/LoadingState";
import BlockForecastChart from "../components/charts/BlockForecastChart";
import RiskDriversCard from "../components/common/RiskDriversCard";
import MiniWellMap from "../components/map/MiniWellMap";
import CropWaterUsageChart from "../components/charts/CropWaterUsageChart";

export default function BlockDetail() {
  const { blockId } = useParams();
  const navigate = useNavigate();
  const { blocks, selectBlock } = useGroundwater();
  const [block, setBlock] = useState(null);
  const [loading, setLoading] = useState(true);

  // Quick simulation teaser parameters for this block
  const [simAcreageShift, setSimAcreageShift] = useState(25);

  useEffect(() => {
    let isMounted = true;
    async function fetchBlock() {
      setLoading(true);
      try {
        const data = await apiClient.getBlockDetail(blockId, blocks);
        if (isMounted) {
          setBlock(data);
          selectBlock(data.id);
        }
      } catch (err) {
        console.error("Failed to load block from backend:", err);
        if (isMounted) {
          const fallback = BLOCKS_DATA.find((b) => b.id === blockId) || BLOCKS_DATA[0];
          setBlock(fallback);
          selectBlock(fallback.id);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (blockId) {
      fetchBlock();
    }
  }, [blockId, blocks]);

  if (loading || !block) {
    return (
      <PageContainer>
        <LoadingState
          message="Loading block hydrogeological telemetry..."
          submessage="Retrieving piezometer telemetry, risk drivers, and predictive models"
        />
      </PageContainer>
    );
  }

  // Calculate compact simulator estimate: 25% shift saves ~5.4 MCM in an over-exploited block
  const estimatedWaterSavedMcm = Number((block.currentDepthMeters * 0.12 * (simAcreageShift / 25)).toFixed(2));
  const estimatedDepthRecoveryM = Number((estimatedWaterSavedMcm * 0.14).toFixed(2));

  const breadcrumbs = (
    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
      <Link to="/" className="hover:text-[#0f2942] transition-colors">
        Dashboard
      </Link>
      <ChevronRight size={12} className="text-slate-400" />
      <span>{block.state}</span>
      <ChevronRight size={12} className="text-slate-400" />
      <span className="font-semibold text-[#0f2942]">{block.name}</span>
    </div>
  );

  return (
    <PageContainer breadcrumbs={breadcrumbs}>
      {/* 1. Header Section */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f2942] tracking-tight">
              {block.name}
            </h1>
            <RiskBadge level={block.riskLevel} size="md" />
            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono font-medium border border-slate-200">
              ID: {block.id}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-600 mt-1">
            {block.district}, {block.state}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Principal Aquifer: <strong className="text-slate-700">{block.aquiferType}</strong> &bull; Soil: <strong className="text-slate-700">{block.soilType}</strong>
          </p>
        </div>

        {/* Quick Block Switcher */}
        <div className="flex items-center gap-2 self-start md:self-center">
          <label className="text-xs text-slate-500 font-semibold hidden sm:inline">
            Switch Block:
          </label>
          <select
            aria-label="Switch block selector"
            value={block.id}
            onChange={(e) => navigate(`/block/${e.target.value}`)}
            className="text-xs font-semibold py-1.5 px-3 bg-white border border-slate-300 rounded-md text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-[#0f2942] cursor-pointer shadow-2xs"
          >
            {blocks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.district}, {b.state}) &bull; {b.riskLevel}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Statistics Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current groundwater depth */}
        <KpiCard
          title="Current Groundwater Depth"
          value={block.currentDepthMeters}
          unit="m bgl"
          subtitle="Piezometer telemetry reading"
          accentColor={block.riskLevel === "Critical" ? "red" : block.riskLevel === "Watch" ? "amber" : "teal"}
          icon={Activity}
          badge={<RiskBadge level={block.riskLevel} size="sm" />}
        />

        {/* Yearly decline */}
        <KpiCard
          title="Yearly Decline"
          value={`${block.depthTrendMetersPerYear > 0 ? "+" : ""}${block.depthTrendMetersPerYear}`}
          unit="m / year"
          subtitle="5-Year linear decline rate"
          accentColor={block.depthTrendMetersPerYear < 0 ? "red" : "teal"}
          trend={{
            value: `${Math.abs(block.depthTrendMetersPerYear)} m/yr`,
            direction: block.depthTrendMetersPerYear < 0 ? "down" : "up",
            label: block.depthTrendMetersPerYear < 0 ? "sinking" : "recharge",
            isGood: block.depthTrendMetersPerYear >= 0,
          }}
          icon={TrendingDown}
        />

        {/* Number of monitoring wells */}
        <KpiCard
          title="Number of Monitoring Wells"
          value={block.monitoringWellsCount || 24}
          unit="Wells"
          subtitle="Real-time DWLR network stations"
          accentColor="blue"
          icon={Radio}
          badge={
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Active Grid
            </span>
          }
        />

        {/* Latest reading date */}
        <KpiCard
          title="Latest Reading Date"
          value={block.latestReadingDate || "02 Oct 2026"}
          unit=""
          subtitle="Automatic telemetry telemetry sync"
          accentColor="teal"
          icon={Calendar}
          badge={
            <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              Verified Feed
            </span>
          }
        />
      </div>

      {/* 3. Forecast Section & Crop Water Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 cols: Forecast Section with Recharts line chart */}
        <div className="lg:col-span-8 space-y-6">
          <Card
            title="Groundwater Forecast & Trajectory Model"
            subtitle="Historical observed hydraulic head (solid line) with 12-month AI projection (dashed estimate) and shaded confidence band"
            icon={Activity}
          >
            <BlockForecastChart
              historicalData={block.historicalDepth}
              forecastData={block.forecast12Months}
              criticalThreshold={block.riskLevel === "Critical" ? 35 : 25}
            />
          </Card>

          {/* 4. Risk Drivers Card */}
          <RiskDriversCard
            drivers={block.riskDrivers}
            blockName={block.name}
          />
        </div>

        {/* Right 4 cols: Mini Well Map & Cropping Demand */}
        <div className="lg:col-span-4 space-y-6">
          {/* 5. Mini Well Map */}
          <Card
            title="Monitoring Wells Network"
            subtitle={`Geospatial locations of telemetry wells in ${block.name}`}
            icon={Radio}
          >
            <MiniWellMap
              center={block.coordinates}
              wells={block.monitoringWells || []}
              blockName={block.name}
              height="300px"
            />
          </Card>

          {/* Cropping Pattern and Water Footprint */}
          <Card
            title="Crop Water Demand Pattern"
            subtitle={`Irrigation consumption of dominant crops in ${block.district}`}
            icon={Wheat}
          >
            <CropWaterUsageChart crops={block.primaryCrops} />

            <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
              <p className="font-bold text-slate-800">
                Acreage Breakdown:
              </p>
              {block.primaryCrops.map((c, i) => (
                <div key={i} className="flex justify-between py-0.5 text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        c.waterIntensive ? "bg-red-500" : "bg-emerald-500"
                      }`}
                    />
                    {c.name}
                  </span>
                  <span className="font-bold text-slate-900">{c.areaPercent}% acreage</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* 6. Compact Simulator & 7. Compact Advisor Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 6. Compact Simulator Section */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-teal-50 text-[#0d9488] rounded border border-teal-200">
                  <Sliders size={18} />
                </div>
                <h3 className="font-bold text-base text-[#0f2942]">
                  Irrigation & Crop Simulator
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Model what happens when shifting {block.name}'s paddy acreage to nutri-millets or adopting micro-irrigation.
              </p>
            </div>
            <Link to={`/simulator?blockId=${block.id}`}>
              <Button variant="teal" size="sm" icon={Sliders}>
                Open Simulator
              </Button>
            </Link>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 font-medium">Quick Acreage Shift:</span>
              <span className="font-bold text-[#0f2942]">{simAcreageShift}% Paddy to Millets</span>
            </div>
            <input
              type="range"
              min="10"
              max="50"
              step="5"
              value={simAcreageShift}
              onChange={(e) => setSimAcreageShift(Number(e.target.value))}
              className="w-full accent-[#0d9488] cursor-pointer"
            />
            <div className="grid grid-cols-2 gap-2 pt-1 text-slate-700">
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Projected Water Saved:</span>
                <span className="font-extrabold text-[#0d9488] text-sm">~{estimatedWaterSavedMcm} MCM</span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Water Table Recovery:</span>
                <span className="font-extrabold text-[#0f2942] text-sm">+{estimatedDepthRecoveryM} m</span>
              </div>
            </div>
          </div>
        </div>

        {/* 7. Compact Advisor Section */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-[#0f2942] rounded border border-blue-200">
                  <Sparkles size={18} />
                </div>
                <h3 className="font-bold text-base text-[#0f2942]">
                  AI Agro-Hydrological Advisor
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Receive site-specific conservation advisories and government subsidy schemes for {block.name}.
              </p>
            </div>
            <Link to={`/advisor?blockId=${block.id}`}>
              <Button variant="primary" size="sm" icon={Sparkles}>
                Ask JalDrishti
              </Button>
            </Link>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md space-y-2 text-xs">
            <span className="font-bold text-slate-800 block text-xs">
              Top Recommendation for {block.name}:
            </span>
            <p className="text-slate-700 leading-relaxed bg-white p-2.5 rounded border border-slate-200">
              {block.recommendations?.[0] || "Incentivize 25% acreage shift to Direct Seeded Rice (DSR) and expand PMKSY micro-irrigation."}
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>PMKSY Drip Subsidy: Up to 55%</span>
              <Link to={`/advisor?blockId=${block.id}`} className="font-semibold text-[#0d9488] hover:underline flex items-center gap-1">
                <span>View Full Advisory</span>
                <ArrowRight size={11} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
