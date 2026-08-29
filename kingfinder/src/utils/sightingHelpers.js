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
  if (!sighting) {
    return null;
  }

  const mediaItem = sighting.media?.[0];

  if (mediaItem) {
    const mediaUrl = mediaItem.originalUrl || mediaItem.url;
    if (typeof mediaUrl === "string" && mediaUrl.trim()) {
      return mediaUrl.trim();
    }
  }

  if (typeof sighting.primaryImageUrl === "string" && sighting.primaryImageUrl.trim()) {
    return sighting.primaryImageUrl.trim();
  }

  if (typeof sighting.photoUrl === "string" && sighting.photoUrl.trim()) {
    return sighting.photoUrl.trim();
  }

  return null;
}

export const getBestImage = getBestImageUrl;
