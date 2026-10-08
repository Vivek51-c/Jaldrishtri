import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "react-router-dom";
import { ArrowRight, Layers, Globe, LocateFixed, Eye } from "lucide-react";
import RiskBadge from "../common/RiskBadge";
import { useGroundwater } from "../../context/GroundwaterContext";

// Centroids for major states in India
const STATE_CENTROIDS = {
  "Punjab": { center: [30.9009, 75.8573], zoom: 7.5 },
  "Rajasthan": { center: [26.9124, 73.7879], zoom: 6.5 },
  "Haryana": { center: [29.0588, 76.0856], zoom: 7.5 },
  "Maharashtra": { center: [19.7515, 75.7139], zoom: 6.5 },
  "Karnataka": { center: [14.5204, 75.7224], zoom: 6.5 },
  "Gujarat": { center: [22.2587, 71.1924], zoom: 6.5 },
  "Tamil Nadu": { center: [11.1271, 78.6569], zoom: 7 },
  "Uttar Pradesh": { center: [26.8467, 80.9462], zoom: 6.5 },
  "Madhya Pradesh": { center: [22.9734, 78.6569], zoom: 6.5 },
  "Andhra Pradesh": { center: [15.9129, 79.7400], zoom: 6.5 },
};

// Initial coordinates: World View vs India Focus
const WORLD_CENTER = [20.0, 20.0];
const WORLD_ZOOM = 2.5;
const INDIA_CENTER = [22.8, 79.6];
const INDIA_ZOOM = 5;

// India geographical bounding limits to ensure zero out-of-bounds rendering
const INDIA_BOUNDS = {
  minLat: 6.5,
  maxLat: 38.0,
  minLng: 68.0,
  maxLng: 98.0,
};

/**
 * Controller to handle smooth flyTo, auto-focus, and camera management
 */
function MapCameraManager({ filterState, selectedBlock, onZoomChange }) {
  const map = useMap();
  const hasAutoFocusedRef = useRef(false);

  // Inform parent of current zoom level
  useMapEvents({
    zoomend: () => onZoomChange(map.getZoom()),
  });

  // 1. Initial auto-focus toward India from world view on first mount
  useEffect(() => {
    if (hasAutoFocusedRef.current) return;

    // Invalidate map size so tiles render cleanly
    map.invalidateSize();

    const timer = setTimeout(() => {
      if (!hasAutoFocusedRef.current) {
        hasAutoFocusedRef.current = true;
        if (selectedBlock?.coordinates) {
          map.flyTo(selectedBlock.coordinates, 9, { duration: 1.8 });
        } else if (filterState && filterState !== "All" && STATE_CENTROIDS[filterState]) {
          const cfg = STATE_CENTROIDS[filterState];
          map.flyTo(cfg.center, cfg.zoom, { duration: 1.8 });
        } else {
          map.flyTo(INDIA_CENTER, INDIA_ZOOM, { duration: 1.8, easeLinearity: 0.25 });
        }
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [map, filterState, selectedBlock]);

  // 2. React to State or Block selection changes after initial mount
  useEffect(() => {
    if (!hasAutoFocusedRef.current) return;

    if (selectedBlock?.coordinates) {
      map.flyTo(selectedBlock.coordinates, 9, { duration: 1.2 });
    } else if (filterState && filterState !== "All" && STATE_CENTROIDS[filterState]) {
      const cfg = STATE_CENTROIDS[filterState];
      map.flyTo(cfg.center, cfg.zoom, { duration: 1.2 });
    } else if (filterState === "All") {
      map.flyTo(INDIA_CENTER, INDIA_ZOOM, { duration: 1.2 });
    }
  }, [filterState, selectedBlock, map]);

  return null;
}

/**
 * Generate custom SVG Leaflet DivIcon for single block marker
 */
function createSingleMarkerIcon(riskLevel) {
  const normalized = (riskLevel || "Safe").toLowerCase();
  let color = "#16a34a"; // Safe (Green)
  let halo = "rgba(22, 163, 74, 0.25)";

  if (normalized.includes("watch") || normalized.includes("semi")) {
    color = "#d97706"; // Watch (Amber)
    halo = "rgba(217, 119, 6, 0.25)";
  } else if (normalized.includes("critical") || normalized.includes("over")) {
    color = "#dc2626"; // Critical (Red)
    halo = "rgba(220, 38, 38, 0.35)";
  } else if (normalized.includes("unknown")) {
    color = "#64748b"; // Unclassified
    halo = "rgba(100, 116, 139, 0.25)";
  }

  const html = `
    <div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
      <div style="position: absolute; width: 22px; height: 22px; border-radius: 50%; background-color: ${halo}; pointer-events: none;"></div>
      <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${color}; border: 2px solid #ffffff; box-shadow: 0 1px 4px rgba(0,0,0,0.4); position: relative; z-index: 2;"></div>
    </div>
  `;

  return L.divIcon({
    className: "jaldrishti-single-marker",
    html,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11],
  });
}

/**
 * Generate rich, high-visibility cluster pill DivIcon
 */
function createClusterIcon(cluster) {
  const { count, criticalCount, watchCount } = cluster;

  // Visual risk theme of the cluster
  let borderColor = "#16a34a"; // Green
  let bgColor = "#f0fdf4";
  let textColor = "#15803d";
  let badgeColor = "#16a34a";

  if (criticalCount > 0) {
    borderColor = "#dc2626"; // Red (Critical present)
    bgColor = "#fef2f2";
    textColor = "#b91c1c";
    badgeColor = "#dc2626";
  } else if (watchCount > 0) {
    borderColor = "#d97706"; // Amber (Watch present)
    bgColor = "#fffbeb";
    textColor = "#b45309";
    badgeColor = "#d97706";
  }

  // Sizing by count
  const size = count > 200 ? 46 : count > 50 ? 40 : 34;

  const html = `
    <div class="jaldrishti-cluster-pill" style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${bgColor};
      border: 2.5px solid ${borderColor};
      color: ${textColor};
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: ${size > 40 ? 12 : 11}px;
      font-family: 'Inter', system-ui, sans-serif;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
      cursor: pointer;
    ">
      <span>${count}</span>
      <div style="display: flex; gap: 2px; margin-top: 1px;">
        ${criticalCount > 0 ? '<span style="width: 4px; height: 4px; border-radius: 50%; background: #dc2626;"></span>' : ""}
        ${watchCount > 0 ? '<span style="width: 4px; height: 4px; border-radius: 50%; background: #d97706;"></span>' : ""}
        <span style="width: 4px; height: 4px; border-radius: 50%; background: ${badgeColor};"></span>
      </div>
    </div>
  `;

  return L.divIcon({
    className: "jaldrishti-cluster-icon",
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/**
 * World view highlight badge over India
 */
function createIndiaFocusIcon() {
  const html = `
    <div class="jaldrishti-india-focus-marker" style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 140px; text-align: center; pointer-events: none;">
      <div class="india-focus-glow" style="width: 68px; height: 68px; border-radius: 50%; border: 2.5px dashed #0d9488; background: rgba(13, 148, 136, 0.15);"></div>
      <div style="
        margin-top: -30px;
        background: #0f2942;
        color: #ffffff;
        font-size: 10px;
        font-weight: 700;
        padding: 3px 8px;
        border-radius: 9999px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        white-space: nowrap;
        border: 1px solid rgba(255,255,255,0.25);
        z-index: 10;
      ">
        🇮🇳 India Monitoring Grid
      </div>
    </div>
  `;

  return L.divIcon({
    className: "jaldrishti-india-focus-icon",
    html,
    iconSize: [140, 80],
    iconAnchor: [70, 40],
  });
}

/**
 * High-performance spatial clustering layer
 * Dynamically partitions points into pixel grid bins based on zoom
 */
function SpatialClusteringLayer({
  blocks,
  onBlockSelect,
  activePopupBlock,
  setActivePopupBlock,
  currentZoom,
}) {
  const map = useMap();
  const [clustersData, setClustersData] = useState({ clusters: [], singles: [] });

  // Re-cluster whenever map moves, zooms, or input blocks change
  const recomputeClusters = useCallback(() => {
    if (!blocks || blocks.length === 0) {
      setClustersData({ clusters: [], singles: [] });
      return;
    }

    const zoom = map.getZoom();
    const bounds = map.getBounds().pad(0.15); // Include a slight viewport buffer

    // Dynamic grid size in pixels based on zoom level
    let gridSize = 65;
    if (zoom <= 4) gridSize = 75;
    else if (zoom <= 6) gridSize = 60;
    else if (zoom <= 8) gridSize = 50;
    else if (zoom <= 10) gridSize = 40;
    else if (zoom <= 12) gridSize = 28;
    else gridSize = 14;

    const grid = new Map();

    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      const lat = b.coordinates[0];
      const lng = b.coordinates[1];

      // Viewport culling for speed
      if (
        lat < bounds.getSouth() ||
        lat > bounds.getNorth() ||
        lng < bounds.getWest() ||
        lng > bounds.getEast()
      ) {
        continue;
      }

      // Convert LatLng to world pixel coordinates at current zoom
      const pt = map.project(L.latLng(lat, lng), zoom);
      const cellKey = `${Math.floor(pt.x / gridSize)}_${Math.floor(pt.y / gridSize)}`;

      let cell = grid.get(cellKey);
      if (!cell) {
        cell = [];
        grid.set(cellKey, cell);
      }
      cell.push(b);
    }

    const clusters = [];
    const singles = [];

    grid.forEach((items, key) => {
      if (items.length === 1 || zoom >= 13) {
        // High zoom or isolated point: render as individual marker
        for (const item of items) {
          singles.push(item);
        }
      } else {
        // Compute cluster center & bounding box
        let sumLat = 0;
        let sumLng = 0;
        let minLat = 90;
        let maxLat = -90;
        let minLng = 180;
        let maxLng = -180;
        let criticalCount = 0;
        let watchCount = 0;
        let safeCount = 0;

        for (let j = 0; j < items.length; j++) {
          const item = items[j];
          const [lat, lng] = item.coordinates;
          sumLat += lat;
          sumLng += lng;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;

          const r = (item.riskLevel || "").toLowerCase();
          if (r.includes("crit") || r.includes("over")) criticalCount++;
          else if (r.includes("watch") || r.includes("semi")) watchCount++;
          else safeCount++;
        }

        const count = items.length;
        const center = [sumLat / count, sumLng / count];
        const isPointSpread = maxLat - minLat > 0.001 || maxLng - minLng > 0.001;

        clusters.push({
          id: `cluster-${key}-${count}`,
          center,
          count,
          criticalCount,
          watchCount,
          safeCount,
          bounds: L.latLngBounds([minLat, minLng], [maxLat, maxLng]),
          isPointSpread,
          items,
        });
      }
    });

    setClustersData({ clusters, singles });
  }, [blocks, map]);

  // Listen to map move & zoom events
  useMapEvents({
    moveend: recomputeClusters,
    zoomend: recomputeClusters,
  });

  // Re-run clustering when blocks array changes
  useEffect(() => {
    recomputeClusters();
  }, [recomputeClusters]);

  // Click cluster: zoom into its bounding box
  const handleClusterClick = (cluster) => {
    if (cluster.isPointSpread) {
      map.fitBounds(cluster.bounds.pad(0.2), {
        maxZoom: Math.min(map.getZoom() + 3, 14),
        animate: true,
      });
    } else {
      // Points share identical coordinate: zoom in or open first item
      map.setView(cluster.center, Math.min(map.getZoom() + 2, 15), { animate: true });
      setActivePopupBlock(cluster.items[0]);
    }
  };

  return (
    <>
      {/* 1. Clusters */}
      {clustersData.clusters.map((cluster) => (
        <Marker
          key={cluster.id}
          position={cluster.center}
          icon={createClusterIcon(cluster)}
          eventHandlers={{
            click: () => handleClusterClick(cluster),
          }}
        />
      ))}

      {/* 2. Single Markers */}
      {clustersData.singles.map((block) => (
        <Marker
          key={block.id}
          position={block.coordinates}
          icon={createSingleMarkerIcon(block.riskLevel)}
          eventHandlers={{
            click: () => {
              setActivePopupBlock(block);
              if (onBlockSelect) onBlockSelect(block);
            },
          }}
        />
      ))}

      {/* 3. Lazy-loaded active popup (Only mounted when clicked) */}
      {activePopupBlock && (
        <Popup
          position={activePopupBlock.coordinates}
          eventHandlers={{
            remove: () => setActivePopupBlock(null),
          }}
        >
          <div className="p-3 max-w-[250px]">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h4 className="font-bold text-slate-900 text-sm leading-tight">
                  {activePopupBlock.name || activePopupBlock.block}
                </h4>
                <p className="text-xs text-slate-500">
                  {activePopupBlock.district}, {activePopupBlock.state}
                </p>
              </div>
              <RiskBadge level={activePopupBlock.riskLevel} size="sm" />
            </div>

            <div className="space-y-1.5 py-2 border-y border-slate-100 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Current Depth:</span>
                <span className="font-bold text-[#0f2942]">
                  {activePopupBlock.currentDepthMeters != null
                    ? `${activePopupBlock.currentDepthMeters} m bgl`
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Extraction Stage:</span>
                <span className="font-bold text-slate-800">
                  {activePopupBlock.stageOfExtraction != null
                    ? `${activePopupBlock.stageOfExtraction}%`
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Annual Trend:</span>
                <span
                  className={`font-semibold ${
                    activePopupBlock.depthTrendMetersPerYear != null &&
                    activePopupBlock.depthTrendMetersPerYear < 0
                      ? "text-red-700"
                      : "text-emerald-700"
                  }`}
                >
                  {activePopupBlock.depthTrendMetersPerYear != null
                    ? `${activePopupBlock.depthTrendMetersPerYear > 0 ? "+" : ""}${activePopupBlock.depthTrendMetersPerYear} m/yr`
                    : "N/A"}
                </span>
              </div>
            </div>

            <div className="mt-3">
              <Link
                to={`/block/${activePopupBlock.id}`}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#0f2942] hover:bg-[#0c2035] text-white text-xs font-semibold rounded transition-colors"
              >
                <span>View Block Details</span>
                <ArrowRight size={13} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </Popup>
      )}
    </>
  );
}

/**
 * Main Professional GroundwaterMap Component
 */
export default function GroundwaterMap({
  blocks = [],
  selectedBlock = null,
  onBlockSelect = null,
  height = "480px",
}) {
  const { filterState, filterRisk, selectBlock } = useGroundwater();
  const [currentZoom, setCurrentZoom] = useState(WORLD_ZOOM);
  const [activePopupBlock, setActivePopupBlock] = useState(null);
  const mapRef = useRef(null);

  // Filter blocks strictly belonging to India boundaries
  const validIndiaBlocks = useMemo(() => {
    return blocks.filter((b) => {
      if (!b.coordinates || !Array.isArray(b.coordinates)) return false;
      const [lat, lng] = b.coordinates;
      return (
        typeof lat === "number" &&
        typeof lng === "number" &&
        !isNaN(lat) &&
        !isNaN(lng) &&
        lat >= INDIA_BOUNDS.minLat &&
        lat <= INDIA_BOUNDS.maxLat &&
        lng >= INDIA_BOUNDS.minLng &&
        lng <= INDIA_BOUNDS.maxLng
      );
    });
  }, [blocks]);

  // Risk statistics for the top banner counters
  const riskCounts = useMemo(() => {
    let safe = 0;
    let watch = 0;
    let critical = 0;
    for (let i = 0; i < validIndiaBlocks.length; i++) {
      const r = (validIndiaBlocks[i].riskLevel || "").toLowerCase();
      if (r.includes("crit") || r.includes("over")) critical++;
      else if (r.includes("watch") || r.includes("semi")) watch++;
      else safe++;
    }
    return { safe, watch, critical, total: validIndiaBlocks.length };
  }, [validIndiaBlocks]);

  const handleSelect = (b) => {
    if (onBlockSelect) onBlockSelect(b);
    if (selectBlock) selectBlock(b.id);
  };

  // Quick navigation handlers
  const handleFocusIndia = () => {
    if (mapRef.current) {
      mapRef.current.flyTo(INDIA_CENTER, INDIA_ZOOM, { duration: 1.2 });
    }
  };

  const handleFocusWorld = () => {
    if (mapRef.current) {
      mapRef.current.flyTo(WORLD_CENTER, WORLD_ZOOM, { duration: 1.4 });
    }
  };

  return (
    <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shadow-xs">
      {/* Top Map Status Banner */}
      <div className="px-3.5 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2 font-semibold text-[#0f2942]">
          <Layers size={14} className="text-[#0d9488]" aria-hidden="true" />
          <span>Interactive National Aquifer Map</span>
          <span className="text-slate-300 font-normal">|</span>
          <span className="text-slate-600 font-normal">
            {filterState !== "All"
              ? `Focused on ${filterState} (${riskCounts.total.toLocaleString()} units)`
              : `Showing ${riskCounts.total.toLocaleString()} monitored units in India`}
          </span>
        </div>

        {/* Risk Legend & Quick View Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Legend Items */}
          <div className="flex items-center gap-3 text-[11px] font-semibold">
            <div className="flex items-center gap-1.5" title={`${riskCounts.safe} Safe units`}>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" aria-hidden="true"></span>
              <span className="text-slate-700">Safe: {riskCounts.safe}</span>
            </div>
            <div className="flex items-center gap-1.5" title={`${riskCounts.watch} Watch units`}>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block" aria-hidden="true"></span>
              <span className="text-slate-700">Watch: {riskCounts.watch}</span>
            </div>
            <div className="flex items-center gap-1.5" title={`${riskCounts.critical} Critical units`}>
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" aria-hidden="true"></span>
              <span className="text-slate-700">Critical: {riskCounts.critical}</span>
            </div>
          </div>

          {/* View Presets */}
          <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
            <button
              type="button"
              onClick={handleFocusIndia}
              className="px-2 py-0.5 rounded text-[11px] font-semibold text-[#0d9488] hover:bg-teal-50 border border-teal-200 transition-colors flex items-center gap-1 cursor-pointer"
              title="Focus view on India"
            >
              <LocateFixed size={11} />
              <span>India</span>
            </button>
            <button
              type="button"
              onClick={handleFocusWorld}
              className="px-2 py-0.5 rounded text-[11px] font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
              title="View World Context"
            >
              <Globe size={11} />
              <span>World</span>
            </button>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div
        style={{ height, minHeight: "460px", width: "100%" }}
        className="relative z-0 min-h-[460px] w-full"
      >
        <MapContainer
          center={WORLD_CENTER}
          zoom={WORLD_ZOOM}
          minZoom={2}
          maxZoom={18}
          scrollWheelZoom={false}
          style={{ height: "100%", minHeight: "460px", width: "100%" }}
          ref={mapRef}
        >
          {/* Camera & auto-focus manager */}
          <MapCameraManager
            filterState={filterState}
            selectedBlock={selectedBlock}
            onZoomChange={setCurrentZoom}
          />

          {/* 100% Free OpenStreetMap Standard Tile Layer (Zero API key required) */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
            subdomains={["a", "b", "c"]}
          />

          {/* Visual highlight over India when viewed from World zoom (zoom <= 4) */}
          {currentZoom <= 4 && (
            <Marker position={INDIA_CENTER} icon={createIndiaFocusIcon()} />
          )}

          {/* High-Performance Clustering Layer for all 6,224 monitoring points */}
          <SpatialClusteringLayer
            blocks={validIndiaBlocks}
            onBlockSelect={handleSelect}
            activePopupBlock={activePopupBlock}
            setActivePopupBlock={setActivePopupBlock}
            currentZoom={currentZoom}
          />
        </MapContainer>
      </div>

      {/* Bottom status bar */}
      <div className="px-3.5 py-1.5 bg-slate-50 border-t border-slate-200 text-slate-500 text-[11px] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Eye size={12} className="text-[#0d9488]" />
          <span>Click any cluster badge to zoom in &bull; Click individual marker for block analysis</span>
        </div>
        <div className="font-mono text-[10px] text-slate-400">
          Source: Central Ground Water Board (CGWB) &bull; OpenStreetMap Tiles
        </div>
      </div>
    </div>
  );
}
