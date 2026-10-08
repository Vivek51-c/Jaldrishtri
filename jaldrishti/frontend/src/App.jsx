import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GroundwaterProvider } from "./context/GroundwaterContext";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import BlockDetail from "./pages/BlockDetail";
import Simulator from "./pages/Simulator";
import AdvisorChat from "./pages/AdvisorChat";
import CompareStates from "./pages/CompareStates";
import About from "./pages/About";

export default function App() {
  return (
    <GroundwaterProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="block/:blockId" element={<BlockDetail />} />
            <Route path="simulator" element={<Simulator />} />
            <Route path="advisor" element={<AdvisorChat />} />
            <Route path="compare" element={<CompareStates />} />
            <Route path="about" element={<About />} />
            {/* Catch-all redirect to Dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </GroundwaterProvider>
  );
}
