const express = require("express");
const cors = require("cors");

const app = express();

const PORT = 5000;

app.use(cors());
app.use(express.json());

const BENGALURU_BOUNDS = {
  swlat: 12.7342888476,
  swlng: 77.3791980762,
  nelat: 13.1737060086,
  nelng: 77.8826808667,
};

const KINGFISHER_SPECIES = [
  {
    commonName: "White-throated Kingfisher",
    scientificName: "Halcyon smyrnensis",
  },
  {
    commonName: "Common Kingfisher",
    scientificName: "Alcedo atthis",
  },
  {
    commonName: "Pied Kingfisher",
    scientificName: "Ceryle rudis",
  },
  {
    commonName: "Stork-billed Kingfisher",
    scientificName: "Pelargopsis capensis",
  },
  {
    commonName: "Black-capped Kingfisher",
    scientificName: "Halcyon pileata",
  },
  {
    commonName: "Oriental Dwarf Kingfisher",
    scientificName: "Ceyx erithaca",
  },
];

function getDateDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);

  return date.toISOString().split("T")[0];
}

function normalizeObservation(observation) {
  const taxon = observation.taxon || {};

  return {
    id: `inat-${observation.id}`,

    species: {
      commonName:
        taxon.preferred_common_name ||
        observation.species_guess ||
        "Unknown Kingfisher",

      scientificName:
        taxon.name ||
        "Unknown",
    },

    observation: {
      date: observation.observed_on || null,

      time:
        observation.time_observed_at ||
        null,

      count:
        observation.count ||
        null,
    },

    location: {
      name:
        observation.place_guess ||
        "Bengaluru",

      city: "Bengaluru",

      state: "Karnataka",

      country: "India",

      latitude:
        observation.latitude
          ? Number(observation.latitude)
          : null,

      longitude:
        observation.longitude
          ? Number(observation.longitude)
          : null,
    },

    source: {
      platform: "iNaturalist",

      observationId: observation.id,

      url: `https://www.inaturalist.org/observations/${observation.id}`,

      license:
        observation.license || null,

      retrievedAt:
        new Date().toISOString(),
    },

    verification: {
      qualityGrade:
        observation.quality_grade || null,

      isResearchGrade:
        observation.quality_grade === "research",

      geoprivacy:
        observation.geoprivacy || null,

      coordinatesObscured:
        Boolean(observation.coordinates_obscured),
    },

    media: (observation.photos || []).map((photo) => ({
      id: photo.id,

      url:
        photo.url ||
        photo.original_url ||
        null,

      license:
        photo.license_code || null,

      attribution:
        photo.attribution || null,
    })),

    rarity: {
      localLabel: null,
      localScore: null,
    },
  };
}

async function fetchSpeciesObservations(species) {
  const params = new URLSearchParams({
    taxon_name: species.scientificName,

    swlat: BENGALURU_BOUNDS.swlat,
    swlng: BENGALURU_BOUNDS.swlng,

    nelat: BENGALURU_BOUNDS.nelat,
    nelng: BENGALURU_BOUNDS.nelng,

    d1: getDateDaysAgo(365),

    quality_grade: "research",

    per_page: "100",

    page: "1",

    order_by: "observed_on",

    order: "desc",
  });

  params.append("has[]", "geo");

  const url =
    `https://api.inaturalist.org/v1/observations?${params.toString()}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `iNaturalist request failed: ${response.status}`
    );
  }

  const data = await response.json();

  return {
    species,
    observations: data.results || [],
  };
}

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    service: "KingFinder API",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/sightings", async (req, res) => {
  try {
    const results = await Promise.all(
      KINGFISHER_SPECIES.map(
        fetchSpeciesObservations
      )
    );

    const sightings = results
      .flatMap((result) => result.observations)
      .map(normalizeObservation)
      .sort((a, b) => {
        return (
          new Date(b.observation.date || 0) -
          new Date(a.observation.date || 0)
        );
      });

    res.json({
      success: true,

      source: "iNaturalist",

      region: {
        city: "Bengaluru",
        state: "Karnataka",
        country: "India",
      },

      retrievedAt:
        new Date().toISOString(),

      count: sightings.length,

      sightings,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message:
        "Unable to retrieve live iNaturalist observations.",
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(
    `KingFinder API running at http://localhost:${PORT}`
  );
});