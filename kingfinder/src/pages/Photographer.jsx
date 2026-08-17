import { useEffect, useMemo, useState } from "react";
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

const API_URL =
  "http://localhost:5000/api/sightings";

const LOCATION_PRECISION = 3;

// ============================================================
// HELPERS
// ============================================================

function getLocationKey(sighting) {
  const latitude = Number(
    sighting.location?.latitude
  );

  const longitude = Number(
    sighting.location?.longitude
  );

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  return `${latitude.toFixed(
    LOCATION_PRECISION
  )},${longitude.toFixed(
    LOCATION_PRECISION
  )}`;
}

function getLocationName(sightings) {
  const names = sightings
    .map(
      (sighting) =>
        sighting.location?.name?.trim()
    )
    .filter(Boolean);

  if (names.length === 0) {
    return "Bengaluru";
  }

  const counts = new Map();

  names.forEach((name) => {
    const key = name.toLowerCase();

    counts.set(
      key,
      (counts.get(key) || 0) + 1
    );
  });

  let bestName = names[0];
  let bestCount = 0;

  names.forEach((name) => {
    const count =
      counts.get(
        name.toLowerCase()
      ) || 0;

    if (count > bestCount) {
      bestCount = count;
      bestName = name;
    }
  });

  return bestName;
}

function getSpeciesKey(sighting) {
  const scientificName =
    sighting.species
      ?.scientificName
      ?.trim();

  const commonName =
    sighting.species
      ?.commonName
      ?.trim();

  if (scientificName) {
    return scientificName;
  }

  if (commonName) {
    return commonName;
  }

  return "unknown";
}

function getSpeciesName(sighting) {
  return (
    sighting.species?.commonName ||
    "Unknown Kingfisher"
  );
}

function getScientificName(sighting) {
  return (
    sighting.species?.scientificName ||
    "Scientific name unavailable"
  );
}

function getObservationDate(sighting) {
  const value =
    sighting.observation?.date;

  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
}

function getImageCount(sighting) {
  if (
    Number.isFinite(
      Number(
        sighting.imageCount
      )
    )
  ) {
    return Number(
      sighting.imageCount
    );
  }

  if (
    Array.isArray(
      sighting.media
    )
  ) {
    return sighting.media.length;
  }

  return sighting.primaryImageUrl
    ? 1
    : 0;
}

function hasImage(sighting) {
  return (
    Boolean(
      sighting.primaryImageUrl
    ) ||
    getImageCount(
      sighting
    ) > 0
  );
}

function getGoogleMapsUrl(
  latitude,
  longitude
) {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

function formatDate(date) {
  if (!date) {
    return "Date unavailable";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function getDaysSince(date) {
  if (!date) {
    return Infinity;
  }

  const now = new Date();

  return Math.max(
    0,
    Math.floor(
      (
        now.getTime() -
        date.getTime()
      ) /
        (1000 * 60 * 60 * 24)
    )
  );
}

function getActivityCounts(
  sightings
) {
  const counts = {
    last7: 0,
    last30: 0,
    last90: 0,
  };

  sightings.forEach(
    (sighting) => {
      const date =
        getObservationDate(
          sighting
        );

      const days =
        getDaysSince(date);

      if (days <= 7) {
        counts.last7 += 1;
      }

      if (days <= 30) {
        counts.last30 += 1;
      }

      if (days <= 90) {
        counts.last90 += 1;
      }
    }
  );

  return counts;
}

function getActivityValue(activity) {
  return (
    activity.last7 * 1 +
    activity.last30 * 0.6 +
    activity.last90 * 0.25
  );
}

function getLatestSighting(
  sightings
) {
  return (
    [...sightings].sort(
      (a, b) => {
        const dateA =
          getObservationDate(
            a
          );

        const dateB =
          getObservationDate(
            b
          );

        return (
          (dateB?.getTime() ||
            0) -
          (dateA?.getTime() ||
            0)
        );
      }
    )[0] || null
  );
}

// ============================================================
// SCORE CALCULATION
// ============================================================

/*
  ALL KINGFISHERS

  35 = observation activity
  20 = species diversity
  20 = photographic evidence
  25 = recent activity

  SPECIFIC TARGET SPECIES

  35 = target species observations
  25 = photographic evidence
  40 = recent activity

  When a photographer chooses one species,
  species diversity is intentionally removed
  because every location is already being
  evaluated only for that target species.
*/

function calculateLocationScore(
  location,
  maximums,
  isSpecificSpecies
) {
  if (isSpecificSpecies) {
    const observationScore =
      maximums.maxSightings > 0
        ? (
            location.sightings
              .length /
            maximums.maxSightings
          ) * 35
        : 0;

    const photoScore =
      maximums.maxImages > 0
        ? (
            location.imageSightings /
            maximums.maxImages
          ) * 25
        : 0;

    const activityValue =
      getActivityValue(
        location.activity
      );

    const recentActivityScore =
      maximums.maxActivity > 0
        ? (
            activityValue /
            maximums.maxActivity
          ) * 40
        : 0;

    return {
      total: Math.min(
        100,
        Math.round(
          observationScore +
            photoScore +
            recentActivityScore
        )
      ),

      observationScore:
        Math.round(
          observationScore
        ),

      observationMax: 35,

      diversityScore: 0,

      diversityMax: 0,

      photoScore:
        Math.round(
          photoScore
        ),

      photoMax: 25,

      recentActivityScore:
        Math.round(
          recentActivityScore
        ),

      recentActivityMax: 40,

      isSpecificSpecies: true,
    };
  }

  const observationScore =
    maximums.maxSightings > 0
      ? (
          location.sightings
            .length /
          maximums.maxSightings
        ) * 35
      : 0;

  const diversityScore =
    maximums.maxSpecies > 0
      ? (
          location.speciesKeys
            .size /
          maximums.maxSpecies
        ) * 20
      : 0;

  const photoScore =
    maximums.maxImages > 0
      ? (
          location.imageSightings /
          maximums.maxImages
        ) * 20
      : 0;

  const activityValue =
    getActivityValue(
      location.activity
    );

  const recentActivityScore =
    maximums.maxActivity > 0
      ? (
          activityValue /
          maximums.maxActivity
        ) * 25
      : 0;

  return {
    total: Math.min(
      100,
      Math.round(
        observationScore +
          diversityScore +
          photoScore +
          recentActivityScore
      )
    ),

    observationScore:
      Math.round(
        observationScore
      ),

    observationMax: 35,

    diversityScore:
      Math.round(
        diversityScore
      ),

    diversityMax: 20,

    photoScore:
      Math.round(
        photoScore
      ),

    photoMax: 20,

    recentActivityScore:
      Math.round(
        recentActivityScore
      ),

    recentActivityMax: 25,

    isSpecificSpecies: false,
  };
}

// ============================================================
// PAGE STYLES
// ============================================================

const photographerStyles = `
  .photographer-page {
    padding-bottom: 80px;
  }

  .photographer-hero {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.6fr);
    gap: 24px;
    margin-top: 12px;
    margin-bottom: 28px;
  }

  .photographer-hero-main,
  .photographer-hero-side {
    background: #ffffff;
    border: 1px solid rgba(17, 62, 50, 0.12);
    border-radius: 24px;
    box-shadow: 0 14px 35px rgba(17, 62, 50, 0.07);
  }

  .photographer-hero-main {
    padding: 36px;
    background:
      radial-gradient(
        circle at 85% 15%,
        rgba(18, 82, 65, 0.09),
        transparent 30%
      ),
      #ffffff;
  }

  .photographer-hero-side {
    padding: 28px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .photographer-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.16em;
    color: #16624d;
    margin-bottom: 14px;
  }

  .photographer-hero-main h2 {
    margin: 0 0 12px;
    font-size: clamp(32px, 4vw, 52px);
    line-height: 1.02;
    color: #103f32;
    letter-spacing: -0.04em;
  }

  .photographer-hero-main p {
    max-width: 680px;
    margin: 0;
    color: #64736e;
    font-size: 16px;
    line-height: 1.7;
  }

  .hero-data-note {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 22px;
    padding-top: 18px;
    border-top: 1px solid rgba(17, 62, 50, 0.1);
    color: #315b4f;
    font-size: 13px;
  }

  .hero-data-note svg {
    flex: 0 0 auto;
  }

  .hero-score-label {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.15em;
    color: #73817d;
  }

  .hero-score-number {
    margin-top: 8px;
    font-size: 58px;
    line-height: 1;
    font-weight: 800;
    letter-spacing: -0.05em;
    color: #0e4636;
  }

  .hero-score-number span {
    font-size: 18px;
    color: #73817d;
    letter-spacing: 0;
  }

  .hero-score-caption {
    margin-top: 8px;
    color: #64736e;
    font-size: 13px;
    line-height: 1.5;
  }

  .photographer-stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 34px;
  }

  .photographer-stat {
    background: #ffffff;
    border: 1px solid rgba(17, 62, 50, 0.1);
    border-radius: 18px;
    padding: 20px;
  }

  .photographer-stat-number {
    display: block;
    color: #0e4636;
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.03em;
  }

  .photographer-stat-label {
    display: block;
    margin-top: 4px;
    color: #74817d;
    font-size: 12px;
  }

  .photographer-section {
    margin-top: 42px;
  }

  .photographer-section-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 18px;
  }

  .photographer-section-header h2 {
    margin: 0;
    color: #103f32;
  }

  .photographer-section-header p {
    margin: 6px 0 0;
    color: #71807b;
  }

  .photographer-selector {
    background: #ffffff;
    border: 1px solid rgba(17, 62, 50, 0.12);
    border-radius: 22px;
    padding: 24px;
    box-shadow: 0 12px 30px rgba(17, 62, 50, 0.05);
  }

  .selector-label {
    display: block;
    margin-bottom: 9px;
    color: #37594f;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.04em;
  }

  .selector-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .photographer-select {
    width: 100%;
    max-width: 620px;
    min-height: 48px;
    border: 1px solid rgba(17, 62, 50, 0.18);
    border-radius: 12px;
    padding: 0 14px;
    background: #ffffff;
    color: #183f35;
    font-size: 14px;
    outline: none;
  }

  .photographer-select:focus {
    border-color: #17644f;
    box-shadow: 0 0 0 3px rgba(23, 100, 79, 0.1);
  }

  .clear-species {
    border: 0;
    background: transparent;
    color: #17644f;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
  }

  .recommendation-card {
    position: relative;
    overflow: hidden;
    background:
      radial-gradient(
        circle at 92% 15%,
        rgba(255,255,255,0.16),
        transparent 26%
      ),
      #103f32;
    color: #ffffff;
    border-radius: 26px;
    padding: 34px;
    box-shadow: 0 18px 45px rgba(16, 63, 50, 0.18);
  }

  .recommendation-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
  }

  .recommendation-badge {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.15em;
    color: rgba(255,255,255,0.72);
  }

  .recommendation-card h3 {
    margin: 10px 0 5px;
    color: #ffffff;
    font-size: clamp(26px, 3vw, 38px);
    letter-spacing: -0.035em;
  }

  .recommendation-location {
    display: flex;
    align-items: center;
    gap: 7px;
    color: rgba(255,255,255,0.72);
    font-size: 14px;
  }

  .recommendation-score {
    min-width: 120px;
    text-align: right;
  }

  .recommendation-score small {
    display: block;
    color: rgba(255,255,255,0.62);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.14em;
  }

  .recommendation-score strong {
    display: block;
    margin-top: 2px;
    font-size: 50px;
    line-height: 1;
  }

  .recommendation-score span {
    font-size: 15px;
    color: rgba(255,255,255,0.55);
  }

  .recommendation-description {
    max-width: 760px;
    margin: 22px 0;
    color: rgba(255,255,255,0.78);
    line-height: 1.7;
  }

  .recommendation-metrics {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
    margin-top: 22px;
  }

  .recommendation-metric {
    padding: 15px;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 14px;
    background: rgba(255,255,255,0.06);
  }

  .recommendation-metric svg {
    opacity: 0.78;
  }

  .recommendation-metric strong {
    display: block;
    margin-top: 8px;
    font-size: 21px;
  }

  .recommendation-metric span {
    display: block;
    margin-top: 3px;
    color: rgba(255,255,255,0.58);
    font-size: 11px;
  }

  .recommendation-actions {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-top: 24px;
  }

  .photographer-primary-button {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    min-height: 46px;
    padding: 0 17px;
    border-radius: 12px;
    background: #ffffff;
    color: #103f32;
    text-decoration: none;
    font-weight: 800;
    font-size: 13px;
    transition: transform 0.2s ease;
  }

  .photographer-primary-button:hover {
    transform: translateY(-1px);
  }

  .score-breakdown {
    margin-top: 28px;
    padding-top: 24px;
    border-top: 1px solid rgba(255,255,255,0.12);
  }

  .score-breakdown-title {
    margin-bottom: 14px;
    color: rgba(255,255,255,0.7);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.12em;
  }

  .score-row {
    display: grid;
    grid-template-columns: 190px 1fr 40px;
    align-items: center;
    gap: 12px;
    margin-bottom: 11px;
  }

  .score-row-label {
    color: rgba(255,255,255,0.72);
    font-size: 12px;
  }

  .score-bar {
    height: 7px;
    overflow: hidden;
    border-radius: 99px;
    background: rgba(255,255,255,0.12);
  }

  .score-bar-fill {
    height: 100%;
    border-radius: inherit;
    background: #ffffff;
  }

  .score-row-value {
    text-align: right;
    color: #ffffff;
    font-size: 12px;
    font-weight: 800;
  }

  .location-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
  }

  .location-card {
    overflow: hidden;
    background: #ffffff;
    border: 1px solid rgba(17, 62, 50, 0.1);
    border-radius: 20px;
    box-shadow: 0 12px 28px rgba(17, 62, 50, 0.06);
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
  }

  .location-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 18px 34px rgba(17, 62, 50, 0.1);
  }

  .location-image {
    width: 100%;
    height: 190px;
    object-fit: cover;
    display: block;
    background: #edf2ef;
  }

  .location-placeholder {
    height: 190px;
    display: flex;
    align-items: center;
    justify-content: center;
    background:
      linear-gradient(
        135deg,
        #edf3ef,
        #dce8e2
      );
    color: #527267;
  }

  .location-card-body {
    padding: 20px;
  }

  .location-rank {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 12px;
  }

  .location-rank-number {
    color: #6d7b76;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.1em;
  }

  .location-score-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 9px;
    border-radius: 999px;
    background: #edf5f1;
    color: #17644f;
    font-size: 11px;
    font-weight: 800;
  }

  .location-card h3 {
    margin: 0;
    color: #103f32;
    font-size: 20px;
    line-height: 1.25;
  }

  .location-species {
    min-height: 40px;
    margin: 8px 0 15px;
    color: #75827e;
    font-size: 13px;
    line-height: 1.5;
  }

  .location-metrics {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .location-metric {
    padding: 10px;
    border-radius: 11px;
    background: #f6f8f6;
  }

  .location-metric strong {
    display: block;
    color: #194c3d;
    font-size: 16px;
  }

  .location-metric span {
    display: block;
    margin-top: 2px;
    color: #7a8581;
    font-size: 10px;
  }

  .location-latest {
    display: flex;
    align-items: center;
    gap: 7px;
    margin: 15px 0;
    color: #687671;
    font-size: 11px;
  }

  .location-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #17644f;
    font-size: 13px;
    font-weight: 800;
    text-decoration: none;
  }

  .species-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
  }

  .species-card {
    background: #ffffff;
    border: 1px solid rgba(17, 62, 50, 0.1);
    border-radius: 18px;
    padding: 20px;
    transition:
      transform 0.2s ease,
      border-color 0.2s ease;
  }

  .species-card:hover {
    transform: translateY(-2px);
    border-color: rgba(17, 62, 50, 0.2);
  }

  .species-icon {
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: #edf5f1;
    color: #17644f;
    margin-bottom: 14px;
  }

  .species-card h3 {
    margin: 0;
    color: #103f32;
    font-size: 17px;
    line-height: 1.25;
  }

  .species-scientific {
    margin: 5px 0 14px;
    color: #7b8783;
    font-size: 12px;
    font-style: italic;
  }

  .species-stat-list {
    display: grid;
    gap: 7px;
  }

  .species-stat {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    color: #6c7975;
    font-size: 12px;
  }

  .species-stat strong {
    color: #194c3d;
  }

  .species-select-button {
    width: 100%;
    margin-top: 15px;
    min-height: 38px;
    border: 1px solid rgba(17, 62, 50, 0.14);
    border-radius: 10px;
    background: #ffffff;
    color: #17644f;
    font-weight: 800;
    cursor: pointer;
  }

  .activity-card {
    background: #ffffff;
    border: 1px solid rgba(17, 62, 50, 0.1);
    border-radius: 22px;
    padding: 24px;
  }

  .activity-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-top: 18px;
  }

  .activity-item {
    padding: 16px;
    border-radius: 14px;
    background: #f6f8f6;
  }

  .activity-item strong {
    display: block;
    color: #103f32;
    font-size: 24px;
  }

  .activity-item span {
    display: block;
    margin-top: 4px;
    color: #77837f;
    font-size: 11px;
  }

  .methodology-card {
    margin-top: 42px;
    padding: 26px;
    background: #ffffff;
    border: 1px solid rgba(17, 62, 50, 0.1);
    border-radius: 22px;
  }

  .methodology-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-top: 20px;
  }

  .methodology-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 15px;
    border-radius: 13px;
    background: #f6f8f6;
    color: #49645b;
    font-size: 12px;
    line-height: 1.45;
  }

  .methodology-item svg {
    flex: 0 0 auto;
    color: #17644f;
  }

  .photographer-note {
    margin-top: 18px;
    color: #7a8581;
    font-size: 11px;
    line-height: 1.6;
  }

  @media (max-width: 1000px) {
    .photographer-hero {
      grid-template-columns: 1fr;
    }

    .location-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .species-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .methodology-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 720px) {
    .photographer-stats {
      grid-template-columns: repeat(2, 1fr);
    }

    .recommendation-top {
      flex-direction: column;
    }

    .recommendation-score {
      text-align: left;
    }

    .recommendation-metrics {
      grid-template-columns: repeat(2, 1fr);
    }

    .location-grid,
    .species-grid {
      grid-template-columns: 1fr;
    }

    .score-row {
      grid-template-columns: 125px 1fr 35px;
    }

    .activity-grid {
      grid-template-columns: 1fr;
    }

    .methodology-grid {
      grid-template-columns: 1fr;
    }

    .selector-row {
      align-items: stretch;
      flex-direction: column;
    }

    .clear-species {
      text-align: left;
    }
  }
`;

// ============================================================
// PHOTOGRAPHER PAGE
// ============================================================

function Photographer() {
  const [sightings, setSightings] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedSpecies, setSelectedSpecies] =
    useState("all");

  // ==========================================================
  // FETCH
  // ==========================================================

  const fetchSightings = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(API_URL);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch sightings: ${response.status}`
        );
      }

      const data =
        await response.json();

      if (
        !Array.isArray(
          data.sightings
        )
      ) {
        throw new Error(
          "Invalid sightings response."
        );
      }

      setSightings(
        data.sightings
      );
    } catch (err) {
      console.error(
        "KingFinder Photographer Mode error:",
        err
      );

      setError(
        "Unable to load real sighting data. Make sure the KingFinder backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSightings();
  }, []);

  // ==========================================================
  // UNIQUE SIGHTINGS
  // ==========================================================

  const uniqueSightings =
    useMemo(() => {
      const seen = new Set();
      const unique = [];

      sightings.forEach(
        (sighting) => {
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

          const key =
            `${source}-${observationId}`;

          if (
            seen.has(key)
          ) {
            return;
          }

          seen.add(key);
          unique.push(
            sighting
          );
        }
      );

      return unique;
    }, [sightings]);

  // ==========================================================
  // SPECIES SUMMARY
  // ==========================================================

  const speciesSummary =
    useMemo(() => {
      const speciesMap =
        new Map();

      uniqueSightings.forEach(
        (sighting) => {
          const key =
            getSpeciesKey(
              sighting
            );

          if (
            !speciesMap.has(
              key
            )
          ) {
            speciesMap.set(
              key,
              {
                key,
                commonName:
                  getSpeciesName(
                    sighting
                  ),
                scientificName:
                  getScientificName(
                    sighting
                  ),
                sightings: [],
              }
            );
          }

          speciesMap
            .get(key)
            .sightings.push(
              sighting
            );
        }
      );

      return Array.from(
        speciesMap.values()
      )
        .map(
          (species) => {
            const locations =
              new Set(
                species.sightings
                  .map(
                    getLocationKey
                  )
                  .filter(Boolean)
              );

            const photographed =
              species.sightings.filter(
                hasImage
              ).length;

            const researchGrade =
              species.sightings.filter(
                (sighting) =>
                  sighting
                    .verification
                    ?.isResearchGrade ===
                  true
              ).length;

            const latestDate =
              getObservationDate(
                getLatestSighting(
                  species.sightings
                )
              );

            return {
              ...species,
              count:
                species.sightings
                  .length,
              locationCount:
                locations.size,
              photographed,
              researchGrade,
              latestDate,
            };
          }
        )
        .sort(
          (a, b) =>
            b.count - a.count
        );
    }, [uniqueSightings]);

  // ==========================================================
  // FILTERED SIGHTINGS
  // ==========================================================

  const photographerSightings =
    useMemo(() => {
      if (
        selectedSpecies ===
        "all"
      ) {
        return uniqueSightings;
      }

      return uniqueSightings.filter(
        (sighting) =>
          getSpeciesKey(
            sighting
          ) === selectedSpecies
      );
    }, [
      uniqueSightings,
      selectedSpecies,
    ]);

  // ==========================================================
  // SPECIFIC SPECIES MODE
  // ==========================================================

  const isSpecificSpecies =
    selectedSpecies !== "all";

  const selectedSpeciesInfo =
    useMemo(() => {
      if (!isSpecificSpecies) {
        return null;
      }

      return (
        speciesSummary.find(
          (species) =>
            species.key ===
            selectedSpecies
        ) || null
      );
    }, [
      isSpecificSpecies,
      selectedSpecies,
      speciesSummary,
    ]);

  // ==========================================================
  // LOCATION GROUPING
  // ==========================================================

  const rankedLocations =
    useMemo(() => {
      const locationMap =
        new Map();

      photographerSightings.forEach(
        (sighting) => {
          const key =
            getLocationKey(
              sighting
            );

          if (!key) {
            return;
          }

          if (
            !locationMap.has(
              key
            )
          ) {
            locationMap.set(
              key,
              {
                key,

                latitude:
                  Number(
                    sighting
                      .location
                      ?.latitude
                  ),

                longitude:
                  Number(
                    sighting
                      .location
                      ?.longitude
                  ),

                sightings: [],

                speciesKeys:
                  new Set(),

                imageSightings: 0,

                researchGrade: 0,
              }
            );
          }

          const location =
            locationMap.get(
              key
            );

          location.sightings.push(
            sighting
          );

          location.speciesKeys.add(
            getSpeciesKey(
              sighting
            )
          );

          if (
            hasImage(
              sighting
            )
          ) {
            location.imageSightings +=
              1;
          }

          if (
            sighting
              .verification
              ?.isResearchGrade ===
            true
          ) {
            location.researchGrade +=
              1;
          }
        }
      );

      const locations =
        Array.from(
          locationMap.values()
        );

      locations.forEach(
        (location) => {
          location.activity =
            getActivityCounts(
              location.sightings
            );
        }
      );

      // --------------------------------------------------------
      // MAXIMUMS USED FOR RELATIVE SCORING
      // --------------------------------------------------------

      const maximums = {
        maxSightings:
          Math.max(
            0,
            ...locations.map(
              (location) =>
                location
                  .sightings
                  .length
            )
          ),

        maxSpecies:
          Math.max(
            0,
            ...locations.map(
              (location) =>
                location
                  .speciesKeys
                  .size
            )
          ),

        maxImages:
          Math.max(
            0,
            ...locations.map(
              (location) =>
                location
                  .imageSightings
            )
          ),

        maxActivity:
          Math.max(
            0,
            ...locations.map(
              (location) =>
                getActivityValue(
                  location.activity
                )
            )
          ),
      };

      // --------------------------------------------------------
      // SCORE + PREPARE LOCATIONS
      // --------------------------------------------------------

      return locations
        .map(
          (location) => {
            const sortedSightings =
              [
                ...location.sightings,
              ].sort(
                (a, b) => {
                  const dateA =
                    getObservationDate(
                      a
                    );

                  const dateB =
                    getObservationDate(
                      b
                    );

                  return (
                    (dateB?.getTime() ||
                      0) -
                    (dateA?.getTime() ||
                      0)
                  );
                }
              );

            const species =
              Array.from(
                new Map(
                  location.sightings.map(
                    (sighting) => [
                      getSpeciesKey(
                        sighting
                      ),
                      {
                        commonName:
                          getSpeciesName(
                            sighting
                          ),

                        scientificName:
                          getScientificName(
                            sighting
                          ),
                      },
                    ]
                  )
                ).values()
              );

            const score =
              calculateLocationScore(
                location,
                maximums,
                isSpecificSpecies
              );

            return {
              ...location,

              sightings:
                sortedSightings,

              species,

              score:
                score.total,

              scoreBreakdown:
                score,

              locationName:
                getLocationName(
                  location.sightings
                ),

              latestSighting:
                sortedSightings[0] ||
                null,
            };
          }
        )
        .sort(
          (a, b) => {
            // --------------------------------------------------
            // PRIMARY: SCORE
            // --------------------------------------------------

            if (
              b.score !==
              a.score
            ) {
              return (
                b.score -
                a.score
              );
            }

            // --------------------------------------------------
            // SECONDARY: RECENT ACTIVITY
            // --------------------------------------------------

            const activityA =
              getActivityValue(
                a.activity
              );

            const activityB =
              getActivityValue(
                b.activity
              );

            if (
              activityB !==
              activityA
            ) {
              return (
                activityB -
                activityA
              );
            }

            // --------------------------------------------------
            // THIRD: PHOTOGRAPHIC EVIDENCE
            // --------------------------------------------------

            if (
              b.imageSightings !==
              a.imageSightings
            ) {
              return (
                b.imageSightings -
                a.imageSightings
              );
            }

            // --------------------------------------------------
            // FINAL: TOTAL OBSERVATIONS
            // --------------------------------------------------

            return (
              b.sightings.length -
              a.sightings.length
            );
          }
        );
    }, [
      photographerSightings,
      isSpecificSpecies,
    ]);

  // ==========================================================
  // TOP RECOMMENDATION
  // ==========================================================

  const topRecommendation =
    rankedLocations[0] ||
    null;

  // ==========================================================
  // PAGE STATS
  // ==========================================================

  const stats =
    useMemo(() => {
      const locations =
        new Set(
          photographerSightings
            .map(
              getLocationKey
            )
            .filter(Boolean)
        );

      const photographed =
        photographerSightings.filter(
          hasImage
        ).length;

      const species =
        new Set(
          photographerSightings.map(
            getSpeciesKey
          )
        );

      return {
        observations:
          photographerSightings.length,

        locations:
          locations.size,

        species:
          species.size,

        photographed,
      };
    }, [
      photographerSightings,
    ]);

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <PageContainer>
        <style>
          {photographerStyles}
        </style>

        <div className="photographer-page">

          <section className="page-header">

            <p className="eyebrow">
              PHOTOGRAPHY
            </p>

            <h1>
              Photographer Mode
            </h1>

            <p>
              Building your real-world
              kingfisher photography guide.
            </p>

          </section>

          <div className="status-card">

            <Camera size={30} />

            <h2>
              Analyzing sightings...
            </h2>

            <p>
              KingFinder is processing
              the latest observation data.
            </p>

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
        <style>
          {photographerStyles}
        </style>

        <div className="photographer-page">

          <section className="page-header">

            <p className="eyebrow">
              PHOTOGRAPHY
            </p>

            <h1>
              Photographer Mode
            </h1>

            <p>
              Your photography assistant
              could not load the latest data.
            </p>

          </section>

          <div className="status-card error">

            <Camera size={30} />

            <h2>
              Unable to load recommendations
            </h2>

            <p>
              {error}
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={
                fetchSightings
              }
            >
              <RefreshCw
                size={17}
              />

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

  if (
    uniqueSightings.length ===
    0
  ) {
    return (
      <PageContainer>
        <style>
          {photographerStyles}
        </style>

        <div className="photographer-page">

          <section className="page-header">

            <p className="eyebrow">
              PHOTOGRAPHY
            </p>

            <h1>
              Photographer Mode
            </h1>

          </section>

          <div className="status-card">

            <Bird size={30} />

            <h2>
              No sightings available
            </h2>

            <p>
              There is not enough real
              observation data to generate
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

      <style>
        {photographerStyles}
      </style>

      <div className="photographer-page">

        {/* ====================================================
            PAGE HEADER
        ==================================================== */}

        <section className="page-header">

          <p className="eyebrow">
            PHOTOGRAPHY
          </p>

          <h1>
            Photographer Mode
          </h1>

          <p>
            Find the strongest real-world
            kingfisher photography opportunities
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
              Know where to go
              before you pack
              your camera.
            </h2>

            <p>
              KingFinder analyzes real
              kingfisher observations and
              ranks locations using activity,
              photographic evidence, recent
              sightings, and species diversity
              when comparing all kingfishers.
            </p>

            <div className="hero-data-note">

              <ShieldCheck size={17} />

              Recommendations are generated
              from real observation data —
              not invented locations.

            </div>

          </div>

          <div className="photographer-hero-side">

            <div>

              <div className="hero-score-label">
                CURRENT TOP LOCATION
              </div>

              <div className="hero-score-number">

                {topRecommendation
                  ?.score || 0}

                <span>
                  /100
                </span>

              </div>

              <div className="hero-score-caption">

                {isSpecificSpecies
                  ? `Photography score for ${selectedSpeciesInfo?.commonName || "the selected species"}.`
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

            <span className="photographer-stat-label">
              observations
            </span>

          </div>

          <div className="photographer-stat">

            <span className="photographer-stat-number">
              {stats.locations}
            </span>

            <span className="photographer-stat-label">
              photography spots
            </span>

          </div>

          <div className="photographer-stat">

            <span className="photographer-stat-number">
              {stats.species}
            </span>

            <span className="photographer-stat-label">
              species
            </span>

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

              <h2>
                What do you want to photograph?
              </h2>

              <p>
                Choose a species to make the
                location recommendations more
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
                value={
                  selectedSpecies
                }
                onChange={(event) =>
                  setSelectedSpecies(
                    event.target.value
                  )
                }
              >

                <option value="all">
                  All Kingfishers
                </option>

                {speciesSummary.map(
                  (species) => (
                    <option
                      key={
                        species.key
                      }
                      value={
                        species.key
                      }
                    >
                      {species.commonName}
                      {" — "}
                      {
                        species
                          .scientificName
                      }
                    </option>
                  )
                )}

              </select>

              {selectedSpecies !==
                "all" && (
                <button
                  type="button"
                  className="clear-species"
                  onClick={() =>
                    setSelectedSpecies(
                      "all"
                    )
                  }
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

                <h2>
                  Start here
                </h2>

                <p>

                  {isSpecificSpecies
                    ? `The strongest location for ${selectedSpeciesInfo?.commonName || "the selected species"} based on the current observation data.`
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

                  <h3>
                    {topRecommendation.locationName}
                  </h3>

                  <div className="recommendation-location">

                    <MapPin size={15} />

                    Bengaluru,
                    Karnataka

                  </div>

                </div>

                <div className="recommendation-score">

                  <small>
                    PHOTOGRAPHY SCORE
                  </small>

                  <strong>

                    {topRecommendation.score}

                    <span>
                      /100
                    </span>

                  </strong>

                </div>

              </div>

              <p className="recommendation-description">

                {isSpecificSpecies
                  ? `This location ranks highest for ${selectedSpeciesInfo?.commonName || "the selected species"} because it combines strong observation activity, photographic evidence, and recent activity in the current dataset.`
                  : "This location has the strongest combination of observation activity, species diversity, photographic evidence, and recent activity in the current dataset."}

              </p>

              <div className="recommendation-metrics">

                <div className="recommendation-metric">

                  <Bird size={18} />

                  <strong>
                    {
                      topRecommendation
                        .sightings
                        .length
                    }
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
                    {
                      topRecommendation
                        .species
                        .length
                    }
                  </strong>

                  <span>
                    species
                  </span>

                </div>

                <div className="recommendation-metric">

                  <ImageIcon size={18} />

                  <strong>
                    {
                      topRecommendation
                        .imageSightings
                    }
                  </strong>

                  <span>
                    photo records
                  </span>

                </div>

                <div className="recommendation-metric">

                  <ShieldCheck size={18} />

                  <strong>
                    {
                      topRecommendation
                        .researchGrade
                    }
                  </strong>

                  <span>
                    research grade
                  </span>

                </div>

              </div>

              {/* ==================================================
                  SCORE BREAKDOWN
              ================================================== */}

              <div className="score-breakdown">

                <div className="score-breakdown-title">

                  WHY THIS LOCATION SCORED{" "}

                  {
                    topRecommendation
                      .score
                  }

                  /100

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
                          topRecommendation
                            .scoreBreakdown
                            .observationMax > 0
                            ? (
                                topRecommendation
                                  .scoreBreakdown
                                  .observationScore /
                                topRecommendation
                                  .scoreBreakdown
                                  .observationMax
                              ) * 100
                            : 0
                        }%`,
                      }}
                    />

                  </div>

                  <span className="score-row-value">

                    +
                    {
                      topRecommendation
                        .scoreBreakdown
                        .observationScore
                    }

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
                            (
                              topRecommendation
                                .scoreBreakdown
                                .diversityScore /
                              20
                            ) * 100
                          }%`,
                        }}
                      />

                    </div>

                    <span className="score-row-value">

                      +
                      {
                        topRecommendation
                          .scoreBreakdown
                          .diversityScore
                      }

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
                          topRecommendation
                            .scoreBreakdown
                            .photoMax > 0
                            ? (
                                topRecommendation
                                  .scoreBreakdown
                                  .photoScore /
                                topRecommendation
                                  .scoreBreakdown
                                  .photoMax
                              ) * 100
                            : 0
                        }%`,
                      }}
                    />

                  </div>

                  <span className="score-row-value">

                    +
                    {
                      topRecommendation
                        .scoreBreakdown
                        .photoScore
                    }

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
                          topRecommendation
                            .scoreBreakdown
                            .recentActivityMax > 0
                            ? (
                                topRecommendation
                                  .scoreBreakdown
                                  .recentActivityScore /
                                topRecommendation
                                  .scoreBreakdown
                                  .recentActivityMax
                              ) * 100
                            : 0
                        }%`,
                      }}
                    />

                  </div>

                  <span className="score-row-value">

                    +
                    {
                      topRecommendation
                        .scoreBreakdown
                        .recentActivityScore
                    }

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

                <h2>
                  How active is this spot?
                </h2>

                <p>

                  Actual observations recorded
                  recently at the recommended
                  location.

                </p>

              </div>

            </div>

            <div className="activity-card">

              <strong>
                {topRecommendation.locationName}
              </strong>

              <div className="activity-grid">

                <div className="activity-item">

                  <strong>
                    {
                      topRecommendation
                        .activity
                        .last7
                    }
                  </strong>

                  <span>
                    observations in last 7 days
                  </span>

                </div>

                <div className="activity-item">

                  <strong>
                    {
                      topRecommendation
                        .activity
                        .last30
                    }
                  </strong>

                  <span>
                    observations in last 30 days
                  </span>

                </div>

                <div className="activity-item">

                  <strong>
                    {
                      topRecommendation
                        .activity
                        .last90
                    }
                  </strong>

                  <span>
                    observations in last 90 days
                  </span>

                </div>

              </div>

              <p className="photographer-note">

                Recent activity is based only
                on observations present in the
                current KingFinder dataset.
                It does not guarantee that a
                bird will be present when you
                visit.

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

              <h2>
                Best Photography Spots
              </h2>

              <p>

                {isSpecificSpecies
                  ? `Ranked locations for ${selectedSpeciesInfo?.commonName || "the selected species"} using the current observation data.`
                  : "Ranked from the strongest to weaker photography opportunities in the current dataset."}

              </p>

            </div>

          </div>

          {rankedLocations.length ===
          0 ? (

            <div className="status-card">

              <MapPin size={30} />

              <h2>
                No mapped locations
              </h2>

              <p>

                The selected species does not
                currently have usable coordinates.

              </p>

            </div>

          ) : (

            <div className="location-grid">

              {rankedLocations
                .slice(0, 9)
                .map(
                  (
                    location,
                    index
                  ) => {

                    const latest =
                      location.latestSighting;

                    const image =
                      latest?.primaryImageUrl ||
                      latest?.media?.[0]
                        ?.url ||
                      latest?.media?.[0]
                        ?.originalUrl ||
                      null;

                    return (
                      <article
                        className="location-card"
                        key={
                          location.key
                        }
                      >

                        {image ? (

                          <img
                            src={image}
                            alt={
                              getSpeciesName(
                                latest
                              )
                            }
                            className="location-image"
                            loading="lazy"
                            decoding="async"
                            onError={(
                              event
                            ) => {
                              event.currentTarget.style.display =
                                "none";
                            }}
                          />

                        ) : (

                          <div className="location-placeholder">

                            <Camera
                              size={32}
                            />

                          </div>

                        )}

                        <div className="location-card-body">

                          <div className="location-rank">

                            <span className="location-rank-number">

                              #{index + 1}

                            </span>

                            <span className="location-score-pill">

                              <Star
                                size={12}
                              />

                              {
                                location.score
                              }
                              /100

                            </span>

                          </div>

                          <h3>
                            {location.locationName}
                          </h3>

                          <p className="location-species">

                            {location.species
                              .slice(
                                0,
                                4
                              )
                              .map(
                                (
                                  species
                                ) =>
                                  species.commonName
                              )
                              .join(
                                " · "
                              )}

                          </p>

                          <div className="location-metrics">

                            <div className="location-metric">

                              <strong>
                                {
                                  location
                                    .sightings
                                    .length
                                }
                              </strong>

                              <span>
                                {isSpecificSpecies
                                  ? "target sightings"
                                  : "sightings"}
                              </span>

                            </div>

                            <div className="location-metric">

                              <strong>
                                {
                                  location
                                    .imageSightings
                                }
                              </strong>

                              <span>
                                photo records
                              </span>

                            </div>

                            <div className="location-metric">

                              <strong>
                                {
                                  location
                                    .species
                                    .length
                                }
                              </strong>

                              <span>
                                species
                              </span>

                            </div>

                            <div className="location-metric">

                              <strong>
                                {
                                  location
                                    .researchGrade
                                }
                              </strong>

                              <span>
                                research grade
                              </span>

                            </div>

                          </div>

                          <div className="location-latest">

                            <Clock3
                              size={14}
                            />

                            Latest:
                            {" "}
                            {formatDate(
                              getObservationDate(
                                latest
                              )
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

                            <ArrowRight
                              size={14}
                            />

                          </a>

                        </div>

                      </article>
                    );
                  }
                )}

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

              <h2>
                Target Kingfishers
              </h2>

              <p>

                Species currently represented
                in the real KingFinder dataset.

              </p>

            </div>

          </div>

          <div className="species-grid">

            {speciesSummary
              .slice(0, 8)
              .map(
                (species) => (
                  <article
                    className="species-card"
                    key={
                      species.key
                    }
                  >

                    <div className="species-icon">

                      <Bird
                        size={20}
                      />

                    </div>

                    <h3>
                      {
                        species.commonName
                      }
                    </h3>

                    <p className="species-scientific">

                      {
                        species.scientificName
                      }

                    </p>

                    <div className="species-stat-list">

                      <div className="species-stat">

                        <span>
                          Observations
                        </span>

                        <strong>
                          {
                            species.count
                          }
                        </strong>

                      </div>

                      <div className="species-stat">

                        <span>
                          Locations
                        </span>

                        <strong>
                          {
                            species.locationCount
                          }
                        </strong>

                      </div>

                      <div className="species-stat">

                        <span>
                          Photo records
                        </span>

                        <strong>
                          {
                            species.photographed
                          }
                        </strong>

                      </div>

                      <div className="species-stat">

                        <span>
                          Research grade
                        </span>

                        <strong>
                          {
                            species.researchGrade
                          }
                        </strong>

                      </div>

                      <div className="species-stat">

                        <span>
                          Latest
                        </span>

                        <strong>
                          {formatDate(
                            species.latestDate
                          )}
                        </strong>

                      </div>

                    </div>

                    <button
                      type="button"
                      className="species-select-button"
                      onClick={() =>
                        setSelectedSpecies(
                          species.key
                        )
                      }
                    >

                      Find photography spots

                    </button>

                  </article>
                )
              )}

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

          <h2>
            Photography Score
          </h2>

          <p>

            {isSpecificSpecies
              ? `When targeting ${selectedSpeciesInfo?.commonName || "a specific species"}, the score focuses on target-species observations, photographic evidence, and recent activity.`
              : "When comparing all kingfishers, the score considers observation activity, species diversity, photographic evidence, and recent activity."}

          </p>

          <div className="methodology-grid">

            <div className="methodology-item">

              <Bird size={17} />

              <span>

                <strong>
                  35 points
                </strong>

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

                  <strong>
                    20 points
                  </strong>

                  <br />

                  Species diversity

                </span>

              </div>
            )}

            <div className="methodology-item">

              <ImageIcon
                size={17}
              />

              <span>

                <strong>
                  {isSpecificSpecies
                    ? "25 points"
                    : "20 points"}
                </strong>

                <br />

                Photographic evidence

              </span>

            </div>

            <div className="methodology-item">

              <Clock3 size={17} />

              <span>

                <strong>
                  {isSpecificSpecies
                    ? "40 points"
                    : "25 points"}
                </strong>

                <br />

                Recent activity

              </span>

            </div>

          </div>

          <p className="photographer-note">

            Score components are relative to
            the strongest locations in the
            current dataset. As new observations
            arrive, rankings can change.

          </p>

        </section>

      </div>

    </PageContainer>
  );
}

export default Photographer;