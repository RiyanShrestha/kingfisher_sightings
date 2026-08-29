import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Award,
  Camera,
  Layers,
  MapPin,
  Clock,
  Compass,
  ExternalLink,
} from "lucide-react";
import PageContainer from "../components/PageContainer";
import { API_ENDPOINTS } from "../config/api";

const API_URL = API_ENDPOINTS.SIGHTINGS;

const COLORS = ["#1f5c45", "#2d6a64", "#0284c7", "#d97706", "#7c3aed", "#64748b"];

function Insights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isCancelled = false;
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Failed to fetch analytics data.");
        const json = await res.json();
        if (!isCancelled) {
          setData(json);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }
    loadData();
    return () => {
      isCancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <PageContainer>
        <header className="page-header">
          <p className="eyebrow">ANALYTICS & METRICS</p>
          <h1>Observational Insights</h1>
          <p>Analyzing kingfisher sighting distribution across Bengaluru...</p>
        </header>
        <div className="placeholder-card" style={{ padding: "4rem 2rem", textAlign: "center" }}>
          <Clock className="spin" size={36} style={{ color: "var(--color-teal)", marginBottom: "1rem" }} />
          <p>Processing observation records...</p>
        </div>
      </PageContainer>
    );
  }

  if (error || !data || !data.sightings) {
    return (
      <PageContainer>
        <header className="page-header">
          <p className="eyebrow">ANALYTICS & METRICS</p>
          <h1>Observational Insights</h1>
          <p>Unable to load analytics data.</p>
        </header>
        <div className="placeholder-card" style={{ padding: "2.5rem", textAlign: "center" }}>
          <p style={{ color: "#c2410c", fontWeight: 600 }}>Error: {error || "No data received"}</p>
        </div>
      </PageContainer>
    );
  }

  const sightings = data.sightings || [];
  const totalCount = sightings.length;

  // Species Distribution Data
  const speciesCounts = {};
  sightings.forEach((s) => {
    const name = s.species?.commonName || "Unknown";
    speciesCounts[name] = (speciesCounts[name] || 0) + 1;
  });

  const speciesChartData = Object.entries(speciesCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Source Distribution Data
  const sourceCounts = data.sourceCounts || {};
  const sourceChartData = Object.entries(sourceCounts).map(([name, value]) => ({ name, value }));

  // Research Grade & Photo Stats
  const researchGradeCount = sightings.filter(
    (s) => s.observation?.isResearchGrade || s.observation?.qualityGrade === "research" || s.verification?.isResearchGrade
  ).length;
  const photoCount = sightings.filter((s) => s.hasImage || (s.media && s.media.length > 0) || s.primaryImageUrl).length;

  // Monthly / Temporal distribution
  const monthMap = {};
  sightings.forEach((s) => {
    const dateStr = s.observation?.date;
    if (dateStr) {
      const month = dateStr.slice(0, 7); // YYYY-MM
      monthMap[month] = (monthMap[month] || 0) + 1;
    }
  });

  const monthlyChartData = Object.entries(monthMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([month, count]) => ({
      month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      sightings: count,
    }));

  // Top Hotspot Locations
  const locationMap = {};
  sightings.forEach((s) => {
    const name = s.location?.name || "Bengaluru Location";
    const key = s.location?.latitude && s.location?.longitude
      ? `${Number(s.location.latitude).toFixed(3)},${Number(s.location.longitude).toFixed(3)}`
      : name;
    if (!locationMap[key]) {
      locationMap[key] = {
        key,
        name,
        count: 0,
        species: new Set(),
      };
    }
    locationMap[key].count += 1;
    if (s.species?.commonName) {
      locationMap[key].species.add(s.species.commonName);
    }
  });

  const topLocations = Object.values(locationMap)
    .map((l) => ({ ...l, speciesCount: l.species.size }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const customTooltipStyle = {
    background: "#ffffff",
    border: "1px solid #dfe5df",
    borderRadius: "10px",
    fontSize: "12px",
    boxShadow: "0 6px 18px rgba(18, 55, 42, 0.08)",
    padding: "8px 12px",
    color: "#17201c",
  };

  return (
    <PageContainer>
      <header className="page-header">
        <p className="eyebrow">ANALYTICS & METRICS</p>
        <h1>Observational Insights</h1>
        <p>
          Real-time analytics and ecological metrics aggregated from iNaturalist research records,
          GBIF biodiversity archives, and verified local field observations in Bengaluru.
        </p>
      </header>

      <div className="insights-page">
        {/* ======================================================
            SECTION 1: KPI SUMMARY ROW
        ====================================================== */}
        <section className="insights-section">
          <div className="insights-kpi-grid">
            <div className="insights-kpi-card">
              <div className="insights-kpi-top">
                <span className="insights-kpi-title">Total Sightings</span>
                <div className="insights-kpi-icon-wrap">
                  <Layers size={16} />
                </div>
              </div>
              <div>
                <div className="insights-kpi-value">{totalCount}</div>
                <div className="insights-kpi-subtext">Across Bengaluru Region</div>
              </div>
            </div>

            <div className="insights-kpi-card">
              <div className="insights-kpi-top">
                <span className="insights-kpi-title">Recorded Species</span>
                <div className="insights-kpi-icon-wrap">
                  <Compass size={16} />
                </div>
              </div>
              <div>
                <div className="insights-kpi-value">{speciesChartData.length}</div>
                <div className="insights-kpi-subtext">Out of 6 regional species</div>
              </div>
            </div>

            <div className="insights-kpi-card">
              <div className="insights-kpi-top">
                <span className="insights-kpi-title">Photo Evidence</span>
                <div className="insights-kpi-icon-wrap">
                  <Camera size={16} />
                </div>
              </div>
              <div>
                <div className="insights-kpi-value">
                  {Math.round((photoCount / (totalCount || 1)) * 100)}%
                </div>
                <div className="insights-kpi-subtext">{photoCount} verified photos</div>
              </div>
            </div>

            <div className="insights-kpi-card">
              <div className="insights-kpi-top">
                <span className="insights-kpi-title">Research Grade</span>
                <div className="insights-kpi-icon-wrap">
                  <Award size={16} />
                </div>
              </div>
              <div>
                <div className="insights-kpi-value">
                  {Math.round((researchGradeCount / (totalCount || 1)) * 100)}%
                </div>
                <div className="insights-kpi-subtext">{researchGradeCount} high-confidence records</div>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================
            SECTION 2: MAIN CHARTS
        ====================================================== */}
        <section className="insights-section">
          <div className="insights-section-header">
            <h2>Species Diversity & Temporal Activity</h2>
            <p>Distribution across identified kingfisher species and monthly observational frequency.</p>
          </div>

          <div className="insights-charts-grid">
            {/* Chart 1: Species Distribution */}
            <div className="insights-chart-card">
              <div className="insights-chart-header">
                <h3>Species Distribution</h3>
                <p>Breakdown of all recorded sightings by species</p>
              </div>
              <div className="insights-chart-body">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={speciesChartData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="48%"
                      outerRadius={82}
                      innerRadius={36}
                      paddingAngle={3}
                    >
                      {speciesChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={customTooltipStyle}
                      formatter={(value) => [`${value} sightings`, "Count"]}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Monthly Sighting Trends */}
            <div className="insights-chart-card">
              <div className="insights-chart-header">
                <h3>Sightings Over Time</h3>
                <p>Monthly observation trends over the past 12 months</p>
              </div>
              <div className="insights-chart-body">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
                      axisLine={{ stroke: "var(--color-border)" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={customTooltipStyle}
                      formatter={(val) => [`${val} observations`, "Sightings"]}
                    />
                    <Bar
                      dataKey="sightings"
                      fill="var(--color-teal)"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================
            SECTION 3: SUPPORTING ANALYTICS
        ====================================================== */}
        <section className="insights-section">
          <div className="insights-section-header">
            <h2>Geographic Hotspots & Data Provenance</h2>
            <p>Top observation areas in Bengaluru and scientific source distributions.</p>
          </div>

          <div className="insights-details-grid">
            {/* Top Locations Table */}
            <div className="insights-detail-card">
              <div className="insights-detail-header">
                <div className="insights-detail-header-icon">
                  <MapPin size={18} />
                </div>
                <div>
                  <h3>Top Bengaluru Hotspots</h3>
                </div>
              </div>

              <div className="insights-hotspots-list">
                {topLocations.map((loc, idx) => (
                  <div key={loc.key} className="insights-hotspot-item">
                    <div className="insights-hotspot-info">
                      <span className="insights-hotspot-name">
                        {idx + 1}. {loc.name}
                      </span>
                      <span className="insights-hotspot-meta">
                        {loc.speciesCount} {loc.speciesCount === 1 ? "species" : "species"} recorded
                      </span>
                    </div>
                    <Link
                      to={`/location/${encodeURIComponent(loc.key)}`}
                      className="insights-hotspot-btn"
                    >
                      <span>{loc.count} sightings</span>
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Source Breakdown */}
            <div className="insights-detail-card">
              <div className="insights-detail-header">
                <div className="insights-detail-header-icon">
                  <Layers size={18} />
                </div>
                <div>
                  <h3>Data Provider Breakdown</h3>
                </div>
              </div>

              <div className="insights-providers-list">
                {sourceChartData.map((src, i) => (
                  <div key={src.name} className="insights-provider-row">
                    <div className="insights-provider-meta">
                      <span className="insights-provider-name">{src.name}</span>
                      <span className="insights-provider-count">
                        {src.value} records ({Math.round((src.value / totalCount) * 100)}%)
                      </span>
                    </div>
                    <div className="insights-provider-bar-track">
                      <div
                        className="insights-provider-bar-fill"
                        style={{
                          width: `${(src.value / totalCount) * 100}%`,
                          backgroundColor: COLORS[i % COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="insights-note-box">
                <strong>Research Quality Assurance:</strong> Field records are cross-deduplicated against global biodiversity archives, prioritizing verifiable photographic evidence and coordinate accuracy.
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageContainer>
  );
}

export default Insights;