import {
  getSourcePlatform,
  getObservationId,
} from "./sightingHelpers";

/**
 * Remove duplicate sightings.
 *
 * Uses observation ID when available, falls back to
 * a composite key of species + date + location.
 *
 * This is the more robust version (from Explore) that
 * handles records missing an observation ID.
 */
export function dedupSightings(sightings) {
  const seen = new Set();
  const unique = [];

  for (const sighting of sightings) {
    const source = getSourcePlatform(sighting);
    const observationId = getObservationId(sighting);

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
}
