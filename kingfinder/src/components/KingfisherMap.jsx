import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  getGoogleMapsUrl,
  getSourceName,
  getObservationId,
  getBestImage,
} from "../utils/sightingHelpers";

// ============================================================
// DEFAULT LEAFLET MARKER ICON
// ============================================================

const defaultKingfisherIcon = L.icon({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",

  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",

  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",

  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// ============================================================
// FIX MAP SIZING AFTER RENDER
// ============================================================

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

// ============================================================
// MOVE MAP TO USER / NEAREST SIGHTING
// ============================================================

function MapLocationController({
  userLocation,
  nearestSighting,
}) {
  const map = useMap();

  useEffect(() => {
    if (!userLocation) {
      return;
    }

    if (nearestSighting) {
      const nearestLatitude = Number(
        nearestSighting.location.latitude
      );

      const nearestLongitude = Number(
        nearestSighting.location.longitude
      );

      const bounds = L.latLngBounds([
        [
          userLocation.latitude,
          userLocation.longitude,
        ],
        [
          nearestLatitude,
          nearestLongitude,
        ],
      ]);

      map.fitBounds(bounds, {
        padding: [70, 70],
        maxZoom: 14,
      });

      return;
    }

    map.setView(
      [
        userLocation.latitude,
        userLocation.longitude,
      ],
      13
    );
  }, [map, userLocation, nearestSighting]);

  return null;
}


// ============================================================
// DEGREES TO RADIANS
// ============================================================

function toRadians(value) {
  return (value * Math.PI) / 180;
}

// ============================================================
// HAVERSINE DISTANCE
// ============================================================

function calculateDistanceKm(
  latitude1,
  longitude1,
  latitude2,
  longitude2
) {
  const earthRadiusKm = 6371;

  const dLatitude = toRadians(
    latitude2 - latitude1
  );

  const dLongitude = toRadians(
    longitude2 - longitude1
  );

  const lat1 = toRadians(latitude1);
  const lat2 = toRadians(latitude2);

  const a =
    Math.sin(dLatitude / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLongitude / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadiusKm * c;
}

// ============================================================
// FORMAT DISTANCE
// ============================================================

function formatDistance(distanceKm) {
  if (!Number.isFinite(distanceKm)) {
    return "Distance unavailable";
  }

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m away`;
  }

  return `${distanceKm.toFixed(1)} km away`;
}

// ============================================================
// USER LOCATION ICON
// ============================================================

const userLocationIcon = L.divIcon({
  className: "user-location-marker",

  html: `
    <div class="user-location-dot">
      <div class="user-location-pulse"></div>
    </div>
  `,

  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// ============================================================
// NEAREST KINGFISHER ICON
// ============================================================

const nearestKingfisherIcon = L.divIcon({
  className: "nearest-kingfisher-marker",

  html: `
    <div class="nearest-kingfisher-pin">
      <span>🐦</span>
    </div>
  `,

  iconSize: [42, 42],
  iconAnchor: [21, 42],
  popupAnchor: [0, -40],
});

// ============================================================
// KINGFISHER MAP
// ============================================================

function KingfisherMap({
  sightings = [],
}) {
  // ==========================================================
  // USER LOCATION
  // ==========================================================

  const [userLocation, setUserLocation] = useState(null);

  // ==========================================================
  // LOCATION LOADING
  // ==========================================================

  const [
    locationLoading,
    setLocationLoading,
  ] = useState(false);

  // ==========================================================
  // LOCATION ERROR
  // ==========================================================

  const [
    locationError,
    setLocationError,
  ] = useState("");

  // ==========================================================
  // VALID SIGHTINGS
  // ==========================================================

  const validSightings = useMemo(() => {
    return sightings.filter((sighting) => {
      const latitude = Number(
        sighting.location?.latitude
      );

      const longitude = Number(
        sighting.location?.longitude
      );

      return (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude)
      );
    });
  }, [sightings]);

  // ==========================================================
  // UNIQUE MAP LOCATIONS
  // ==========================================================

  const uniqueMapLocations = useMemo(() => {
    const seenLocations = new Set();
    const locations = [];

    validSightings.forEach((sighting) => {
      const latitude = Number(
        sighting.location.latitude
      );

      const longitude = Number(
        sighting.location.longitude
      );

      const locationKey =
        `${latitude.toFixed(4)},${longitude.toFixed(4)}`;

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

  // ==========================================================
  // FIND NEAREST SIGHTING
  // ==========================================================

  const nearestSighting = useMemo(() => {
    if (!userLocation) {
      return null;
    }

    if (validSightings.length === 0) {
      return null;
    }

    let nearest = null;
    let shortestDistance = Infinity;

    validSightings.forEach((sighting) => {
      const latitude = Number(
        sighting.location.latitude
      );

      const longitude = Number(
        sighting.location.longitude
      );

      const distanceKm = calculateDistanceKm(
        userLocation.latitude,
        userLocation.longitude,
        latitude,
        longitude
      );

      if (distanceKm < shortestDistance) {
        shortestDistance = distanceKm;

        nearest = {
          ...sighting,
          distanceKm,
        };
      }
    });

    return nearest;
  }, [userLocation, validSightings]);

  // ==========================================================
  // GET USER LOCATION
  // ==========================================================

  const findMyLocation = () => {
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError(
        "Your browser does not support location services."
      );

      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        setUserLocation({
          latitude,
          longitude,
        });

        setLocationLoading(false);
      },

      (error) => {
        console.error(
          "KingFinder location error:",
          error
        );

        let message =
          "Unable to get your location.";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            message =
              "Location permission was denied. Please allow location access in your browser.";
            break;

          case error.POSITION_UNAVAILABLE:
            message =
              "Your location is currently unavailable. Please try again.";
            break;

          case error.TIMEOUT:
            message =
              "Getting your location took too long. Please try again.";
            break;

          default:
            message =
              "Unable to get your location. Please try again.";
        }

        setLocationError(message);
        setLocationLoading(false);
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000,
      }
    );
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <section className="map-section">

      {/* ======================================================
          MAP HEADER
      ====================================================== */}

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

        <div className="map-header-actions">

          <span className="map-count">
            {uniqueMapLocations.length} locations
          </span>

          <button
            type="button"
            className="find-location-button"
            onClick={findMyLocation}
            disabled={locationLoading}
          >
            <span>
              📍
            </span>

            {locationLoading
              ? "Finding you..."
              : "Find Near Me"}
          </button>

        </div>

      </div>

      {/* ======================================================
          LOCATION ERROR
      ====================================================== */}

      {locationError && (
        <div className="location-message location-error">

          <span>
            ⚠️
          </span>

          <div>

            <strong>
              Location unavailable
            </strong>

            <p>
              {locationError}
            </p>

          </div>

          <button
            type="button"
            onClick={() => setLocationError("")}
            aria-label="Close location message"
          >
            ×
          </button>

        </div>
      )}

      {/* ======================================================
          NEAREST SIGHTING
      ====================================================== */}

      {userLocation &&
        nearestSighting && (
          <div className="nearest-sighting-card">

            <div className="nearest-sighting-icon">
              🐦
            </div>

            <div className="nearest-sighting-content">

              <p className="nearest-sighting-label">
                NEAREST KINGFISHER SIGHTING
              </p>

              <h3>
                {nearestSighting.species
                  ?.commonName ||
                  "Kingfisher"}
              </h3>

              <p className="nearest-sighting-scientific">
                {nearestSighting.species
                  ?.scientificName ||
                  "Scientific name unavailable"}
              </p>

              <div className="nearest-sighting-details">

                <span>
                  📏{" "}
                  {formatDistance(
                    nearestSighting.distanceKm
                  )}
                </span>

                <span>
                  📍{" "}
                  {nearestSighting.location
                    ?.name ||
                    "Bengaluru"}
                </span>

              </div>

            </div>

            <div className="nearest-sighting-actions">

              <a
                href={getGoogleMapsUrl(
                  Number(
                    nearestSighting.location
                      ?.latitude
                  ),
                  Number(
                    nearestSighting.location
                      ?.longitude
                  )
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="nearest-map-button"
              >
                Open in Google Maps
              </a>

              {nearestSighting.source
                ?.url && (
                <a
                  href={
                    nearestSighting.source
                      .url
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nearest-source-link"
                >
                  View observation →
                </a>
              )}

            </div>

          </div>
        )}

      {/* ======================================================
          NO SIGHTINGS
      ====================================================== */}

      {userLocation &&
        !nearestSighting &&
        validSightings.length === 0 && (
          <div className="location-message">

            <span>
              📍
            </span>

            <div>

              <strong>
                No mapped sightings
              </strong>

              <p>
                There are no sightings with
                valid coordinates in the current
                filtered results.
              </p>

            </div>

          </div>
        )}

      {/* ======================================================
          MAP
      ====================================================== */}

      <div className="kingfisher-map">

        <MapContainer
          center={[
            12.9716,
            77.5946,
          ]}
          zoom={11}
          scrollWheelZoom={true}
          style={{
            width: "100%",
            height: "100%",
          }}
        >

          <ResizeMap />

          <MapLocationController
            userLocation={userLocation}
            nearestSighting={nearestSighting}
          />

          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* ==================================================
              USER LOCATION
          ================================================== */}

          {userLocation && (
            <Marker
              position={[
                userLocation.latitude,
                userLocation.longitude,
              ]}
              icon={userLocationIcon}
              zIndexOffset={1000}
            >

              <Popup>

                <div className="user-location-popup">

                  <p className="map-popup-label">
                    YOUR LOCATION
                  </p>

                  <h3>
                    You are here
                  </h3>

                  <p>
                    {userLocation.latitude.toFixed(5)}
                    ,{" "}
                    {userLocation.longitude.toFixed(5)}
                  </p>

                </div>

              </Popup>

            </Marker>
          )}

          {/* ==================================================
              KINGFISHER MARKERS
          ================================================== */}

          {validSightings.map((sighting) => {

            const latitude = Number(
              sighting.location.latitude
            );

            const longitude = Number(
              sighting.location.longitude
            );

            const googleMapsUrl =
              getGoogleMapsUrl(
                latitude,
                longitude
              );

            const photo =
              getBestImage(sighting);

            const speciesName =
              sighting.species
                ?.commonName ||
              "Kingfisher";

            const scientificName =
              sighting.species
                ?.scientificName ||
              "";

            const locationName =
              sighting.location?.name ||
              "Bengaluru";

            const observationDate =
              sighting.observation
                ?.date ||
              "Date unavailable";

            const source =
              getSourceName(sighting);

            const observationId =
              getObservationId(sighting);

            const markerKey =
              `${source}-${observationId}`;

            const isNearest =
              nearestSighting &&
              getSourceName(
                nearestSighting
              ) === source &&
              String(
                getObservationId(
                  nearestSighting
                )
              ) ===
                String(observationId);

            return (
              <Marker
                key={markerKey}
                position={[
                  latitude,
                  longitude,
                ]}
                icon={
                  isNearest
                    ? nearestKingfisherIcon
                    : defaultKingfisherIcon
                }
                zIndexOffset={
                  isNearest
                    ? 900
                    : 0
                }
              >

                <Popup
                  maxWidth={320}
                  minWidth={260}
                >

                  <div className="map-popup">

                    {/* NEAREST */}

                    {isNearest && (
                      <div className="nearest-popup-badge">

                        📍 NEAREST TO YOU

                        {nearestSighting
                          ?.distanceKm
                          ? ` · ${formatDistance(
                              nearestSighting.distanceKm
                            )}`
                          : ""}

                      </div>
                    )}

                    {/* PHOTO */}

                    {photo && (
                      <img
                        src={photo}
                        alt={speciesName}
                        className="map-popup-image"
                        loading="lazy"
                        decoding="async"
                      />
                    )}

                    {/* SPECIES */}

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

                    {/* LOCATION */}

                    <div className="popup-detail">

                      <span className="popup-icon">
                        📍
                      </span>

                      <span>
                        {locationName}
                      </span>

                    </div>

                    {/* DATE */}

                    <div className="popup-detail">

                      <span className="popup-icon">
                        📅
                      </span>

                      <span>
                        {observationDate}
                      </span>

                    </div>

                    {/* DISTANCE */}

                    {isNearest &&
                      nearestSighting
                        ?.distanceKm !==
                        undefined && (
                        <div className="popup-detail nearest-distance-detail">

                          <span className="popup-icon">
                            📏
                          </span>

                          <strong>
                            {formatDistance(
                              nearestSighting.distanceKm
                            )}
                          </strong>

                        </div>
                      )}

                    {/* BIRD COUNT */}

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

                    {/* RESEARCH GRADE */}

                    {sighting.verification
                      ?.isResearchGrade && (
                      <div className="research-badge">
                        ✓ Research Grade
                      </div>
                    )}

                    {/* COORDINATES */}

                    <p className="popup-coordinates">
                      {latitude.toFixed(5)},{" "}
                      {longitude.toFixed(5)}
                    </p>

                    {/* GOOGLE MAPS */}

                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="google-maps-button"
                    >
                      📍 Open in Google Maps
                    </a>

                    {/* ORIGINAL OBSERVATION */}

                    {sighting.source?.url && (
                      <a
                        href={
                          sighting.source.url
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="observation-link"
                      >
                        View original observation →
                      </a>
                    )}

                  </div>

                </Popup>

              </Marker>
            );
          })}

        </MapContainer>

      </div>

    </section>
  );
}

export default KingfisherMap;