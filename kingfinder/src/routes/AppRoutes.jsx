import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import { Explore } from "../pages/Explore";
import Photographer from "../pages/Photographer";
import ReportSighting from "../pages/ReportSighting";
import Insights from "../pages/Insights";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/explore" element={<Explore />} />
      <Route
        path="/photographer"
        element={<Photographer />}
      />
      <Route
        path="/report"
        element={<ReportSighting />}
      />
      <Route
        path="/insights"
        element={<Insights />}
      />
    </Routes>
  );
}

export default AppRoutes;