import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import { Explore } from "../pages/Explore";
import Photographer from "../pages/Photographer";
import ReportSighting from "../pages/ReportSighting";
import Insights from "../pages/Insights";
import LocationDetail from "../pages/LocationDetail";
import NotFound from "../pages/NotFound";

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
        path="/location/:locationId"
        element={<LocationDetail />}
      />
      <Route
        path="/report"
        element={<ReportSighting />}
      />
      <Route
        path="/insights"
        element={<Insights />}
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;