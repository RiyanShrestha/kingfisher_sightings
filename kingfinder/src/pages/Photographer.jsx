import {
  ArrowRight,
  Bird,
  Camera,
  CheckCircle2,
  Clock3,
  Image as ImageIcon,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Star,
  Target,
} from "lucide-react";

import PageContainer from "../components/PageContainer";
import { getGoogleMapsUrl } from "../utils/sightingHelpers";
import {
  formatDate,
  getObservationDate,
  getSpeciesName,
} from "./photographer/helpers";
import { usePhotographerData } from "./photographer/usePhotographerData";
import "./photographer/photographerStyles.css";

// ============================================================
// PHOTOGRAPHER PAGE
// ============================================================

function Photographer() {
  const {
    uniqueSightings,
    loading,
    error,
    selectedSpecies,
    setSelectedSpecies,
    isSpecificSpecies,
    selectedSpeciesInfo,
    rankedLocations,
    topRecommendation,
    stats,
    speciesSummary,
    refetch,
  } = usePhotographerData();

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <PageContainer>
        <div className="photographer-page">
          <section className="page-header">
            <p className="eyebrow">PHOTOGRAPHY</p>
            <h1>Photographer Mode</h1>
            <p>Building your real-world kingfisher photography guide.</p>
          </section>

          <div className="status-card">
            <Camera size={30} />
            <h2>Analyzing sightings...</h2>
            <p>KingFinder is processing the latest observation data.</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {
    return (
      <PageContainer>
        <div className="photographer-page">
          <section className="page-header">
            <p className="eyebrow">PHOTOGRAPHY</p>
            <h1>Photographer Mode</h1>
            <p>Your photography assistant could not load the latest data.</p>
          </section>

          <div className="status-card error">
            <Camera size={30} />
            <h2>Unable to load recommendations</h2>
            <p>{error}</p>
            <button
              type="button"
              className="primary-button"
              onClick={refetch}
            >
              <RefreshCw size={17} />
              Try Again
            </button>
          </div>
        </div>
      </PageContainer>
    );
  }

  // ==========================================================
  // EMPTY DATA
  // ==========================================================

  if (uniqueSightings.length === 0) {
    return (
      <PageContainer>
        <div className="photographer-page">
          <section className="page-header">
            <p className="eyebrow">PHOTOGRAPHY</p>
            <h1>Photographer Mode</h1>
          </section>

          <div className="status-card">
            <Bird size={30} />
            <h2>No sightings available</h2>
            <p>
              There is not enough real observation data to generate
              photography recommendations.
            </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  // ==========================================================
  // MAIN PAGE
  // ==========================================================

  return (
    <PageContainer>
      <div className="photographer-page">
        {/* ====================================================
            PAGE HEADER
        ==================================================== */}

        <section className="page-header">
          <p className="eyebrow">PHOTOGRAPHY</p>
          <h1>Photographer Mode</h1>
          <p>
            Find the strongest real-world kingfisher photography opportunities
            around Bengaluru.
          </p>
        </section>

        {/* ====================================================
            HERO
        ==================================================== */}

        <section className="photographer-hero">
          <div className="photographer-hero-main">
            <div className="photographer-eyebrow">
              <Camera size={14} />
              KINGFINDER PHOTOGRAPHY ASSISTANT
            </div>

            <h2>
              Know where to go before you pack your camera.
            </h2>

            <p>
              KingFinder analyzes real kingfisher observations and ranks
              locations using activity, photographic evidence, recent
              sightings, and species diversity when comparing all kingfishers.
            </p>

            <div className="hero-data-note">
              <ShieldCheck size={17} />
              Recommendations are generated from real observation data — not
              invented locations.
            </div>
          </div>

          <div className="photographer-hero-side">
            <div>
              <div className="hero-score-label">CURRENT TOP LOCATION</div>

              <div className="hero-score-number">
                {topRecommendation?.score || 0}
                <span>/100</span>
              </div>

              <div className="hero-score-caption">
                {isSpecificSpecies
                  ? `Photography score for ${
                      selectedSpeciesInfo?.commonName || "the selected species"
                    }.`
                  : "Photography score for the strongest location in the current dataset."}
              </div>
            </div>

            {topRecommendation && (
              <div className="hero-data-note">
                <MapPin size={16} />
                {topRecommendation.locationName}
              </div>
            )}
          </div>
        </section>

        {/* ====================================================
            STATS
        ==================================================== */}

        <section className="photographer-stats">
          <div className="photographer-stat">
            <span className="photographer-stat-number">
              {stats.observations}
            </span>
            <span className="photographer-stat-label">observations</span>
          </div>

          <div className="photographer-stat">
            <span className="photographer-stat-number">
              {stats.locations}
            </span>
            <span className="photographer-stat-label">photography spots</span>
          </div>

          <div className="photographer-stat">
            <span className="photographer-stat-number">
              {stats.species}
            </span>
            <span className="photographer-stat-label">species</span>
          </div>

          <div className="photographer-stat">
            <span className="photographer-stat-number">
              {stats.photographed}
            </span>
            <span className="photographer-stat-label">
              photographed observations
            </span>
          </div>
        </section>

        {/* ====================================================
            SPECIES SELECTOR
        ==================================================== */}

        <section className="photographer-section">
          <div className="photographer-section-header">
            <div>
              <div className="photographer-eyebrow">
                <Target size={14} />
                TARGET SPECIES
              </div>

              <h2>What do you want to photograph?</h2>

              <p>
                Choose a species to make the location recommendations more
                specific.
              </p>
            </div>
          </div>

          <div className="photographer-selector">
            <label
              htmlFor="photographer-species"
              className="selector-label"
            >
              Kingfisher species
            </label>

            <div className="selector-row">
              <select
                id="photographer-species"
                className="photographer-select"
                value={selectedSpecies}
                onChange={(event) =>
                  setSelectedSpecies(event.target.value)
                }
              >
                <option value="all">All Kingfishers</option>

                {speciesSummary.map((species) => (
                  <option key={species.key} value={species.key}>
                    {species.commonName}
                    {" — "}
                    {species.scientificName}
                  </option>
                ))}
              </select>

              {selectedSpecies !== "all" && (
                <button
                  type="button"
                  className="clear-species"
                  onClick={() => setSelectedSpecies("all")}
                >
                  Show all species
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ====================================================
            BEST OPPORTUNITY
        ==================================================== */}

        {topRecommendation && (
          <section className="photographer-section">
            <div className="photographer-section-header">
              <div>
                <div className="photographer-eyebrow">
                  <Star size={14} />
                  TOP PHOTOGRAPHY OPPORTUNITY
                </div>

                <h2>Start here</h2>

                <p>
                  {isSpecificSpecies
                    ? `The strongest location for ${
                        selectedSpeciesInfo?.commonName ||
                        "the selected species"
                      } based on the current observation data.`
                    : "The strongest location based on the current observation data."}
                </p>
              </div>
            </div>

            <article className="recommendation-card">
              <div className="recommendation-top">
                <div>
                  <div className="recommendation-badge">
                    <CheckCircle2 size={14} />
                    BEST OVERALL
                  </div>

                  <h3>{topRecommendation.locationName}</h3>

                  <div className="recommendation-location">
                    <MapPin size={15} />
                    Bengaluru, Karnataka
                  </div>
                </div>

                <div className="recommendation-score">
                  <small>PHOTOGRAPHY SCORE</small>
                  <strong>
                    {topRecommendation.score}
                    <span>/100</span>
                  </strong>
                </div>
              </div>

              <p className="recommendation-description">
                {isSpecificSpecies
                  ? `This location ranks highest for ${
                      selectedSpeciesInfo?.commonName ||
                      "the selected species"
                    } because it combines strong observation activity, photographic evidence, and recent activity in the current dataset.`
                  : "This location has the strongest combination of observation activity, species diversity, photographic evidence, and recent activity in the current dataset."}
              </p>

              <div className="recommendation-metrics">
                <div className="recommendation-metric">
                  <Bird size={18} />
                  <strong>
                    {topRecommendation.sightings.length}
                  </strong>
                  <span>
                    {isSpecificSpecies
                      ? "target observations"
                      : "observations"}
                  </span>
                </div>

                <div className="recommendation-metric">
                  <Bird size={18} />
                  <strong>
                    {topRecommendation.species.length}
                  </strong>
                  <span>species</span>
                </div>

                <div className="recommendation-metric">
                  <ImageIcon size={18} />
                  <strong>
                    {topRecommendation.imageSightings}
                  </strong>
                  <span>photo records</span>
                </div>

                <div className="recommendation-metric">
                  <ShieldCheck size={18} />
                  <strong>
                    {topRecommendation.researchGrade}
                  </strong>
                  <span>research grade</span>
                </div>
              </div>

              {/* ==================================================
                  SCORE BREAKDOWN
              ================================================== */}

              <div className="score-breakdown">
                <div className="score-breakdown-title">
                  WHY THIS LOCATION SCORED {topRecommendation.score}/100
                </div>

                {/* OBSERVATION */}
                <div className="score-row">
                  <span className="score-row-label">
                    {isSpecificSpecies
                      ? "Target observations"
                      : "Observation activity"}
                  </span>

                  <div className="score-bar">
                    <div
                      className="score-bar-fill"
                      style={{
                        width: `${
                          topRecommendation.scoreBreakdown.observationMax > 0
                            ? (topRecommendation.scoreBreakdown
                                .observationScore /
                                topRecommendation.scoreBreakdown
                                  .observationMax) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>

                  <span className="score-row-value">
                    +{topRecommendation.scoreBreakdown.observationScore}
                  </span>
                </div>

                {/* DIVERSITY — ONLY ALL SPECIES */}
                {!isSpecificSpecies && (
                  <div className="score-row">
                    <span className="score-row-label">
                      Species diversity
                    </span>

                    <div className="score-bar">
                      <div
                        className="score-bar-fill"
                        style={{
                          width: `${
                            (topRecommendation.scoreBreakdown.diversityScore /
                              20) *
                            100
                          }%`,
                        }}
                      />
                    </div>

                    <span className="score-row-value">
                      +{topRecommendation.scoreBreakdown.diversityScore}
                    </span>
                  </div>
                )}

                {/* PHOTO */}
                <div className="score-row">
                  <span className="score-row-label">
                    Photographic evidence
                  </span>

                  <div className="score-bar">
                    <div
                      className="score-bar-fill"
                      style={{
                        width: `${
                          topRecommendation.scoreBreakdown.photoMax > 0
                            ? (topRecommendation.scoreBreakdown.photoScore /
                                topRecommendation.scoreBreakdown.photoMax) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>

                  <span className="score-row-value">
                    +{topRecommendation.scoreBreakdown.photoScore}
                  </span>
                </div>

                {/* RECENT ACTIVITY */}
                <div className="score-row">
                  <span className="score-row-label">
                    Recent activity
                  </span>

                  <div className="score-bar">
                    <div
                      className="score-bar-fill"
                      style={{
                        width: `${
                          topRecommendation.scoreBreakdown.recentActivityMax > 0
                            ? (topRecommendation.scoreBreakdown
                                .recentActivityScore /
                                topRecommendation.scoreBreakdown
                                  .recentActivityMax) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>

                  <span className="score-row-value">
                    +{topRecommendation.scoreBreakdown.recentActivityScore}
                  </span>
                </div>
              </div>

              {/* ==================================================
                  ACTION
              ================================================== */}

              <div className="recommendation-actions">
                <a
                  href={getGoogleMapsUrl(
                    topRecommendation.latitude,
                    topRecommendation.longitude
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="photographer-primary-button"
                >
                  <MapPin size={16} />
                  Open in Google Maps
                  <ArrowRight size={16} />
                </a>
              </div>
            </article>
          </section>
        )}

        {/* ====================================================
            RECENT ACTIVITY
        ==================================================== */}

        {topRecommendation && (
          <section className="photographer-section">
            <div className="photographer-section-header">
              <div>
                <div className="photographer-eyebrow">
                  <Clock3 size={14} />
                  RECENT ACTIVITY
                </div>

                <h2>How active is this spot?</h2>

                <p>
                  Actual observations recorded recently at the recommended
                  location.
                </p>
              </div>
            </div>

            <div className="activity-card">
              <strong>{topRecommendation.locationName}</strong>

              <div className="activity-grid">
                <div className="activity-item">
                  <strong>{topRecommendation.activity.last7}</strong>
                  <span>observations in last 7 days</span>
                </div>

                <div className="activity-item">
                  <strong>{topRecommendation.activity.last30}</strong>
                  <span>observations in last 30 days</span>
                </div>

                <div className="activity-item">
                  <strong>{topRecommendation.activity.last90}</strong>
                  <span>observations in last 90 days</span>
                </div>
              </div>

              <p className="photographer-note">
                Recent activity is based only on observations present in the
                current KingFinder dataset. It does not guarantee that a bird
                will be present when you visit.
              </p>
            </div>
          </section>
        )}

        {/* ====================================================
            BEST LOCATIONS
        ==================================================== */}

        <section className="photographer-section">
          <div className="photographer-section-header">
            <div>
              <div className="photographer-eyebrow">
                <MapPin size={14} />
                LOCATION RANKING
              </div>

              <h2>Best Photography Spots</h2>

              <p>
                {isSpecificSpecies
                  ? `Ranked locations for ${
                      selectedSpeciesInfo?.commonName || "the selected species"
                    } using the current observation data.`
                  : "Ranked from the strongest to weaker photography opportunities in the current dataset."}
              </p>
            </div>
          </div>

          {rankedLocations.length === 0 ? (
            <div className="status-card">
              <MapPin size={30} />
              <h2>No mapped locations</h2>
              <p>
                The selected species does not currently have usable
                coordinates.
              </p>
            </div>
          ) : (
            <div className="location-grid">
              {rankedLocations.slice(0, 9).map((location, index) => {
                const latest = location.latestSighting;
                const image =
                  latest?.primaryImageUrl ||
                  latest?.media?.[0]?.url ||
                  latest?.media?.[0]?.originalUrl ||
                  null;

                return (
                  <article className="location-card" key={location.key}>
                    {image ? (
                      <img
                        src={image}
                        alt={getSpeciesName(latest)}
                        className="location-image"
                        loading="lazy"
                        decoding="async"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="location-placeholder">
                        <Camera size={32} />
                      </div>
                    )}

                    <div className="location-card-body">
                      <div className="location-rank">
                        <span className="location-rank-number">
                          #{index + 1}
                        </span>

                        <span className="location-score-pill">
                          <Star size={12} />
                          {location.score}/100
                        </span>
                      </div>

                      <h3>{location.locationName}</h3>

                      <p className="location-species">
                        {location.species
                          .slice(0, 4)
                          .map((species) => species.commonName)
                          .join(" · ")}
                      </p>

                      <div className="location-metrics">
                        <div className="location-metric">
                          <strong>{location.sightings.length}</strong>
                          <span>
                            {isSpecificSpecies
                              ? "target sightings"
                              : "sightings"}
                          </span>
                        </div>

                        <div className="location-metric">
                          <strong>{location.imageSightings}</strong>
                          <span>photo records</span>
                        </div>

                        <div className="location-metric">
                          <strong>{location.species.length}</strong>
                          <span>species</span>
                        </div>

                        <div className="location-metric">
                          <strong>{location.researchGrade}</strong>
                          <span>research grade</span>
                        </div>
                      </div>

                      <div className="location-latest">
                        <Clock3 size={14} />
                        Latest:{" "}
                        {formatDate(
                          getObservationDate(latest)
                        )}
                      </div>

                      <a
                        href={getGoogleMapsUrl(
                          location.latitude,
                          location.longitude
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="location-link"
                      >
                        Open location
                        <ArrowRight size={14} />
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* ====================================================
            SPECIES GUIDE
        ==================================================== */}

        <section className="photographer-section">
          <div className="photographer-section-header">
            <div>
              <div className="photographer-eyebrow">
                <Bird size={14} />
                SPECIES GUIDE
              </div>

              <h2>Target Kingfishers</h2>

              <p>
                Species currently represented in the real KingFinder dataset.
              </p>
            </div>
          </div>

          <div className="species-grid">
            {speciesSummary.slice(0, 8).map((species) => (
              <article className="species-card" key={species.key}>
                <div className="species-icon">
                  <Bird size={20} />
                </div>

                <h3>{species.commonName}</h3>

                <p className="species-scientific">
                  {species.scientificName}
                </p>

                <div className="species-stat-list">
                  <div className="species-stat">
                    <span>Observations</span>
                    <strong>{species.count}</strong>
                  </div>

                  <div className="species-stat">
                    <span>Locations</span>
                    <strong>{species.locationCount}</strong>
                  </div>

                  <div className="species-stat">
                    <span>Photo records</span>
                    <strong>{species.photographed}</strong>
                  </div>

                  <div className="species-stat">
                    <span>Research grade</span>
                    <strong>{species.researchGrade}</strong>
                  </div>

                  <div className="species-stat">
                    <span>Latest</span>
                    <strong>{formatDate(species.latestDate)}</strong>
                  </div>
                </div>

                <button
                  type="button"
                  className="species-select-button"
                  onClick={() => setSelectedSpecies(species.key)}
                >
                  Find photography spots
                </button>
              </article>
            ))}
          </div>
        </section>

        {/* ====================================================
            METHODOLOGY
        ==================================================== */}

        <section className="methodology-card">
          <div className="photographer-eyebrow">
            <ShieldCheck size={14} />
            HOW KINGFINDER RANKS LOCATIONS
          </div>

          <h2>Photography Score</h2>

          <p>
            {isSpecificSpecies
              ? `When targeting ${
                  selectedSpeciesInfo?.commonName || "a specific species"
                }, the score focuses on target-species observations, photographic evidence, and recent activity.`
              : "When comparing all kingfishers, the score considers observation activity, species diversity, photographic evidence, and recent activity."}
          </p>

          <div className="methodology-grid">
            <div className="methodology-item">
              <Bird size={17} />
              <span>
                <strong>35 points</strong>
                <br />
                {isSpecificSpecies
                  ? "Target species observations"
                  : "Observation activity"}
              </span>
            </div>

            {!isSpecificSpecies && (
              <div className="methodology-item">
                <Star size={17} />
                <span>
                  <strong>20 points</strong>
                  <br />
                  Species diversity
                </span>
              </div>
            )}

            <div className="methodology-item">
              <ImageIcon size={17} />
              <span>
                <strong>
                  {isSpecificSpecies ? "25 points" : "20 points"}
                </strong>
                <br />
                Photographic evidence
              </span>
            </div>

            <div className="methodology-item">
              <Clock3 size={17} />
              <span>
                <strong>
                  {isSpecificSpecies ? "40 points" : "25 points"}
                </strong>
                <br />
                Recent activity
              </span>
            </div>
          </div>

          <p className="photographer-note">
            Score components are relative to the strongest locations in the
            current dataset. As new observations arrive, rankings can change.
          </p>
        </section>
      </div>
    </PageContainer>
  );
}

export default Photographer;