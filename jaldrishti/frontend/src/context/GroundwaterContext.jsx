import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { apiClient, getNationalSummary, getStates, getBlocks as getApiBlocks } from "../api/apiClient";
import { BLOCKS_DATA, NATIONAL_STATS } from "../data/mockData";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", nativeName: "English" },
  { code: "hi", label: "Hindi", nativeName: "हिंदी" },
  { code: "pa", label: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
];

const GroundwaterContext = createContext(null);

export function GroundwaterProvider({ children }) {
  const [nationalStats, setNationalStats] = useState(null);
  const [blocks, setBlocks] = useState(BLOCKS_DATA);
  const [availableStates, setAvailableStates] = useState([]);
  const [selectedBlockId, setSelectedBlockId] = useState("PB-SNG-01");
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [loading, setLoading] = useState(true);

  // Global language state (UI structure ready for future translations)
  const [language, setLanguage] = useState("en");

  // Global filters for explore / map
  const [filterState, setFilterState] = useState("All");
  const [filterRisk, setFilterRisk] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Initialize base data from real backend endpoints with fallback
  useEffect(() => {
    let isMounted = true;
    async function loadInitialData() {
      try {
        setLoading(true);

        // Fetch national summary, states list, and real map blocks in parallel
        const [summaryResult, statesResult, mapResult] = await Promise.allSettled([
          apiClient.getNationalOverview(),
          getStates(),
          apiClient.getMapBlocks(),
        ]);

        if (isMounted) {
          if (summaryResult.status === "fulfilled" && summaryResult.value) {
            setNationalStats(summaryResult.value);
          } else {
            setNationalStats(NATIONAL_STATS);
          }

          if (statesResult.status === "fulfilled" && Array.isArray(statesResult.value) && statesResult.value.length > 0) {
            setAvailableStates(statesResult.value);
          }

          let initialBlocks = [];
          if (mapResult.status === "fulfilled" && Array.isArray(mapResult.value) && mapResult.value.length > 0) {
            initialBlocks = mapResult.value;
          } else {
            try {
              initialBlocks = await apiClient.getEnrichedBlocks(BLOCKS_DATA);
            } catch (e) {
              console.warn("Could not enrich blocks from backend:", e);
              initialBlocks = BLOCKS_DATA;
            }
          }
          setBlocks(initialBlocks);
          const initialBlock = initialBlocks.find((b) => b.id === selectedBlockId) || initialBlocks[0];
          setSelectedBlock(initialBlock);
        }
      } catch (err) {
        console.error("Failed to load groundwater data from backend:", err);
        if (isMounted) {
          setNationalStats(NATIONAL_STATS);
          setBlocks(BLOCKS_DATA);
          setSelectedBlock(BLOCKS_DATA[0]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Update selected block when selectedBlockId changes
  useEffect(() => {
    if (!blocks.length) return;
    const found = blocks.find((b) => b.id === selectedBlockId);
    if (found) {
      setSelectedBlock(found);
    }
  }, [selectedBlockId, blocks]);

  const selectBlock = (id) => {
    setSelectedBlockId(id);
  };

  // List of unique states: combination of backend registry states and monitored blocks
  const statesList = useMemo(() => {
    const list = availableStates.length > 0
      ? availableStates
      : Array.from(new Set(blocks.map((b) => b.state))).sort();
    return ["All", ...list];
  }, [availableStates, blocks]);

  const filteredBlocks = useMemo(() => {
    return blocks.filter((b) => {
      if (filterState !== "All" && b.state && b.state.toLowerCase() !== filterState.toLowerCase()) {
        return false;
      }
      if (filterRisk !== "All") {
        const rk = (b.riskLevel || "").toLowerCase();
        if (rk !== filterRisk.toLowerCase()) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          (b.name && b.name.toLowerCase().includes(q)) ||
          (b.district && b.district.toLowerCase().includes(q)) ||
          (b.state && b.state.toLowerCase().includes(q)) ||
          (b.id && b.id.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [blocks, filterState, filterRisk, searchQuery]);

  const currentLanguageObj = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];
  }, [language]);

  const value = {
    nationalStats,
    blocks,
    filteredBlocks,
    statesList,
    selectedBlockId,
    selectedBlock,
    selectBlock,
    filterState,
    setFilterState,
    filterRisk,
    setFilterRisk,
    searchQuery,
    setSearchQuery,
    loading,
    language,
    setLanguage,
    currentLanguageObj,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };

  return (
    <GroundwaterContext.Provider value={value}>
      {children}
    </GroundwaterContext.Provider>
  );
}

export function useGroundwater() {
  const context = useContext(GroundwaterContext);
  if (!context) {
    throw new Error("useGroundwater must be used within a GroundwaterProvider");
  }
  return context;
}
