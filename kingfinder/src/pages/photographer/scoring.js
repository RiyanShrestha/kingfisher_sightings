import { getActivityValue } from "./helpers";

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

export function calculateLocationScore(
  location,
  maximums,
  isSpecificSpecies
) {
  if (isSpecificSpecies) {
    const observationScore =
      maximums.maxSightings > 0
        ? (location.sightings.length / maximums.maxSightings) * 35
        : 0;

    const photoScore =
      maximums.maxImages > 0
        ? (location.imageSightings / maximums.maxImages) * 25
        : 0;

    const activityValue = getActivityValue(location.activity);

    const recentActivityScore =
      maximums.maxActivity > 0
        ? (activityValue / maximums.maxActivity) * 40
        : 0;

    return {
      total: Math.min(
        100,
        Math.round(
          observationScore + photoScore + recentActivityScore
        )
      ),

      observationScore: Math.round(observationScore),

      observationMax: 35,

      diversityScore: 0,

      diversityMax: 0,

      photoScore: Math.round(photoScore),

      photoMax: 25,

      recentActivityScore: Math.round(recentActivityScore),

      recentActivityMax: 40,

      isSpecificSpecies: true,
    };
  }

  const observationScore =
    maximums.maxSightings > 0
      ? (location.sightings.length / maximums.maxSightings) * 35
      : 0;

  const diversityScore =
    maximums.maxSpecies > 0
      ? (location.speciesKeys.size / maximums.maxSpecies) * 20
      : 0;

  const photoScore =
    maximums.maxImages > 0
      ? (location.imageSightings / maximums.maxImages) * 20
      : 0;

  const activityValue = getActivityValue(location.activity);

  const recentActivityScore =
    maximums.maxActivity > 0
      ? (activityValue / maximums.maxActivity) * 25
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

    observationScore: Math.round(observationScore),

    observationMax: 35,

    diversityScore: Math.round(diversityScore),

    diversityMax: 20,

    photoScore: Math.round(photoScore),

    photoMax: 20,

    recentActivityScore: Math.round(recentActivityScore),

    recentActivityMax: 25,

    isSpecificSpecies: false,
  };
}
