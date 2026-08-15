import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// --------------------------------------------------
// Fix Leaflet marker icons
// --------------------------------------------------

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",

  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",

  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// --------------------------------------------------
// Fix map sizing after render
// --------------------------------------------------

function ResizeMap() {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

// --------------------------------------------------
// Google Maps URL
// --------------------------------------------------

function getGoogleMapsUrl(latitude, longitude) {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

// --------------------------------------------------
// Get stable source name
// --------------------------------------------------

function getSourceName(sighting) {
  return (
    sighting.source?.platform ||
    sighting.source?.name ||
    sighting.source?.type ||
    "unknown"
  );
}

// --------------------------------------------------
// Get stable observation ID
// --------------------------------------------------

function getObservationId(sighting) {
  return (
    sighting.source?.observationId ??
    sighting.observation?.observationId ??
    sighting.id
  );
}

// --------------------------------------------------
// Get best available image
//
// Prefer originalUrl because it generally gives us the
// highest-quality image available from the API.
//
// Then fall back to url.
// --------------------------------------------------

function getBestImage(sighting) {
  const media = sighting.media?.[0];

  if (!media) {
    return null;
  }

  return (
    media.originalUrl ||
    media.url ||
    null
  );
}

// --------------------------------------------------
// Kingfisher Map
// --------------------------------------------------

function KingfisherMap({
  sightings = [],
}) {
  // ------------------------------------------------
  // Keep only sightings with valid coordinates
  // ------------------------------------------------

  const validSightings = useMemo(() => {
    return sightings.filter((sighting) => {
      const latitude =
        sighting.location?.latitude;

      const longitude =
        sighting.location?.longitude;

      return (
        typeof latitude === "number" &&
        typeof longitude === "number" &&
        Number.isFinite(latitude) &&
        Number.isFinite(longitude)
      );
    });
  }, [sightings]);

  // ------------------------------------------------
  // Calculate UNIQUE MAP LOCATIONS
  //
  // Multiple sightings can happen at the same place.
  //
  // Therefore:
  //
  // 206 sightings
  //
  // does NOT necessarily mean:
  //
  // 206 locations
  //
  // We round coordinates slightly so tiny coordinate
  // differences don't create unnecessary duplicate
  // locations.
  // ------------------------------------------------

  const uniqueMapLocations = useMemo(() => {
    const seenLocations = new Set();
    const locations = [];

    validSightings.forEach((sighting) => {
      const latitude =
        sighting.location.latitude;

      const longitude =
        sighting.location.longitude;

      const locationKey =
        `${Number(latitude).toFixed(4)},${Number(
          longitude
        ).toFixed(4)}`;

      if (!seenLocations.has(locationKey)) {
        seenLocations.add(locationKey);

        locations.push({
          key: locationKey,
          latitude,
          longitude,
          sighting,
        });
      }
    });

    return locations;
  }, [validSightings]);

  // ------------------------------------------------
  // Render
  // ------------------------------------------------

  return (
    <section className="map-section">

      {/* ---------------------------------------- */}
      {/* Map Header */}
      {/* ---------------------------------------- */}

      <div className="map-header">

        <div>

          <p className="eyebrow">
            SIGHTING MAP
          </p>

          <h2>
            Kingfisher Locations
          </h2>

          <p>
            Explore recent kingfisher
            observations around Bengaluru.
          </p>

        </div>

        {/* -------------------------------------- */}
        {/* IMPORTANT:
            Show UNIQUE LOCATIONS, not sightings
        */}
        {/* -------------------------------------- */}

        <span className="map-count">
          {uniqueMapLocations.length} locations
        </span>

      </div>

      {/* ---------------------------------------- */}
      {/* Map */}
      {/* ---------------------------------------- */}

      <div className="kingfisher-map">

        <MapContainer
          center={[12.9716, 77.5946]}
          zoom={11}
          scrollWheelZoom={true}
          style={{
            width: "100%",
            height: "100%",
          }}
        >

          <ResizeMap />

          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* ------------------------------------ */}
          {/* Markers */}
          {/* ------------------------------------ */}

          {validSightings.map(
            (sighting) => {

              const latitude =
                sighting.location.latitude;

              const longitude =
                sighting.location.longitude;

              const googleMapsUrl =
                getGoogleMapsUrl(
                  latitude,
                  longitude
                );

              // --------------------------------
              // Better image quality
              // --------------------------------

              const photo =
                getBestImage(sighting);

              // --------------------------------
              // Species
              // --------------------------------

              const speciesName =
                sighting.species?.commonName ||
                "Kingfisher";

              const scientificName =
                sighting.species
                  ?.scientificName ||
                "";

              // --------------------------------
              // Location
              // --------------------------------

              const locationName =
                sighting.location?.name ||
                "Bengaluru";

              // --------------------------------
              // Date
              // --------------------------------

              const observationDate =
                sighting.observation?.date ||
                "Date unavailable";

              // --------------------------------
              // Stable React key
              //
              // Source + observation ID prevents
              // collisions between different APIs.
              // --------------------------------

              const source =
                getSourceName(sighting);

              const observationId =
                getObservationId(sighting);

              const markerKey =
                `${source}-${observationId}`;

              return (
                <Marker
                  key={markerKey}
                  position={[
                    latitude,
                    longitude,
                  ]}
                >

                  <Popup
                    maxWidth={320}
                    minWidth={260}
                  >

                    <div className="map-popup">

                      {/* ======================== */}
                      {/* PHOTO */}
                      {/* ======================== */}

                      {photo && (
                        <img
                          src={photo}
                          alt={speciesName}
                          className="map-popup-image"
                          loading="lazy"
                          decoding="async"
                        />
                      )}

                      {/* ======================== */}
                      {/* SPECIES */}
                      {/* ======================== */}

                      <p className="map-popup-label">
                        KINGFISHER SIGHTING
                      </p>

                      <h3>
                        {speciesName}
                      </h3>

                      {scientificName && (
                        <p className="popup-scientific">
                          {scientificName}
                        </p>
                      )}

                      {/* ======================== */}
                      {/* LOCATION */}
                      {/* ======================== */}

                      <div className="popup-detail">

                        <span className="popup-icon">
                          📍
                        </span>

                        <span>
                          {locationName}
                        </span>

                      </div>

                      {/* ======================== */}
                      {/* DATE */}
                      {/* ======================== */}

                      <div className="popup-detail">

                        <span className="popup-icon">
                          📅
                        </span>

                        <span>
                          {observationDate}
                        </span>

                      </div>

                      {/* ======================== */}
                      {/* BIRD COUNT */}
                      {/* ======================== */}

                      {sighting.observation
                        ?.count && (

                        <div className="popup-detail">

                          <span className="popup-icon">
                            🐦
                          </span>

                          <span>
                            Birds observed:{" "}
                            {
                              sighting
                                .observation
                                .count
                            }
                          </span>

                        </div>

                      )}

                      {/* ======================== */}
                      {/* RESEARCH GRADE */}
                      {/* ======================== */}

                      {sighting.verification
                        ?.isResearchGrade && (

                        <div className="research-badge">
                          ✓ Research Grade
                        </div>

                      )}

                      {/* ======================== */}
                      {/* COORDINATES */}
                      {/* ======================== */}

                      <p className="popup-coordinates">
                        {latitude.toFixed(5)},{" "}
                        {longitude.toFixed(5)}
                      </p>

                      {/* ======================== */}
                      {/* GOOGLE MAPS */}
                      {/* ======================== */}

                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="google-maps-button"
                      >
                        📍 Open in Google Maps
                      </a>

                      {/* ======================== */}
                      {/* ORIGINAL OBSERVATION */}
                      {/* ======================== */}

                      {sighting.source?.url && (

                        <a
                          href={
                            sighting.source.url
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="observation-link"
                        >
                          View original
                          observation →
                        </a>

                      )}

                    </div>

                  </Popup>

                </Marker>
              );
            }
          )}

        </MapContainer>

      </div>
    </section>
  );
}

export default KingfisherMap;