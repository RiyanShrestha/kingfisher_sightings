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

const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#64748b"];

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
        <section className="page-header">
          <p className="eyebrow">ANALYTICS</p>
          <h1>Insights & Analytics</h1>
          <p>Analyzing kingfisher sighting distribution across Bengaluru...</p>
        </section>
        <div className="placeholder-card" style={{ padding: "4rem 2rem", textAlign: "center" }}>
          <Clock className="spin" size={36} style={{ color: "var(--color-primary)", marginBottom: "1rem" }} />
          <p>Processing observation records...</p>
        </div>
      </PageContainer>
    );
  }

  if (error || !data || !data.sightings) {
    return (
      <PageContainer>
        <section className="page-header">
          <p className="eyebrow">ANALYTICS</p>
          <h1>Insights</h1>
          <p>Unable to load analytics data.</p>
        </section>
        <div className="placeholder-card" style={{ padding: "2rem", textAlign: "center" }}>
          <p style={{ color: "#ef4444" }}>Error: {error || "No data received"}</p>
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
    (s) => s.observation?.isResearchGrade || s.observation?.qualityGrade === "research"
  ).length;
  const photoCount = sightings.filter((s) => s.hasImage || (s.media && s.media.length > 0)).length;

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

  return (
    <PageContainer>
      <section className="page-header">
        <p className="eyebrow">ANALYTICS</p>
        <h1>Bengaluru Kingfisher Insights</h1>
        <p>Real-time analytics and observational metrics aggregated from iNaturalist, GBIF, and community reports.</p>
      </section>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2.5rem",
        }}
      >
        <div className="placeholder-card" style={{ padding: "1.25rem", borderLeft: "4px solid var(--color-primary)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#64748b", fontSize: "0.85rem", marginBottom: "0.4rem" }}>
            <Layers size={16} /> Total Sightings
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#0f172a" }}>{totalCount}</div>
          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.2rem" }}>Across Bengaluru Region</div>
        </div>

        <div className="placeholder-card" style={{ padding: "1.25rem", borderLeft: "4px solid #10b981" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#64748b", fontSize: "0.85rem", marginBottom: "0.4rem" }}>
            <Compass size={16} /> Recorded Species
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#0f172a" }}>{speciesChartData.length}</div>
          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.2rem" }}>Out of 6 regional species</div>
        </div>

        <div className="placeholder-card" style={{ padding: "1.25rem", borderLeft: "4px solid #f59e0b" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#64748b", fontSize: "0.85rem", marginBottom: "0.4rem" }}>
            <Camera size={16} /> Photo Evidence
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#0f172a" }}>
            {Math.round((photoCount / (totalCount || 1)) * 100)}%
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.2rem" }}>{photoCount} verified photos</div>
        </div>

        <div className="placeholder-card" style={{ padding: "1.25rem", borderLeft: "4px solid #8b5cf6" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#64748b", fontSize: "0.85rem", marginBottom: "0.4rem" }}>
            <Award size={16} /> Research Grade
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "#0f172a" }}>
            {Math.round((researchGradeCount / (totalCount || 1)) * 100)}%
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.2rem" }}>{researchGradeCount} high-confidence records</div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.5rem", marginBottom: "2.5rem" }}>
        {/* Chart 1: Species Distribution */}
        <div className="placeholder-card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "1rem" }}>Species Distribution</h3>
          <div style={{ width: "100%", height: "260px" }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={speciesChartData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {speciesChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} sightings`, "Count"]} />
                <Legend wrapperStyle={{ fontSize: "0.8rem" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Monthly Sighting Trends */}
        <div className="placeholder-card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "1rem" }}>Sightings Over Time</h3>
          <div style={{ width: "100%", height: "260px" }}>
            <ResponsiveContainer>
              <BarChart data={monthlyChartData}>
                <XAxis dataKey="month" style={{ fontSize: "0.75rem" }} />
                <YAxis style={{ fontSize: "0.75rem" }} />
                <Tooltip formatter={(val) => [`${val} sightings`, "Sightings"]} />
                <Bar dataKey="sightings" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Section: Top Locations & Data Sources */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        {/* Top Locations Table */}
        <div className="placeholder-card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <MapPin size={18} style={{ color: "var(--color-primary)" }} /> Top Bengaluru Hotspots
          </h3>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {topLocations.map((loc, idx) => (
              <div
                key={loc.key}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.75rem",
                  borderRadius: "8px",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                    {idx + 1}. {loc.name}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                    {loc.speciesCount} species recorded
                  </div>
                </div>
                <Link
                  to={`/location/${encodeURIComponent(loc.key)}`}
                  className="secondary-button"
                  style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                >
                  {loc.count} sightings <ExternalLink size={12} />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Data Source Breakdown */}
        <div className="placeholder-card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Layers size={18} style={{ color: "var(--color-primary)" }} /> Data Provider Breakdown
          </h3>
          <div style={{ display: "grid", gap: "1rem", marginBottom: "1.5rem" }}>
            {sourceChartData.map((src, i) => (
              <div key={src.name}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                  <span>{src.name}</span>
                  <span>{src.value} records ({Math.round((src.value / totalCount) * 100)}%)</span>
                </div>
                <div style={{ width: "100%", height: "8px", borderRadius: "4px", backgroundColor: "#e2e8f0", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${(src.value / totalCount) * 100}%`,
                      height: "100%",
                      backgroundColor: COLORS[i % COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              padding: "0.85rem",
              borderRadius: "8px",
              backgroundColor: "rgba(14, 165, 233, 0.08)",
              border: "1px solid rgba(14, 165, 233, 0.2)",
              fontSize: "0.8rem",
              color: "#0369a1",
              lineHeight: "1.4",
            }}
          >
            <strong>Research Grade Guarantee:</strong> All iNaturalist data is pre-filtered for research-grade quality observations, cross-deduplicated against GBIF records to prevent double-counting.
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

export default Insights;