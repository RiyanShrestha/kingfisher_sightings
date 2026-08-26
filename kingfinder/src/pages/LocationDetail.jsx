import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  MapPin,
  ExternalLink,
  Camera,
  Calendar,
  Layers,
  ArrowLeft,
  Award,
  Clock,
  Compass,
} from "lucide-react";
import PageContainer from "../components/PageContainer";
import KingfisherMap from "../components/KingfisherMap";
import { getGoogleMapsUrl, getBestImageUrl } from "../utils/sightingHelpers";
import { calculateLocationScore } from "./photographer/scoring";
import { API_ENDPOINTS } from "../config/api";

const API_URL = API_ENDPOINTS.SIGHTINGS;

function LocationDetail() {
  const { locationId } = useParams();
  const [sightings, setSightings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isCancelled = false;
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Failed to fetch sightings data.");
        const data = await res.json();
        if (!isCancelled) {
          setSightings(data.sightings || []);
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

  const decodedId = decodeURIComponent(locationId || "");

  // Match sightings by rounded coordinate key or location name
  const locationSightings = sightings.filter((s) => {
    const lat = s.location?.latitude;
    const lng = s.location?.longitude;
    const roundKey = lat && lng ? `${Number(lat).toFixed(3)},${Number(lng).toFixed(3)}` : "";
    const locName = s.location?.name || "";
    return roundKey === decodedId || locName.toLowerCase() === decodedId.toLowerCase() || s.id === decodedId;
  });

  if (loading) {
    return (
      <PageContainer>
        <div className="placeholder-card" style={{ padding: "4rem 2rem", textAlign: "center" }}>
          <Clock className="spin" size={32} style={{ color: "var(--color-primary)", marginBottom: "1rem" }} />
          <p>Loading location details...</p>
        </div>
      </PageContainer>
    );
  }

  if (error || locationSightings.length === 0) {
    return (
      <PageContainer>
        <section className="page-header">
          <p className="eyebrow">Location Detail</p>
          <h1>Location Not Found</h1>
          <p>We couldn't find active sightings for this location key: "{decodedId}"</p>
        </section>
        <div style={{ margin: "2rem 0" }}>
          <Link to="/explore" className="primary-button" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
            <ArrowLeft size={18} /> Back to Explore
          </Link>
        </div>
      </PageContainer>
    );
  }

  const primaryLoc = locationSightings[0]?.location || {};
  const locationName = primaryLoc.name || "Bengaluru Hotspot";
  const latitude = primaryLoc.latitude;
  const longitude = primaryLoc.longitude;

  // Aggregate stats
  const totalCount = locationSightings.length;
  const withPhotoCount = locationSightings.filter((s) => s.hasImage || (s.media && s.media.length > 0)).length;

  const speciesMap = {};
  locationSightings.forEach((s) => {
    const name = s.species?.commonName || "Unknown Kingfisher";
    speciesMap[name] = (speciesMap[name] || 0) + 1;
  });

  const speciesList = Object.entries(speciesMap).sort((a, b) => b[1] - a[1]);
  const primarySpecies = speciesList[0] ? speciesList[0][0] : "Kingfishers";

  // Calculate score using existing formula
  const locationGroup = {
    locationName,
    latitude,
    longitude,
    sightings: locationSightings,
  };
  const scoreResult = calculateLocationScore(locationGroup, "ALL");

  return (
    <PageContainer>
      <div style={{ marginBottom: "1.5rem" }}>
        <Link
          to="/explore"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            color: "var(--color-primary)",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "0.95rem",
          }}
        >
          <ArrowLeft size={16} /> Back to Explore Map
        </Link>
      </div>

      <header className="page-header" style={{ textAlign: "left", marginBottom: "2rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <span className="eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
            <MapPin size={14} /> Hotspot Detail
          </span>
          <span
            style={{
              padding: "0.2rem 0.6rem",
              borderRadius: "1rem",
              fontSize: "0.75rem",
              fontWeight: 700,
              backgroundColor: "rgba(14, 165, 233, 0.1)",
              color: "var(--color-primary)",
            }}
          >
            {scoreResult.tierLabel} ({scoreResult.score}/100)
          </span>
        </div>
        <h1 style={{ fontSize: "2.2rem", marginBottom: "0.5rem" }}>{locationName}</h1>
        <p style={{ color: "#64748b", maxWidth: "700px" }}>
          Located at {latitude?.toFixed(4)}°N, {longitude?.toFixed(4)}°E in Bengaluru. Known for frequent sightings of{" "}
          <strong>{primarySpecies}</strong>.
        </p>
      </header>

      {/* Stats overview cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div className="placeholder-card" style={{ padding: "1.25rem", borderLeft: "4px solid var(--color-primary)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#64748b", fontSize: "0.85rem", marginBottom: "0.4rem" }}>
            <Layers size={16} /> Total Sightings
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a" }}>{totalCount}</div>
        </div>

        <div className="placeholder-card" style={{ padding: "1.25rem", borderLeft: "4px solid #10b981" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#64748b", fontSize: "0.85rem", marginBottom: "0.4rem" }}>
            <Compass size={16} /> Species Diversity
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a" }}>{speciesList.length}</div>
        </div>

        <div className="placeholder-card" style={{ padding: "1.25rem", borderLeft: "4px solid #f59e0b" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#64748b", fontSize: "0.85rem", marginBottom: "0.4rem" }}>
            <Camera size={16} /> Photo Evidence Rate
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a" }}>
            {Math.round((withPhotoCount / totalCount) * 100)}%
          </div>
        </div>

        <div className="placeholder-card" style={{ padding: "1.25rem", borderLeft: "4px solid #8b5cf6" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#64748b", fontSize: "0.85rem", marginBottom: "0.4rem" }}>
            <Award size={16} /> Photographer Score
          </div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a" }}>{scoreResult.score}/100</div>
        </div>
      </div>

      {/* Map + Action Bar */}
      <div style={{ marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700 }}>Location Map</h2>
          {latitude && longitude && (
            <a
              href={getGoogleMapsUrl(latitude, longitude)}
              target="_blank"
              rel="noopener noreferrer"
              className="secondary-button"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
            >
              <ExternalLink size={14} /> Open in Google Maps
            </a>
          )}
        </div>
        <div style={{ height: "350px", borderRadius: "12px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
          <KingfisherMap sightings={locationSightings} focusLocation={latitude && longitude ? { latitude, longitude } : null} />
        </div>
      </div>

      {/* Species Recorded Breakdown */}
      <div style={{ marginBottom: "2.5rem" }}>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "1rem" }}>Recorded Species</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          {speciesList.map(([spName, count]) => (
            <div
              key={spName}
              style={{
                padding: "0.6rem 1rem",
                borderRadius: "8px",
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <span style={{ fontWeight: 600, color: "#334155" }}>{spName}</span>
              <span
                style={{
                  backgroundColor: "var(--color-primary)",
                  color: "#fff",
                  padding: "0.15rem 0.5rem",
                  borderRadius: "1rem",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                }}
              >
                {count} {count === 1 ? "sighting" : "sightings"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Sightings List */}
      <div>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "1rem" }}>Recorded Observations</h2>
        <div style={{ display: "grid", gap: "1rem" }}>
          {locationSightings.map((sighting) => {
            const imgUrl = getBestImageUrl(sighting);
            return (
              <div
                key={sighting.id}
                className="placeholder-card"
                style={{
                  padding: "1rem",
                  display: "flex",
                  flexDirection: "row",
                  gap: "1rem",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                {imgUrl ? (
                  <img
                    src={imgUrl}
                    alt={sighting.species?.commonName}
                    style={{ width: "90px", height: "90px", objectFit: "cover", borderRadius: "8px" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "90px",
                      height: "90px",
                      borderRadius: "8px",
                      backgroundColor: "#f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#94a3b8",
                    }}
                  >
                    <Camera size={24} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: "220px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>
                      {sighting.species?.commonName || "Kingfisher"}
                    </h3>
                    <span style={{ fontSize: "0.8rem", color: "#64748b", italic: "true" }}>
                      ({sighting.species?.scientificName})
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "1rem", fontSize: "0.85rem", color: "#64748b", marginBottom: "0.4rem" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                      <Calendar size={13} /> {sighting.observation?.date || "Unknown date"}
                    </span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                      <Layers size={13} /> Source: {sighting.source?.platform || sighting.source?.name || "iNaturalist"}
                    </span>
                  </div>
                  {sighting.observation?.notes && (
                    <p style={{ fontSize: "0.85rem", color: "#475569", margin: 0 }}>{sighting.observation.notes}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}

export default LocationDetail;
