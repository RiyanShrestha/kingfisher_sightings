const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();

const PORT = 5000;

/* ============================================================
   MIDDLEWARE
============================================================ */

app.use(cors());
app.use(express.json());

/* ============================================================
   KINGFINDER CONFIGURATION
============================================================ */

const BENGALURU_BOUNDS = {
  swlat: 12.7342888476,
  swlng: 77.3791980762,
  nelat: 13.1737060086,
  nelng: 77.8826808667,
};

const LOOKBACK_DAYS = 365;

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

/* ============================================================
   DATE HELPERS
============================================================ */

function getDateDaysAgo(days) {
  const date = new Date();

  date.setDate(
    date.getDate() - days
  );

  return date
    .toISOString()
    .split("T")[0];
}

function getToday() {
  return new Date()
    .toISOString()
    .split("T")[0];
}

/* ============================================================
   GENERIC FETCH HELPER
============================================================ */

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,

    headers: {
      Accept: "application/json",

      "User-Agent":
        "KingFinder/1.0 (Kingfisher Sightings Research Project)",

      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(
      `Request failed: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

/* ============================================================
   iNATURALIST IMAGE HELPERS
============================================================ */

function getBestINaturalistImageUrl(photo) {
  if (!photo) {
    return null;
  }

  /*
    Prefer original_url because it contains
    the highest-quality available image.
  */

  if (photo.original_url) {
    return photo.original_url;
  }

  if (photo.url) {
    return photo.url
      .replace(
        "/square.",
        "/large."
      )
      .replace(
        "/thumb.",
        "/large."
      )
      .replace(
        "/small.",
        "/large."
      )
      .replace(
        "/medium.",
        "/large."
      );
  }

  return null;
}

function getINaturalistImageCandidates(photo) {
  if (!photo) {
    return [];
  }

  const candidates = [];

  if (photo.original_url) {
    candidates.push(
      photo.original_url
    );
  }

  if (photo.url) {
    const upgraded =
      photo.url
        .replace(
          "/square.",
          "/large."
        )
        .replace(
          "/thumb.",
          "/large."
        )
        .replace(
          "/small.",
          "/large."
        )
        .replace(
          "/medium.",
          "/large."
        );

    candidates.push(
      upgraded
    );
  }

  return [
    ...new Set(
      candidates.filter(Boolean)
    ),
  ];
}

function getImageLicense(photo) {
  if (!photo) {
    return null;
  }

  return (
    photo.license_code ||
    photo.license ||
    null
  );
}

/* ============================================================
   GBIF IMAGE CACHE
============================================================ */

function createGBIFImageCacheUrl(
  gbifId,
  identifier,
  width = 1200
) {
  if (
    !gbifId ||
    !identifier
  ) {
    return null;
  }

  const md5 = crypto
    .createHash("md5")
    .update(identifier)
    .digest("hex");

  return (
    `https://api.gbif.org/v1/image/cache/` +
    `${width}x/occurrence/${gbifId}/media/${md5}`
  );
}

/* ============================================================
   iNATURALIST NORMALIZATION
============================================================ */

function normalizeINaturalistObservation(
  observation
) {
  const taxon =
    observation.taxon || {};

  /*
    iNaturalist coordinates may be provided as:

    observation.latitude
    observation.longitude

    OR

    observation.geojson.coordinates

    GeoJSON uses:

    [longitude, latitude]
  */

  let latitude =
    observation.latitude !== null &&
    observation.latitude !== undefined
      ? Number(
          observation.latitude
        )
      : null;

  let longitude =
    observation.longitude !== null &&
    observation.longitude !== undefined
      ? Number(
          observation.longitude
        )
      : null;

  /*
    IMPORTANT:
    Fall back to GeoJSON if direct
    latitude/longitude are unavailable.
  */

  if (
    (
      latitude === null ||
      longitude === null
    ) &&
    observation.geojson &&
    Array.isArray(
      observation.geojson.coordinates
    ) &&
    observation.geojson.coordinates.length >= 2
  ) {
    longitude = Number(
      observation
        .geojson
        .coordinates[0]
    );

    latitude = Number(
      observation
        .geojson
        .coordinates[1]
    );
  }

  /* ========================================================
     OBSERVATION MEDIA
  ======================================================== */

  const media =
    (
      observation.photos || []
    )
      .map((photo) => {
        const url =
          getBestINaturalistImageUrl(
            photo
          );

        if (!url) {
          return null;
        }

        return {
          id:
            `inat-photo-${photo.id}`,

          url,

          originalUrl:
            photo.original_url ||
            null,

          candidates:
            getINaturalistImageCandidates(
              photo
            ),

          source:
            "iNaturalist",

          license:
            getImageLicense(
              photo
            ),

          attribution:
            photo.attribution ||
            null,

          sourceUrl:
            `https://www.inaturalist.org/observations/${observation.id}`,

          type:
            "observation",

          isObservationImage:
            true,
        };
      })
      .filter(Boolean);

  return {
    id:
      `inat-${observation.id}`,

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
      date:
        observation.observed_on ||
        null,

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

      city:
        "Bengaluru",

      state:
        "Karnataka",

      country:
        "India",

      latitude,

      longitude,

      coordinatesAvailable:
        latitude !== null &&
        longitude !== null,
    },

    source: {
      platform:
        "iNaturalist",

      observationId:
        observation.id,

      url:
        `https://www.inaturalist.org/observations/${observation.id}`,

      license:
        observation.license ||
        null,

      retrievedAt:
        new Date().toISOString(),
    },

    verification: {
      qualityGrade:
        observation.quality_grade ||
        null,

      isResearchGrade:
        observation.quality_grade ===
        "research",

      geoprivacy:
        observation.geoprivacy ||
        null,

      coordinatesObscured:
        Boolean(
          observation.coordinates_obscured
        ),
    },

    media,

    primaryImageUrl:
      media.length > 0
        ? media[0].url
        : null,

    imageSource:
      media.length > 0
        ? "iNaturalist"
        : null,

    rarity: {
      localLabel:
        null,

      localScore:
        null,
    },
  };
}

/* ============================================================
   iNATURALIST ADAPTER
============================================================ */

async function fetchINaturalistSpecies(
  species
) {
  const params =
    new URLSearchParams({
      taxon_name:
        species.scientificName,

      swlat:
        String(
          BENGALURU_BOUNDS.swlat
        ),

      swlng:
        String(
          BENGALURU_BOUNDS.swlng
        ),

      nelat:
        String(
          BENGALURU_BOUNDS.nelat
        ),

      nelng:
        String(
          BENGALURU_BOUNDS.nelng
        ),

      d1:
        getDateDaysAgo(
          LOOKBACK_DAYS
        ),

      d2:
        getToday(),

      quality_grade:
        "research",

      per_page:
        "100",

      page:
        "1",

      order_by:
        "observed_on",

      order:
        "desc",
    });

  params.append(
    "has[]",
    "geo"
  );

  const url =
    `https://api.inaturalist.org/v1/observations?${params.toString()}`;

  const data =
    await fetchJson(url);

  return {
    source:
      "iNaturalist",

    species,

    observations:
      data.results || [],
  };
}

/* ============================================================
   GBIF IMAGE HELPER
============================================================ */

function getGBIFImageData(
  media,
  gbifId,
  index
) {
  if (!media) {
    return null;
  }

  const publisherUrl =
    media.identifier ||
    null;

  const referencesUrl =
    media.references ||
    null;

  const primaryUrl =
    publisherUrl ||
    referencesUrl ||
    null;

  if (!primaryUrl) {
    return null;
  }

  const cacheUrl =
    publisherUrl
      ? createGBIFImageCacheUrl(
          gbifId,
          publisherUrl,
          1200
        )
      : null;

  return {
    id:
      `gbif-media-${gbifId}-${index}`,

    url:
      primaryUrl,

    originalUrl:
      publisherUrl,

    cacheUrl,

    source:
      "GBIF",

    license:
      media.license ||
      null,

    attribution:
      media.creator ||
      null,

    sourceUrl:
      `https://www.gbif.org/occurrence/${gbifId}`,

    type:
      "observation",

    isObservationImage:
      true,
  };
}

/* ============================================================
   GBIF NORMALIZATION
============================================================ */

function normalizeGBIFObservation(
  record
) {
  const scientificName =
    record.acceptedScientificName ||
    record.species ||
    record.scientificName ||
    "Unknown";

  const matchingSpecies =
    KINGFISHER_SPECIES.find(
      (species) =>
        species.scientificName
          .toLowerCase() ===
        scientificName
          .toLowerCase()
    );

  const commonName =
    matchingSpecies?.commonName ||
    record.vernacularName ||
    scientificName;

  const media =
    Array.isArray(
      record.media
    )
      ? record.media
          .map(
            (item, index) =>
              getGBIFImageData(
                item,
                record.key,
                index
              )
          )
          .filter(Boolean)
      : [];

  const latitude =
    record.decimalLatitude !==
      undefined &&
    record.decimalLatitude !==
      null
      ? Number(
          record.decimalLatitude
        )
      : null;

  const longitude =
    record.decimalLongitude !==
      undefined &&
    record.decimalLongitude !==
      null
      ? Number(
          record.decimalLongitude
        )
      : null;

  return {
    id:
      `gbif-${record.key}`,

    species: {
      commonName,

      scientificName:
        matchingSpecies?.scientificName ||
        scientificName,
    },

    observation: {
      date:
        record.eventDate ||
        record.dateIdentified ||
        null,

      time:
        null,

      count:
        record.individualCount ||
        null,
    },

    location: {
      name:
        record.locality ||
        record.municipality ||
        record.stateProvince ||
        "Bengaluru",

      city:
        record.municipality ||
        "Bengaluru",

      state:
        record.stateProvince ||
        "Karnataka",

      country:
        record.country ||
        "India",

      latitude,

      longitude,

      coordinatesAvailable:
        latitude !== null &&
        longitude !== null,
    },

    source: {
      platform:
        "GBIF",

      observationId:
        record.key,

      url:
        `https://www.gbif.org/occurrence/${record.key}`,

      license:
        record.license ||
        null,

      dataset:
        record.datasetName ||
        null,

      datasetKey:
        record.datasetKey ||
        null,

      occurrenceId:
        record.occurrenceID ||
        null,

      recordedBy:
        record.recordedBy ||
        null,

      retrievedAt:
        new Date().toISOString(),
    },

    verification: {
      qualityGrade:
        null,

      isResearchGrade:
        false,

      geoprivacy:
        null,

      coordinatesObscured:
        false,
    },

    media,

    primaryImageUrl:
      media.length > 0
        ? media[0].url
        : null,

    imageSource:
      media.length > 0
        ? "GBIF"
        : null,

    rarity: {
      localLabel:
        null,

      localScore:
        null,
    },
  };
}

/* ============================================================
   GBIF BENGALURU GEOMETRY
============================================================ */

function getBengaluruGBIFGeometry() {
  const swLat =
    BENGALURU_BOUNDS.swlat;

  const swLng =
    BENGALURU_BOUNDS.swlng;

  const neLat =
    BENGALURU_BOUNDS.nelat;

  const neLng =
    BENGALURU_BOUNDS.nelng;

  return [
    "POLYGON((",
    `${swLng} ${swLat},`,
    `${neLng} ${swLat},`,
    `${neLng} ${neLat},`,
    `${swLng} ${neLat},`,
    `${swLng} ${swLat}`,
    "))",
  ].join("");
}

/* ============================================================
   GBIF ADAPTER
============================================================ */

async function fetchGBIFSpecies(
  species
) {
  const currentYear =
    new Date().getFullYear();

  const startYear =
    currentYear - 1;

  const params =
    new URLSearchParams();

  params.set(
    "scientificName",
    species.scientificName
  );

  params.set(
    "country",
    "IN"
  );

  params.set(
    "stateProvince",
    "Karnataka"
  );

  params.set(
    "geometry",
    getBengaluruGBIFGeometry()
  );

  params.set(
    "hasCoordinate",
    "true"
  );

  params.set(
    "hasGeospatialIssue",
    "false"
  );

  params.set(
    "occurrenceStatus",
    "present"
  );

  params.set(
    "mediaType",
    "StillImage"
  );

  params.set(
    "limit",
    "100"
  );

  params.set(
    "offset",
    "0"
  );

  params.set(
    "year",
    `${startYear},${currentYear}`
  );

  const url =
    `https://api.gbif.org/v1/occurrence/search?${params.toString()}`;

  const data =
    await fetchJson(url);

  return {
    source:
      "GBIF",

    species,

    count:
      data.count || 0,

    observations:
      data.results || [],
  };
}

/* ============================================================
   GBIF SAFETY FILTER
============================================================ */

function isINaturalistDerivedGBIFRecord(
  record
) {
  const values = [
    record.datasetName,
    record.datasetKey,
    record.publishingOrgKey,
    record.references,
    record.occurrenceID,
    record.institutionCode,
    record.collectionCode,
    record.recordedBy,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    values.includes(
      "inaturalist"
    ) ||
    values.includes(
      "i-naturalist"
    ) ||
    values.includes(
      "inat"
    )
  );
}

/* ============================================================
   COORDINATE VALIDATION
============================================================ */

function isInsideBengaluruBounds(
  latitude,
  longitude
) {
  if (
    latitude === null ||
    latitude === undefined ||
    longitude === null ||
    longitude === undefined
  ) {
    return false;
  }

  const lat =
    Number(latitude);

  const lng =
    Number(longitude);

  if (
    Number.isNaN(lat) ||
    Number.isNaN(lng)
  ) {
    return false;
  }

  return (
    lat >= BENGALURU_BOUNDS.swlat &&
    lat <= BENGALURU_BOUNDS.nelat &&
    lng >= BENGALURU_BOUNDS.swlng &&
    lng <= BENGALURU_BOUNDS.nelng
  );
}

/* ============================================================
   DATE FILTER
============================================================ */

function isWithinLookbackPeriod(
  dateValue
) {
  if (!dateValue) {
    return false;
  }

  const date =
    new Date(dateValue);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return false;
  }

  const minimum =
    new Date();

  minimum.setDate(
    minimum.getDate() -
      LOOKBACK_DAYS
  );

  return date >= minimum;
}

/* ============================================================
   EXACT SOURCE DEDUPLICATION
============================================================ */

function deduplicateSightings(
  sightings
) {
  const seen =
    new Set();

  const unique = [];

  for (
    const sighting of sightings
  ) {
    const platform =
      sighting.source?.platform ||
      "unknown";

    const sourceId =
      sighting.source
        ?.observationId ||
      sighting.id;

    const key =
      `${platform}:${sourceId}`;

    if (
      seen.has(key)
    ) {
      continue;
    }

    seen.add(key);

    unique.push(
      sighting
    );
  }

  return unique;
}

/* ============================================================
   LOCATION NORMALIZATION
============================================================ */

function normalizeLocationName(
  name
) {
  if (!name) {
    return "";
  }

  return String(name)
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

/* ============================================================
   COORDINATE ROUNDING
============================================================ */

function roundCoordinate(
  value,
  decimals = 4
) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const number =
    Number(value);

  if (
    Number.isNaN(number)
  ) {
    return null;
  }

  return Number(
    number.toFixed(decimals)
  );
}

/* ============================================================
   VISUAL DUPLICATE KEY
============================================================ */

function getVisualDuplicateKey(
  sighting
) {
  const species =
    sighting.species
      ?.scientificName ||
    sighting.species
      ?.commonName ||
    "unknown";

  const date =
    sighting.observation
      ?.date ||
    "unknown-date";

  const lat =
    roundCoordinate(
      sighting.location
        ?.latitude
    );

  const lng =
    roundCoordinate(
      sighting.location
        ?.longitude
    );

  if (
    lat !== null &&
    lng !== null
  ) {
    return [
      species.toLowerCase(),
      date,
      lat,
      lng,
    ].join("|");
  }

  return [
    species.toLowerCase(),
    date,
    normalizeLocationName(
      sighting.location
        ?.name
    ),
  ].join("|");
}

/* ============================================================
   VISUAL DEDUPLICATION
============================================================ */

function deduplicateVisualSightings(
  sightings
) {
  const map =
    new Map();

  for (
    const sighting of sightings
  ) {
    const key =
      getVisualDuplicateKey(
        sighting
      );

    const existing =
      map.get(key);

    if (!existing) {
      map.set(
        key,
        sighting
      );

      continue;
    }

    const existingSource =
      existing.source
        ?.platform;

    const currentSource =
      sighting.source
        ?.platform;

    /*
      Prefer iNaturalist over GBIF.
    */

    if (
      currentSource ===
        "iNaturalist" &&
      existingSource !==
        "iNaturalist"
    ) {
      map.set(
        key,
        sighting
      );

      continue;
    }

    /*
      Otherwise prefer a record
      that has an image.
    */

    const existingHasImage =
      Boolean(
        existing.primaryImageUrl
      );

    const currentHasImage =
      Boolean(
        sighting.primaryImageUrl
      );

    if (
      currentHasImage &&
      !existingHasImage
    ) {
      map.set(
        key,
        sighting
      );
    }
  }

  return [
    ...map.values(),
  ];
}

/* ============================================================
   CROSS-SOURCE IDENTITY DEDUPLICATION
============================================================ */

function hasSameObservationIdentity(
  a,
  b
) {
  if (!a || !b) {
    return false;
  }

  const aPlatform =
    a.source?.platform;

  const bPlatform =
    b.source?.platform;

  const aObservation =
    a.source
      ?.observationId;

  const bObservation =
    b.source
      ?.observationId;

  const aOccurrence =
    a.source
      ?.occurrenceId;

  const bOccurrence =
    b.source
      ?.occurrenceId;

  if (
    aPlatform ===
      "GBIF" &&
    bPlatform ===
      "iNaturalist" &&
    aOccurrence &&
    bObservation
  ) {
    return String(
      aOccurrence
    ).includes(
      String(
        bObservation
      )
    );
  }

  if (
    bPlatform ===
      "GBIF" &&
    aPlatform ===
      "iNaturalist" &&
    bOccurrence &&
    aObservation
  ) {
    return String(
      bOccurrence
    ).includes(
      String(
        aObservation
      )
    );
  }

  return false;
}

/* ============================================================
   CROSS-SOURCE DEDUPLICATION
============================================================ */

function deduplicateAcrossSources(
  sightings
) {
  const result = [];

  for (
    const sighting of sightings
  ) {
    const duplicate =
      result.some(
        (existing) =>
          hasSameObservationIdentity(
            sighting,
            existing
          ) ||
          hasSameObservationIdentity(
            existing,
            sighting
          )
      );

    if (!duplicate) {
      result.push(
        sighting
      );
    }
  }

  return result;
}

/* ============================================================
   SORT SIGHTINGS
============================================================ */

function sortSightings(
  sightings
) {
  return [
    ...sightings,
  ].sort(
    (a, b) => {
      const dateA =
        new Date(
          a.observation
            ?.date ||
            0
        );

      const dateB =
        new Date(
          b.observation
            ?.date ||
            0
        );

      return (
        dateB.getTime() -
        dateA.getTime()
      );
    }
  );
}

/* ============================================================
   IMAGE QUALITY HELPERS
============================================================ */

function getImageScore(
  image
) {
  if (!image) {
    return 0;
  }

  let score = 0;

  if (
    image.source ===
    "iNaturalist"
  ) {
    score += 30;
  }

  if (
    image.source ===
    "GBIF"
  ) {
    score += 20;
  }

  if (
    image.originalUrl
  ) {
    score += 20;
  }

  if (
    image.cacheUrl
  ) {
    score += 10;
  }

  if (
    image.url
  ) {
    score += 10;
  }

  return score;
}

function sortMedia(
  media
) {
  return [
    ...(media || []),
  ].sort(
    (a, b) =>
      getImageScore(b) -
      getImageScore(a)
  );
}

/* ============================================================
   WIKIMEDIA COMMONS
   SPECIES REFERENCE IMAGE ADAPTER
============================================================ */

async function fetchWikimediaReferenceImages(
  species
) {
  const params =
    new URLSearchParams({
      action:
        "query",

      generator:
        "search",

      gsrsearch:
        `${species.scientificName} kingfisher`,

      gsrnamespace:
        "6",

      gsrlimit:
        "8",

      prop:
        "imageinfo",

      iiprop:
        "url|size|mime|extmetadata",

      iiurlwidth:
        "1200",

      format:
        "json",

      origin:
        "*",
    });

  const url =
    `https://commons.wikimedia.org/w/api.php?${params.toString()}`;

  const data =
    await fetchJson(url);

  const pages =
    data.query?.pages
      ? Object.values(
          data.query.pages
        )
      : [];

  return pages
    .filter(
      (page) =>
        page.imageinfo?.[0]
    )
    .map(
      (page) => {
        const info =
          page.imageinfo[0];

        const metadata =
          info.extmetadata ||
          {};

        const artist =
          metadata.Artist?.value ||
          metadata.Credit?.value ||
          "Unknown";

        const license =
          metadata.LicenseShortName
            ?.value ||
          metadata.License
            ?.value ||
          "See source";

        return {
          id:
            `commons-${page.pageid}`,

          url:
            info.url ||
            info.thumburl ||
            null,

          thumbnailUrl:
            info.thumburl ||
            info.url ||
            null,

          originalUrl:
            info.url ||
            null,

          title:
            page.title,

          source:
            "Wikimedia Commons",

          sourceUrl:
            `https://commons.wikimedia.org/wiki/${encodeURIComponent(
              page.title.replace(
                / /g,
                "_"
              )
            )}`,

          author:
            artist,

          license,

          width:
            info.width ||
            null,

          height:
            info.height ||
            null,

          type:
            "species-reference",

          isObservationImage:
            false,
        };
      }
    )
    .filter(
      (image) =>
        image.url
    );
}

/* ============================================================
   API: HEALTH
============================================================ */

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      success:
        true,

      service:
        "KingFinder API",

      status:
        "running",

      sources: [
        "iNaturalist",
        "GBIF",
        "Wikimedia Commons",
      ],

      region:
        "Bengaluru, Karnataka, India",

      timestamp:
        new Date().toISOString(),
    });
  }
);

/* ============================================================
   API: SIGHTINGS
============================================================ */

app.get(
  "/api/sightings",
  async (req, res) => {
    try {
      console.log(
        "=========================================="
      );

      console.log(
        "KingFinder: fetching iNaturalist..."
      );

      const inatResults =
        await Promise.allSettled(
          KINGFISHER_SPECIES.map(
            fetchINaturalistSpecies
          )
        );

      console.log(
        "KingFinder: fetching GBIF..."
      );

      const gbifResults =
        await Promise.allSettled(
          KINGFISHER_SPECIES.map(
            fetchGBIFSpecies
          )
        );

      /* ========================================================
         iNATURALIST
      ======================================================== */

      const inatObservations =
        inatResults
          .filter(
            (result) =>
              result.status ===
              "fulfilled"
          )
          .flatMap(
            (result) =>
              result.value
                .observations
          );

      console.log(
        `iNaturalist raw observations: ${inatObservations.length}`
      );

      const inatSightings =
        inatObservations
          .map(
            normalizeINaturalistObservation
          )
          .filter(
            (sighting) =>
              isWithinLookbackPeriod(
                sighting
                  .observation
                  ?.date
              )
          )
          .filter(
            (sighting) =>
              isInsideBengaluruBounds(
                sighting
                  .location
                  ?.latitude,

                sighting
                  .location
                  ?.longitude
              )
          );

      console.log(
        `iNaturalist valid Bengaluru sightings: ${inatSightings.length}`
      );

      /* ========================================================
         GBIF
      ======================================================== */

      const gbifObservations =
        gbifResults
          .filter(
            (result) =>
              result.status ===
              "fulfilled"
          )
          .flatMap(
            (result) =>
              result.value
                .observations
          )
          .filter(
            (record) =>
              !isINaturalistDerivedGBIFRecord(
                record
              )
          )
          .filter(
            (record) =>
              isWithinLookbackPeriod(
                record.eventDate
              )
          )
          .filter(
            (record) =>
              isInsideBengaluruBounds(
                record.decimalLatitude,
                record.decimalLongitude
              )
          );

      console.log(
        `GBIF valid Bengaluru sightings: ${gbifObservations.length}`
      );

      const gbifSightings =
        gbifObservations.map(
          normalizeGBIFObservation
        );

      /* ========================================================
         COMBINE
      ======================================================== */

      const combined = [
        ...inatSightings,
        ...gbifSightings,
      ];

      console.log(
        `Combined records: ${combined.length}`
      );

      /* ========================================================
         SOURCE DEDUPLICATION
      ======================================================== */

      const sourceUnique =
        deduplicateSightings(
          combined
        );

      console.log(
        `After source deduplication: ${sourceUnique.length}`
      );

      /* ========================================================
         CROSS-SOURCE DEDUPLICATION
      ======================================================== */

      const crossSourceUnique =
        deduplicateAcrossSources(
          sourceUnique
        );

      console.log(
        `After cross-source deduplication: ${crossSourceUnique.length}`
      );

      /* ========================================================
         VISUAL / EVENT DEDUPLICATION
      ======================================================== */

      const finalSightings =
        deduplicateVisualSightings(
          crossSourceUnique
        );

      console.log(
        `After visual deduplication: ${finalSightings.length}`
      );

      /* ========================================================
         IMAGE SORTING
      ======================================================== */

      for (
        const sighting of finalSightings
      ) {
        sighting.media =
          sortMedia(
            sighting.media
          );

        sighting.primaryImageUrl =
          sighting.media?.length > 0
            ? sighting.media[0].url
            : null;

        sighting.imageSource =
          sighting.media?.length > 0
            ? sighting.media[0].source
            : null;

        sighting.hasImage =
          Boolean(
            sighting.primaryImageUrl
          );

        sighting.imageCount =
          sighting.media?.length ||
          0;
      }

      /* ========================================================
         SORT
      ======================================================== */

      const sortedSightings =
        sortSightings(
          finalSightings
        );

      /* ========================================================
         SOURCE COUNTS
      ======================================================== */

      const sourceCounts =
        sortedSightings.reduce(
          (
            counts,
            sighting
          ) => {
            const source =
              sighting
                .source
                ?.platform ||
              "Unknown";

            counts[source] =
              (
                counts[source] ||
                0
              ) + 1;

            return counts;
          },
          {}
        );

      /* ========================================================
         SPECIES COUNTS
      ======================================================== */

      const speciesCounts =
        sortedSightings.reduce(
          (
            counts,
            sighting
          ) => {
            const name =
              sighting
                .species
                ?.commonName ||
              "Unknown";

            counts[name] =
              (
                counts[name] ||
                0
              ) + 1;

            return counts;
          },
          {}
        );

      /* ========================================================
         UNIQUE LOCATION COUNT
      ======================================================== */

      const locationKeys =
        new Set();

      for (
        const sighting of sortedSightings
      ) {
        const lat =
          roundCoordinate(
            sighting
              .location
              ?.latitude
          );

        const lng =
          roundCoordinate(
            sighting
              .location
              ?.longitude
          );

        if (
          lat !== null &&
          lng !== null
        ) {
          locationKeys.add(
            `${lat},${lng}`
          );
        }
      }

      /* ========================================================
         RESPONSE
      ======================================================== */

      const response = {
        success:
          true,

        region: {
          city:
            "Bengaluru",

          state:
            "Karnataka",

          country:
            "India",
        },

        retrievedAt:
          new Date().toISOString(),

        today:
          getToday(),

        lookbackDays:
          LOOKBACK_DAYS,

        bounds:
          BENGALURU_BOUNDS,

        sources: [
          "iNaturalist",
          "GBIF",
        ],

        sourceCounts,

        speciesCounts,

        count:
          sortedSightings.length,

        uniqueLocationCount:
          locationKeys.size,

        sightings:
          sortedSightings,
      };

      console.log(
        "=========================================="
      );

      console.log(
        `FINAL SIGHTINGS: ${response.count}`
      );

      console.log(
        `UNIQUE LOCATIONS: ${response.uniqueLocationCount}`
      );

      console.log(
        `SOURCES: ${JSON.stringify(
          sourceCounts
        )}`
      );

      console.log(
        "=========================================="
      );

      res.json(
        response
      );
    } catch (error) {
      console.error(
        "KingFinder sightings error:",
        error
      );

      res.status(
        500
      ).json({
        success:
          false,

        message:
          "Unable to retrieve KingFinder sightings.",

        error:
          error.message,
      });
    }
  }
);

/* ============================================================
   API: SPECIES REFERENCE IMAGES
============================================================ */

app.get(
  "/api/species-reference-images",
  async (req, res) => {
    try {
      const requestedSpecies =
        req.query.species;

      const speciesList =
        requestedSpecies
          ? KINGFISHER_SPECIES.filter(
              (species) =>
                species.scientificName ===
                  requestedSpecies ||
                species.commonName ===
                  requestedSpecies
            )
          : KINGFISHER_SPECIES;

      const results =
        await Promise.allSettled(
          speciesList.map(
            fetchWikimediaReferenceImages
          )
        );

      const references =
        results.flatMap(
          (
            result,
            index
          ) => {
            if (
              result.status !==
              "fulfilled"
            ) {
              return [];
            }

            return [
              {
                species:
                  speciesList[index],

                images:
                  result.value,
              },
            ];
          }
        );

      res.json({
        success:
          true,

        source:
          "Wikimedia Commons",

        retrievedAt:
          new Date().toISOString(),

        references,
      });
    } catch (error) {
      console.error(
        "Reference image error:",
        error
      );

      res.status(
        500
      ).json({
        success:
          false,

        message:
          "Unable to retrieve species reference images.",

        error:
          error.message,
      });
    }
  }
);

/* ============================================================
   API: SPECIES LIST
============================================================ */

app.get(
  "/api/species",
  (req, res) => {
    res.json({
      success:
        true,

      count:
        KINGFISHER_SPECIES.length,

      species:
        KINGFISHER_SPECIES,
    });
  }
);

/* ============================================================
   API: DEBUG
============================================================ */

app.get(
  "/api/debug",
  async (req, res) => {
    try {
      const inatResults =
        await Promise.allSettled(
          KINGFISHER_SPECIES.map(
            fetchINaturalistSpecies
          )
        );

      const gbifResults =
        await Promise.allSettled(
          KINGFISHER_SPECIES.map(
            fetchGBIFSpecies
          )
        );

      const inatRaw =
        inatResults
          .filter(
            (result) =>
              result.status ===
              "fulfilled"
          )
          .flatMap(
            (result) =>
              result.value
                .observations
          );

      const gbifRaw =
        gbifResults
          .filter(
            (result) =>
              result.status ===
              "fulfilled"
          )
          .flatMap(
            (result) =>
              result.value
                .observations
          );

      const gbifAfterFilters =
        gbifRaw
          .filter(
            (record) =>
              !isINaturalistDerivedGBIFRecord(
                record
              )
          )
          .filter(
            (record) =>
              isWithinLookbackPeriod(
                record.eventDate
              )
          )
          .filter(
            (record) =>
              isInsideBengaluruBounds(
                record.decimalLatitude,
                record.decimalLongitude
              )
          );

      const normalizedINat =
        inatRaw
          .map(
            normalizeINaturalistObservation
          )
          .filter(
            (sighting) =>
              isWithinLookbackPeriod(
                sighting
                  .observation
                  ?.date
              )
          )
          .filter(
            (sighting) =>
              isInsideBengaluruBounds(
                sighting
                  .location
                  ?.latitude,

                sighting
                  .location
                  ?.longitude
              )
          );

      const normalizedGBIF =
        gbifAfterFilters.map(
          normalizeGBIFObservation
        );

      const combined = [
        ...normalizedINat,
        ...normalizedGBIF,
      ];

      const sourceUnique =
        deduplicateSightings(
          combined
        );

      const crossSourceUnique =
        deduplicateAcrossSources(
          sourceUnique
        );

      const visualUnique =
        deduplicateVisualSightings(
          crossSourceUnique
        );

      res.json({
        success:
          true,

        region: {
          city:
            "Bengaluru",

          state:
            "Karnataka",

          country:
            "India",
        },

        bounds:
          BENGALURU_BOUNDS,

        species:
          KINGFISHER_SPECIES,

        totals: {
          iNaturalistRaw:
            inatRaw.length,

          iNaturalistBengaluru:
            normalizedINat.length,

          gbifRaw:
            gbifRaw.length,

          gbifBengaluruAfterFilters:
            normalizedGBIF.length,

          combined:
            combined.length,

          afterSourceDedup:
            sourceUnique.length,

          afterCrossSourceDedup:
            crossSourceUnique.length,

          afterVisualDedup:
            visualUnique.length,
        },

        sourceCounts:
          visualUnique.reduce(
            (
              counts,
              sighting
            ) => {
              const source =
                sighting
                  .source
                  ?.platform ||
                "Unknown";

              counts[source] =
                (
                  counts[source] ||
                  0
                ) + 1;

              return counts;
            },
            {}
          ),

        sample:
          visualUnique.slice(
            0,
            10
          ),
      });
    } catch (error) {
      console.error(
        "Debug endpoint error:",
        error
      );

      res.status(
        500
      ).json({
        success:
          false,

        error:
          error.message,
      });
    }
  }
);

/* ============================================================
   SERVER
============================================================ */

app.listen(
  PORT,
  () => {
    console.log(
      "=========================================="
    );

    console.log(
      `KingFinder API running at http://localhost:${PORT}`
    );

    console.log(
      "Sources: iNaturalist + GBIF + Wikimedia Commons"
    );

    console.log(
      "Region: Bengaluru, Karnataka, India"
    );

    console.log(
      `Lookback: ${LOOKBACK_DAYS} days`
    );

    console.log(
      "=========================================="
    );
  }
);