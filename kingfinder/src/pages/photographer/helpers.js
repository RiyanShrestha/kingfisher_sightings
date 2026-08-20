export const LOCATION_PRECISION = 3;

export function getLocationKey(sighting) {
  const latitude = Number(sighting.location?.latitude);
  const longitude = Number(sighting.location?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return `${latitude.toFixed(LOCATION_PRECISION)},${longitude.toFixed(
    LOCATION_PRECISION
  )}`;
}

export function getLocationName(sightings) {
  const names = sightings
    .map((sighting) => sighting.location?.name?.trim())
    .filter(Boolean);

  if (names.length === 0) {
    return "Bengaluru";
  }

  const counts = new Map();

  names.forEach((name) => {
    const key = name.toLowerCase();
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  let bestName = names[0];
  let bestCount = 0;

  names.forEach((name) => {
    const count = counts.get(name.toLowerCase()) || 0;

    if (count > bestCount) {
      bestCount = count;
      bestName = name;
    }
  });

  return bestName;
}

export function getSpeciesKey(sighting) {
  const scientificName = sighting.species?.scientificName?.trim();
  const commonName = sighting.species?.commonName?.trim();

  if (scientificName) {
    return scientificName;
  }

  if (commonName) {
    return commonName;
  }

  return "unknown";
}

export function getSpeciesName(sighting) {
  return sighting.species?.commonName || "Unknown Kingfisher";
}

export function getScientificName(sighting) {
  return sighting.species?.scientificName || "Scientific name unavailable";
}

export function getObservationDate(sighting) {
  const value = sighting.observation?.date;

  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function getImageCount(sighting) {
  if (Number.isFinite(Number(sighting.imageCount))) {
    return Number(sighting.imageCount);
  }

  if (Array.isArray(sighting.media)) {
    return sighting.media.length;
  }

  return sighting.primaryImageUrl ? 1 : 0;
}

export function hasImage(sighting) {
  return (
    Boolean(sighting.primaryImageUrl) || getImageCount(sighting) > 0
  );
}

export function formatDate(date) {
  if (!date) {
    return "Date unavailable";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getDaysSince(date) {
  if (!date) {
    return Infinity;
  }

  const now = new Date();

  return Math.max(
    0,
    Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  );
}

export function getActivityCounts(sightings) {
  const counts = {
    last7: 0,
    last30: 0,
    last90: 0,
  };

  sightings.forEach((sighting) => {
    const date = getObservationDate(sighting);
    const days = getDaysSince(date);

    if (days <= 7) {
      counts.last7 += 1;
    }

    if (days <= 30) {
      counts.last30 += 1;
    }

    if (days <= 90) {
      counts.last90 += 1;
    }
  });

  return counts;
}

export function getActivityValue(activity) {
  return (
    activity.last7 * 1 +
    activity.last30 * 0.6 +
    activity.last90 * 0.25
  );
}

export function getLatestSighting(sightings) {
  return (
    [...sightings].sort((a, b) => {
      const dateA = getObservationDate(a);
      const dateB = getObservationDate(b);

      return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
    })[0] || null
  );
}
