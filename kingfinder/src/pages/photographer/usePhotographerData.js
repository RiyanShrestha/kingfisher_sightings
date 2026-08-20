import { useEffect, useMemo, useState, useCallback } from "react";
import { dedupSightings } from "../../utils/dedupSightings";
import {
  getLocationKey,
  getLocationName,
  getSpeciesKey,
  getSpeciesName,
  getScientificName,
  getObservationDate,
  hasImage,
  getActivityCounts,
  getActivityValue,
  getLatestSighting,
} from "./helpers";
import { calculateLocationScore } from "./scoring";

const API_URL = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/sightings`;

export function usePhotographerData() {
  const [sightings, setSightings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState("all");

  // ==========================================================
  // FETCH WITH CANCELLATION
  // ==========================================================

  const fetchSightings = useCallback(async () => {
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

      if (!Array.isArray(data.sightings)) {
        throw new Error("Invalid sightings response.");
      }

      setSightings(data.sightings);
    } catch (err) {
      console.error("KingFinder Photographer Mode error:", err);
      setError(
        "Unable to load real sighting data. Make sure the KingFinder backend is running."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
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

        if (!Array.isArray(data.sightings)) {
          throw new Error("Invalid sightings response.");
        }

        if (!cancelled) {
          setSightings(data.sightings);
        }
      } catch (err) {
        console.error("KingFinder Photographer Mode error:", err);
        if (!cancelled) {
          setError(
            "Unable to load real sighting data. Make sure the KingFinder backend is running."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================================================
  // UNIQUE SIGHTINGS
  // ==========================================================

  const uniqueSightings = useMemo(
    () => dedupSightings(sightings),
    [sightings]
  );

  // ==========================================================
  // SPECIES SUMMARY
  // ==========================================================

  const speciesSummary = useMemo(() => {
    const speciesMap = new Map();

    uniqueSightings.forEach((sighting) => {
      const key = getSpeciesKey(sighting);

      if (!speciesMap.has(key)) {
        speciesMap.set(key, {
          key,
          commonName: getSpeciesName(sighting),
          scientificName: getScientificName(sighting),
          sightings: [],
        });
      }

      speciesMap.get(key).sightings.push(sighting);
    });

    return Array.from(speciesMap.values())
      .map((species) => {
        const locations = new Set(
          species.sightings.map(getLocationKey).filter(Boolean)
        );

        const photographed = species.sightings.filter(hasImage).length;

        const researchGrade = species.sightings.filter(
          (sighting) => sighting.verification?.isResearchGrade === true
        ).length;

        const latestDate = getObservationDate(
          getLatestSighting(species.sightings)
        );

        return {
          ...species,
          count: species.sightings.length,
          locationCount: locations.size,
          photographed,
          researchGrade,
          latestDate,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [uniqueSightings]);

  // ==========================================================
  // FILTERED SIGHTINGS
  // ==========================================================

  const photographerSightings = useMemo(() => {
    if (selectedSpecies === "all") {
      return uniqueSightings;
    }

    return uniqueSightings.filter(
      (sighting) => getSpeciesKey(sighting) === selectedSpecies
    );
  }, [uniqueSightings, selectedSpecies]);

  // ==========================================================
  // SPECIFIC SPECIES MODE
  // ==========================================================

  const isSpecificSpecies = selectedSpecies !== "all";

  const selectedSpeciesInfo = useMemo(() => {
    if (!isSpecificSpecies) {
      return null;
    }

    return (
      speciesSummary.find(
        (species) => species.key === selectedSpecies
      ) || null
    );
  }, [isSpecificSpecies, selectedSpecies, speciesSummary]);

  // ==========================================================
  // LOCATION GROUPING & RANKING
  // ==========================================================

  const rankedLocations = useMemo(() => {
    const locationMap = new Map();

    photographerSightings.forEach((sighting) => {
      const key = getLocationKey(sighting);

      if (!key) {
        return;
      }

      if (!locationMap.has(key)) {
        locationMap.set(key, {
          key,
          latitude: Number(sighting.location?.latitude),
          longitude: Number(sighting.location?.longitude),
          sightings: [],
          speciesKeys: new Set(),
          imageSightings: 0,
          researchGrade: 0,
        });
      }

      const location = locationMap.get(key);
      location.sightings.push(sighting);
      location.speciesKeys.add(getSpeciesKey(sighting));

      if (hasImage(sighting)) {
        location.imageSightings += 1;
      }

      if (sighting.verification?.isResearchGrade === true) {
        location.researchGrade += 1;
      }
    });

    const locations = Array.from(locationMap.values());

    locations.forEach((location) => {
      location.activity = getActivityCounts(location.sightings);
    });

    // --------------------------------------------------------
    // MAXIMUMS USED FOR RELATIVE SCORING
    // --------------------------------------------------------

    const maximums = {
      maxSightings: Math.max(
        0,
        ...locations.map((location) => location.sightings.length)
      ),

      maxSpecies: Math.max(
        0,
        ...locations.map((location) => location.speciesKeys.size)
      ),

      maxImages: Math.max(
        0,
        ...locations.map((location) => location.imageSightings)
      ),

      maxActivity: Math.max(
        0,
        ...locations.map((location) =>
          getActivityValue(location.activity)
        )
      ),
    };

    // --------------------------------------------------------
    // SCORE + PREPARE LOCATIONS
    // --------------------------------------------------------

    return locations
      .map((location) => {
        const sortedSightings = [...location.sightings].sort(
          (a, b) => {
            const dateA = getObservationDate(a);
            const dateB = getObservationDate(b);

            return (
              (dateB?.getTime() || 0) - (dateA?.getTime() || 0)
            );
          }
        );

        const species = Array.from(
          new Map(
            location.sightings.map((sighting) => [
              getSpeciesKey(sighting),
              {
                commonName: getSpeciesName(sighting),
                scientificName: getScientificName(sighting),
              },
            ])
          ).values()
        );

        const score = calculateLocationScore(
          location,
          maximums,
          isSpecificSpecies
        );

        return {
          ...location,
          sightings: sortedSightings,
          species,
          score: score.total,
          scoreBreakdown: score,
          locationName: getLocationName(location.sightings),
          latestSighting: sortedSightings[0] || null,
        };
      })
      .sort((a, b) => {
        // --------------------------------------------------
        // PRIMARY: SCORE
        // --------------------------------------------------
        if (b.score !== a.score) {
          return b.score - a.score;
        }

        // --------------------------------------------------
        // SECONDARY: RECENT ACTIVITY
        // --------------------------------------------------
        const activityA = getActivityValue(a.activity);
        const activityB = getActivityValue(b.activity);

        if (activityB !== activityA) {
          return activityB - activityA;
        }

        // --------------------------------------------------
        // THIRD: PHOTOGRAPHIC EVIDENCE
        // --------------------------------------------------
        if (b.imageSightings !== a.imageSightings) {
          return b.imageSightings - a.imageSightings;
        }

        // --------------------------------------------------
        // FINAL: TOTAL OBSERVATIONS
        // --------------------------------------------------
        return b.sightings.length - a.sightings.length;
      });
  }, [photographerSightings, isSpecificSpecies]);

  // ==========================================================
  // TOP RECOMMENDATION
  // ==========================================================

  const topRecommendation = rankedLocations[0] || null;

  // ==========================================================
  // PAGE STATS
  // ==========================================================

  const stats = useMemo(() => {
    const locations = new Set(
      photographerSightings.map(getLocationKey).filter(Boolean)
    );

    const photographed =
      photographerSightings.filter(hasImage).length;

    const species = new Set(
      photographerSightings.map(getSpeciesKey)
    );

    return {
      observations: photographerSightings.length,
      locations: locations.size,
      species: species.size,
      photographed,
    };
  }, [photographerSightings]);

  return {
    sightings,
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
    refetch: fetchSightings,
  };
}
