import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Radio, BatteryCharging, Activity } from "lucide-react";

// Helper to center and adjust map view dynamically
function MapViewController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    if (center && Array.isArray(center) && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, zoom || 13, { animate: true });
    }

    return () => clearTimeout(timer);
  }, [center, zoom, map]);

  return null;
}

// Custom DivIcon for monitoring well pins
function createWellMarkerIcon(status) {
  const isOnline = status?.toLowerCase().includes("active") || status?.toLowerCase().includes("online");
  const color = isOnline ? "#0d9488" : "#d97706";
  const haloColor = isOnline ? "rgba(13, 148, 136, 0.25)" : "rgba(217, 119, 6, 0.25)";

  const html = `
    <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
      <div class="marker-pulse-ring" style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background-color: ${haloColor};"></div>
      <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${color}; border: 2px solid #ffffff; box-shadow: 0 2px 5px rgba(0,0,0,0.3); position: relative; z-index: 2;"></div>
    </div>
  `;

  return L.divIcon({
    className: "custom-leaflet-risk-marker",
    html,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

export default function MiniWellMap({
  center = [30.2458, 75.8421],
  wells = [],
  blockName = "",
  height = "320px",
}) {
  return (
    <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shadow-xs">
      <div className="px-3.5 py-2 bg-white border-b border-slate-200 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-bold text-[#0f2942]">
          <Radio size={14} className="text-[#0d9488]" aria-hidden="true" />
          <span>Monitoring Wells Telemetry Network</span>
        </div>
        <span className="text-slate-500 text-[11px]">
          {wells.length} stations active
        </span>
      </div>

      <div style={{ height, minHeight: "280px", width: "100%" }} className="relative z-0 min-h-[280px]">
        <MapContainer
          center={center}
          zoom={12}
          scrollWheelZoom={false}
          style={{ height: "100%", minHeight: "280px", width: "100%" }}
        >
          <MapViewController center={center} zoom={12} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          {wells.map((well) => (
            <Marker
              key={well.id}
              position={well.coordinates}
              icon={createWellMarkerIcon(well.status)}
            >
              <Popup>
                <div className="p-3 text-xs min-w-[210px] space-y-2">
                  <div className="border-b border-slate-100 pb-1.5">
                    <span className="font-mono text-[10px] text-slate-500 font-semibold block">
                      {well.id}
                    </span>
                    <h5 className="font-bold text-[#0f2942] leading-tight mt-0.5">
                      {well.name}
                    </h5>
                  </div>

                  <div className="space-y-1 text-slate-600">
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="font-semibold text-slate-800">{well.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Depth:</span>
                      <span className="font-bold text-[#0f2942]">
                        {well.depthMeters} m bgl
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                      <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                        <Activity size={12} /> {well.status}
                      </span>
                      {well.battery && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {well.battery}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Click well marker for telemetry feed details</span>
        <span>CGWB Telemetry Grid</span>
      </div>
    </div>
  );
}
