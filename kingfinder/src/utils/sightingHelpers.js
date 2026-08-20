/**
 * Shared sighting helper functions.
 * Used by Explore, Photographer, and KingfisherMap.
 */

export function getSourcePlatform(sighting) {
  return (
    sighting?.source?.platform ||
    sighting?.source?.name ||
    sighting?.source?.type ||
    "unknown"
  );
}

export const getSourceName = getSourcePlatform;

export function getObservationId(sighting) {
  return (
    sighting?.source?.observationId ??
    sighting?.observation?.observationId ??
    sighting?.id
  );
}

export function getSightingKey(sighting) {
  const source = getSourcePlatform(sighting);
  const observationId = getObservationId(sighting);
  return `${source}-${observationId}`;
}

export function getGoogleMapsUrl(latitude, longitude) {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

export function getBestImageUrl(sighting) {
  const media = sighting?.media?.[0];

  if (!media) {
    return null;
  }

  return (
    media.originalUrl ||
    media.url ||
    null
  );
}

export const getBestImage = getBestImageUrl;
