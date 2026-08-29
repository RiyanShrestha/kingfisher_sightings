import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  Camera,
  ExternalLink,
  Filter,
  MapPin,
  Search,
  X,
} from "lucide-react";

import KingfisherMap from "../components/KingfisherMap";
import { dedupSightings } from "../utils/dedupSightings";
import { getBestImageUrl, getSightingKey } from "../utils/sightingHelpers";
import { API_ENDPOINTS } from "../config/api";

const API_URL = API_ENDPOINTS.SIGHTINGS;

function ExploreSightingImage({ sighting }) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = getBestImageUrl(sighting);

  if (!imageUrl || imgError) {
    return (
      <div className="sighting-image-placeholder" aria-label="No image available">
        <div className="sighting-image-placeholder-icon">
          <Camera size={22} />
        </div>
        <span>No image available</span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={sighting.species?.commonName || "Kingfisher observation"}
      className="sighting-image"
      loading="lazy"
      decoding="async"
      onError={(event) => {
        const fallback = sighting.media?.[0]?.url;
        if (fallback && event.currentTarget.src !== fallback) {
          event.currentTarget.src = fallback;
        } else {
          setImgError(true);
        }
      }}
    />
  );
}

function Explore() {
  const [sightings, setSightings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] =
    useState("all");
  const [dateFilter, setDateFilter] =
    useState("all");
  const [researchOnly, setResearchOnly] =
    useState(false);

  const [selectedSightingId, setSelectedSightingId] = useState(null);
  const [focusLocation, setFocusLocation] = useState(null);

  const handleSelectSighting = (sighting) => {
    if (!sighting) return;
    const cardId = getSightingKey(sighting);
    
    setSelectedSightingId(cardId);

    if (sighting.location?.latitude && sighting.location?.longitude) {
      setFocusLocation({
        latitude: Number(sighting.location.latitude),
        longitude: Number(sighting.location.longitude),
      });
    }

    // Scroll card into view if available
    const el = document.getElementById(`sighting-card-${cardId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // ============================================================
  // FETCH SIGHTINGS
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    const fetchSightings = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch sightings: ${response.status}`
          );
        }

        const data = await response.json();

        if (!cancelled) {
          setSightings(
            Array.isArray(data.sightings)
              ? data.sightings
              : []
          );
        }
      } catch (err) {
        console.error(
          "KingFinder API error:",
          err
        );

        if (!cancelled) {
          setError(
            "Unable to load real sightings. Make sure the KingFinder server is running."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchSightings();

    return () => {
      cancelled = true;
    };
  }, []);

  // ============================================================
  // REMOVE TRUE OBSERVATION DUPLICATES
  // ============================================================

  const uniqueSightings = useMemo(
    () => dedupSightings(sightings),
    [sightings]
  );

  // ============================================================
  // UNIQUE LOCATION COUNT
  // ============================================================

  const uniqueLocationCount = useMemo(() => {
    const locations = new Set();

    uniqueSightings.forEach((sighting) => {
      const latitude =
        sighting.location?.latitude;

      const longitude =
        sighting.location?.longitude;

      if (
        latitude !== null &&
        latitude !== undefined &&
        longitude !== null &&
        longitude !== undefined
      ) {
        const lat =
          Number(latitude).toFixed(4);

        const lng =
          Number(longitude).toFixed(4);

        locations.add(`${lat},${lng}`);
      }
    });

    return locations.size;
  }, [uniqueSightings]);

  // ============================================================
  // SPECIES OPTIONS
  // ============================================================

  const speciesOptions = useMemo(() => {
    const speciesMap = new Map();

    uniqueSightings.forEach((sighting) => {
      const commonName =
        sighting.species
          ?.commonName
          ?.trim() ||
        "Unknown Kingfisher";

      const scientificName =
        sighting.species
          ?.scientificName
          ?.trim() ||
        "Unknown";

      const key =
        `${commonName}||${scientificName}`;

      if (!speciesMap.has(key)) {
        speciesMap.set(key, {
          key,
          commonName,
          scientificName,
        });
      }
    });

    return Array.from(
      speciesMap.values()
    ).sort((a, b) =>
      `${a.commonName} ${a.scientificName}`.localeCompare(
        `${b.commonName} ${b.scientificName}`
      )
    );
  }, [uniqueSightings]);

  // ============================================================
  // FILTER SIGHTINGS
  // ============================================================

  const filteredSightings = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    let minimumDate = null;

    if (dateFilter !== "all") {
      const days = Number(dateFilter);

      if (Number.isFinite(days)) {
        minimumDate = new Date();

        minimumDate.setHours(
          0,
          0,
          0,
          0
        );

        minimumDate.setDate(
          minimumDate.getDate() - days
        );
      }
    }

    return uniqueSightings.filter(
      (sighting) => {
        const commonName =
          sighting.species
            ?.commonName
            ?.trim() || "";

        const scientificName =
          sighting.species
            ?.scientificName
            ?.trim() || "";

        const speciesKey =
          `${commonName}||${scientificName}`;

        const locationName =
          sighting.location
            ?.name
            ?.trim() || "";

        const city =
          sighting.location
            ?.city
            ?.trim() || "";

        const state =
          sighting.location
            ?.state
            ?.trim() || "";

        const searchableText = [
          commonName,
          scientificName,
          locationName,
          city,
          state,
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          !query ||
          searchableText.includes(query);

        const matchesSpecies =
          speciesFilter === "all" ||
          speciesKey === speciesFilter;

        let matchesDate = true;

        if (minimumDate) {
          const dateValue =
            sighting.observation?.date;

          if (!dateValue) {
            matchesDate = false;
          } else {
            const observationDate =
              new Date(dateValue);

            if (
              Number.isNaN(
                observationDate.getTime()
              )
            ) {
              matchesDate = false;
            } else {
              observationDate.setHours(
                0,
                0,
                0,
                0
              );

              matchesDate =
                observationDate >=
                minimumDate;
            }
          }
        }

        const matchesResearch =
          !researchOnly ||
          sighting.verification
            ?.isResearchGrade === true;

        return (
          matchesSearch &&
          matchesSpecies &&
          matchesDate &&
          matchesResearch
        );
      }
    );
  }, [
    uniqueSightings,
    search,
    speciesFilter,
    dateFilter,
    researchOnly,
  ]);

  // ============================================================
  // ACTIVE FILTERS
  // ============================================================

  const hasActiveFilters =
    search.trim() !== "" ||
    speciesFilter !== "all" ||
    dateFilter !== "all" ||
    researchOnly;

  // ============================================================
  // CLEAR FILTERS
  // ============================================================

  const clearFilters = () => {
    setSearch("");
    setSpeciesFilter("all");
    setDateFilter("all");
    setResearchOnly(false);
  };

  // ============================================================

  // PAGE
  // ============================================================

  return (
    <main className="page">

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <section className="page-header">

        <p className="eyebrow">
          DISCOVER
        </p>

        <h1>
          Explore Sightings
        </h1>

        <p>
          Discover recent real-world
          kingfisher observations around
          Bengaluru and narrow them down
          to the sightings you want.
        </p>

      </section>

      <section className="explore-content">

        {/* ====================================================
            LOADING
        ==================================================== */}

        {loading && (
          <div className="status-card">

            <h2>
              Loading real observations...
            </h2>

            <p>
              Fetching current data from
              iNaturalist.
            </p>

          </div>
        )}

        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (
          <div className="status-card error">

            <h2>
              Something went wrong
            </h2>

            <p>
              {error}
            </p>

          </div>
        )}

        {/* ====================================================
            MAIN CONTENT
        ==================================================== */}

        {!loading && !error && (
          <>

            {/* ==================================================
                SUMMARY
            ================================================== */}

            <div className="data-summary">

              <div>

                <span className="summary-number">
                  {uniqueSightings.length}
                </span>

                <span className="summary-label">
                  unique observations
                </span>

              </div>

              <div>

                <span className="summary-number">
                  {uniqueLocationCount}
                </span>

                <span className="summary-label">
                  unique locations
                </span>

              </div>

              <div>

                <span className="summary-label">
                  Region
                </span>

                <strong>
                  Bengaluru, Karnataka
                </strong>

              </div>

              <div>

                <span className="summary-label">
                  Source
                </span>

                <strong>
                  iNaturalist
                </strong>

              </div>

            </div>

            {/* ==================================================
                SEARCH & FILTER
            ================================================== */}

            <section className="explore-filters">

              <div className="filters-heading">

                <div>

                  <p className="eyebrow">
                    FIND A SIGHTING
                  </p>

                  <h2>
                    Search & Filter
                  </h2>

                </div>

                <span className="filter-result-count">
                  {filteredSightings.length} of{" "}
                  {uniqueSightings.length} sightings
                </span>

              </div>

              <div className="filter-controls">

                {/* SEARCH */}

                <label className="filter-field filter-search">

                  <span>
                    Search
                  </span>

                  <div className="input-with-icon">

                    <Search size={17} />

                    <input
                      type="search"
                      value={search}
                      onChange={(event) =>
                        setSearch(
                          event.target.value
                        )
                      }
                      placeholder="Species, scientific name or location"
                    />

                    {search && (
                      <button
                        type="button"
                        className="input-clear"
                        onClick={() =>
                          setSearch("")
                        }
                        aria-label="Clear search"
                      >
                        <X size={16} />
                      </button>
                    )}

                  </div>

                </label>

                {/* SPECIES */}

                <label className="filter-field">

                  <span>
                    Species
                  </span>

                  <select
                    value={speciesFilter}
                    onChange={(event) =>
                      setSpeciesFilter(
                        event.target.value
                      )
                    }
                  >

                    <option value="all">
                      All species
                    </option>

                    {speciesOptions.map(
                      (species) => (
                        <option
                          key={species.key}
                          value={species.key}
                        >
                          {species.commonName}
                          {" — "}
                          {species.scientificName}
                        </option>
                      )
                    )}

                  </select>

                </label>

                {/* DATE */}

                <label className="filter-field">

                  <span>
                    Date
                  </span>

                  <div className="select-with-icon">

                    <CalendarDays size={16} />

                    <select
                      value={dateFilter}
                      onChange={(event) =>
                        setDateFilter(
                          event.target.value
                        )
                      }
                    >

                      <option value="all">
                        Any time
                      </option>

                      <option value="7">
                        Last 7 days
                      </option>

                      <option value="30">
                        Last 30 days
                      </option>

                      <option value="90">
                        Last 90 days
                      </option>

                      <option value="365">
                        Last year
                      </option>

                    </select>

                  </div>

                </label>

                {/* RESEARCH GRADE */}

                <label className="research-toggle">

                  <input
                    type="checkbox"
                    checked={researchOnly}
                    onChange={(event) =>
                      setResearchOnly(
                        event.target.checked
                      )
                    }
                  />

                  <span className="toggle-ui" />

                  <span>

                    <strong>
                      Research Grade
                    </strong>

                    <small>
                      Show verified observations only
                    </small>

                  </span>

                </label>

                {/* CLEAR */}

                {hasActiveFilters && (
                  <button
                    type="button"
                    className="clear-filters-button"
                    onClick={clearFilters}
                  >
                    <X size={16} />
                    Clear
                  </button>
                )}

              </div>

            </section>

            {/* ==================================================
                MAP
            ================================================== */}

            <KingfisherMap
              sightings={filteredSightings}
              focusLocation={focusLocation}
              onSelectSighting={handleSelectSighting}
            />

            {/* ==================================================
                RECENT SIGHTINGS
            ================================================== */}

            <section className="sightings-section">

              <div className="section-heading">

                <div>

                  <h2>
                    Recent Sightings
                  </h2>

                  <p>
                    Browse the observations
                    matching your filters.
                  </p>

                </div>

              </div>

              {/* ==================================================
                  NO RESULTS
              ================================================== */}

              {filteredSightings.length === 0 ? (

                <div className="status-card">

                  <MapPin size={30} />

                  <h2>
                    No sightings found
                  </h2>

                  <p>
                    Try changing the species,
                    date or search filters.
                  </p>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={clearFilters}
                  >
                    <Filter size={17} />
                    Clear filters
                  </button>

                </div>

              ) : (

                <div className="sightings-grid">

                  {filteredSightings
                    .slice(0, 30)
                    .map((sighting) => {

                      const cardKey =
                        getSightingKey(sighting);

                      const lat = sighting.location?.latitude;
                      const lng = sighting.location?.longitude;
                      const roundKey = lat && lng ? `${Number(lat).toFixed(3)},${Number(lng).toFixed(3)}` : sighting.location?.name || cardKey;
                      const isSelected = selectedSightingId === cardKey;

                      return (
                        <article
                          id={`sighting-card-${cardKey}`}
                          className={`sighting-card ${isSelected ? "selected-card" : ""}`}
                          key={cardKey}
                          onClick={() => handleSelectSighting(sighting)}
                          style={{
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            border: isSelected ? "2px solid var(--color-primary)" : "1px solid #e2e8f0",
                            boxShadow: isSelected ? "0 4px 12px rgba(14, 165, 233, 0.25)" : "none",
                          }}
                        >

                          {/* IMAGE */}

                          <ExploreSightingImage sighting={sighting} />

                          {/* CARD BODY */}

                          <div className="sighting-body">

                            <p className="sighting-species">
                              {sighting.species
                                ?.commonName ||
                                "Unknown Kingfisher"}
                            </p>

                            <p className="scientific-name">
                              {sighting.species
                                ?.scientificName ||
                                "Scientific name unavailable"}
                            </p>

                            <div className="sighting-details">

                              <span>
                                📍{" "}
                                {sighting.location
                                  ?.name ||
                                  "Bengaluru"}
                              </span>

                              <span>
                                📅{" "}
                                {sighting.observation
                                  ?.date ||
                                  "Date unavailable"}
                              </span>

                              {sighting.verification
                                ?.isResearchGrade && (
                                <span className="research-card-badge">
                                  ✓ Research Grade
                                </span>
                              )}

                            </div>

                            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                              <Link
                                to={`/location/${encodeURIComponent(roundKey)}`}
                                className="secondary-button"
                                style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                Location Detail <ExternalLink size={12} />
                              </Link>

                              {sighting.source?.url && (
                                <a
                                  href={
                                    sighting.source.url
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="source-link"
                                  style={{ fontSize: "0.75rem" }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  View original →
                                </a>
                              )}
                            </div>

                          </div>

                        </article>
                      );
                    })}

                </div>
              )}

              {/* RESULTS NOTE */}

              {filteredSightings.length > 30 && (
                <p className="results-note">
                  Showing the first 30 matching
                  observations. The map continues
                  to show all matching locations.
                </p>
              )}

            </section>

          </>
        )}

      </section>

    </main>
  );
}

export { Explore };
export default Explore;