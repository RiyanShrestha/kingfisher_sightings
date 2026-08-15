import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Filter,
  MapPin,
  Search,
  X,
} from "lucide-react";

import KingfisherMap from "../components/KingfisherMap";

function Explore() {
  const [sightings, setSightings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [researchOnly, setResearchOnly] = useState(false);

  // ============================================================
  // FETCH SIGHTINGS
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    const fetchSightings = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "http://localhost:5000/api/sightings"
        );

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
        console.error("KingFinder API error:", err);

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
  // REMOVE ONLY TRUE OBSERVATION DUPLICATES
  //
  // IMPORTANT:
  // We DO NOT deduplicate using photo IDs.
  //
  // A photo can potentially be reused or represented differently
  // by different sources. Removing a complete sighting because
  // of a photo ID can accidentally delete genuine observations.
  //
  // The safest identity is:
  //
  // source/platform + observation ID
  //
  // ============================================================

  const uniqueSightings = useMemo(() => {
    const seen = new Set();
    const unique = [];

    for (const sighting of sightings) {
      const source =
        sighting.source?.platform ||
        sighting.source?.name ||
        sighting.source?.type ||
        "unknown";

      const observationId =
        sighting.source?.observationId ??
        sighting.observation?.observationId ??
        sighting.id;

      /*
       * If we have a real observation ID, use it.
       *
       * This prevents:
       * iNaturalist observation 123
       * from being confused with
       * GBIF observation 123
       */

      if (
        observationId !== undefined &&
        observationId !== null
      ) {
        const key = `${source}-${observationId}`;

        if (seen.has(key)) {
          continue;
        }

        seen.add(key);
      } else {
        /*
         * Very rare fallback for records without an ID.
         * We use a combination of species + date + location
         * rather than deleting them just because the image
         * happens to be the same.
         */

        const fallbackKey = [
          source,
          sighting.species?.scientificName || "",
          sighting.observation?.date || "",
          sighting.location?.name || "",
          sighting.location?.latitude || "",
          sighting.location?.longitude || "",
        ].join("|");

        if (seen.has(fallbackKey)) {
          continue;
        }

        seen.add(fallbackKey);
      }

      unique.push(sighting);
    }

    return unique;
  }, [sightings]);

  // ============================================================
  // UNIQUE LOCATION COUNT
  //
  // A sighting and a location are NOT the same thing.
  //
  // Example:
  // 206 observations can exist at 153 different locations.
  //
  // This value can also be passed to the map.
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
        /*
         * Round slightly so extremely small coordinate
         * differences do not create unnecessary locations.
         */
        const lat = Number(latitude).toFixed(4);
        const lng = Number(longitude).toFixed(4);

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
        sighting.species?.commonName?.trim() ||
        "Unknown Kingfisher";

      const scientificName =
        sighting.species?.scientificName?.trim() ||
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
        // ------------------------------------------------------
        // SPECIES
        // ------------------------------------------------------

        const commonName =
          sighting.species?.commonName?.trim() ||
          "";

        const scientificName =
          sighting.species?.scientificName?.trim() ||
          "";

        const speciesKey =
          `${commonName}||${scientificName}`;

        // ------------------------------------------------------
        // LOCATION
        // ------------------------------------------------------

        const locationName =
          sighting.location?.name?.trim() ||
          "";

        const city =
          sighting.location?.city?.trim() ||
          "";

        const state =
          sighting.location?.state?.trim() ||
          "";

        // ------------------------------------------------------
        // SEARCH
        // ------------------------------------------------------

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

        // ------------------------------------------------------
        // SPECIES FILTER
        // ------------------------------------------------------

        const matchesSpecies =
          speciesFilter === "all" ||
          speciesKey === speciesFilter;

        // ------------------------------------------------------
        // DATE FILTER
        // ------------------------------------------------------

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

        // ------------------------------------------------------
        // RESEARCH GRADE
        // ------------------------------------------------------

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
  // IMAGE URL
  //
  // Prefer originalUrl.
  // Then use url.
  // ============================================================

  const getImageUrl = (sighting) => {
    const media =
      sighting.media?.[0];

    if (!media) {
      return null;
    }

    return (
      media.originalUrl ||
      media.url ||
      null
    );
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
          Discover recent real-world kingfisher
          observations around Bengaluru and narrow
          them down to the sightings you want.
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
              Fetching current data from iNaturalist.
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
              locationCount={uniqueLocationCount}
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
                    Browse the observations matching
                    your filters.
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

                /* ==================================================
                    CARDS
                ================================================== */

                <div className="sightings-grid">

                  {filteredSightings
                    .slice(0, 30)
                    .map((sighting) => {

                      const imageUrl =
                        getImageUrl(
                          sighting
                        );

                      /*
                       * IMPORTANT:
                       * React key must include the source.
                       *
                       * Example:
                       *
                       * iNaturalist-123
                       * GBIF-123
                       *
                       * These are NOT necessarily the same
                       * observation.
                       */

                      const source =
                        sighting.source
                          ?.platform ||
                        sighting.source
                          ?.name ||
                        sighting.source
                          ?.type ||
                        "unknown";

                      const observationId =
                        sighting.source
                          ?.observationId ??
                        sighting.observation
                          ?.observationId ??
                        sighting.id;

                      const cardKey =
                        `${source}-${observationId}`;

                      return (
                        <article
                          className="sighting-card"
                          key={cardKey}
                        >

                          {/* ==================================================
                              IMAGE
                          ================================================== */}

                          {imageUrl && (

                            <img
                              src={imageUrl}
                              alt={
                                sighting.species
                                  ?.commonName ||
                                "Kingfisher observation"
                              }
                              className="sighting-image"
                              loading="lazy"
                              decoding="async"
                              onError={(event) => {

                                const fallback =
                                  sighting.media?.[0]
                                    ?.url;

                                if (
                                  fallback &&
                                  event.currentTarget
                                    .src !== fallback
                                ) {
                                  event.currentTarget.src =
                                    fallback;
                                } else {
                                  event.currentTarget
                                    .style.display =
                                    "none";
                                }
                              }}
                            />

                          )}

                          {/* ==================================================
                              CARD BODY
                          ================================================== */}

                          <div className="sighting-body">

                            {/* SPECIES */}

                            <p className="sighting-species">

                              {sighting.species
                                ?.commonName ||
                                "Unknown Kingfisher"}

                            </p>

                            {/* SCIENTIFIC NAME */}

                            <p className="scientific-name">

                              {sighting.species
                                ?.scientificName ||
                                "Scientific name unavailable"}

                            </p>

                            {/* LOCATION */}

                            <div className="sighting-details">

                              <span>
                                📍{" "}
                                {sighting.location
                                  ?.name ||
                                  "Bengaluru"}
                              </span>

                              {/* DATE */}

                              <span>
                                📅{" "}
                                {sighting.observation
                                  ?.date ||
                                  "Date unavailable"}
                              </span>

                              {/* RESEARCH GRADE */}

                              {sighting.verification
                                ?.isResearchGrade && (

                                <span className="research-card-badge">
                                  ✓ Research Grade
                                </span>

                              )}

                            </div>

                            {/* ORIGINAL OBSERVATION */}

                            {sighting.source?.url && (

                              <a
                                href={
                                  sighting.source.url
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="source-link"
                              >
                                View original
                                observation →
                              </a>

                            )}

                          </div>

                        </article>
                      );
                    })}

                </div>

              )}

              {/* ==================================================
                  RESULTS NOTE
              ================================================== */}

              {filteredSightings.length > 30 && (

                <p className="results-note">

                  Showing the first 30 matching
                  observations. The map continues to
                  show all matching locations.

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