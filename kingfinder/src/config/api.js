/**
 * Global API configuration for KingFinder frontend.
 * Reads backend URL from import.meta.env.VITE_API_URL with development fallback.
 * Ensures trailing slashes are safely stripped to prevent duplicate slashes.
 */

const RAW_API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const API_BASE_URL = RAW_API_URL.replace(/\/+$/, "");

export const API_ENDPOINTS = {
  SIGHTINGS: `${API_BASE_URL}/api/sightings`,
  USER_SIGHTINGS: `${API_BASE_URL}/api/sightings/user`,
  HEALTH: `${API_BASE_URL}/api/health`,
  SPECIES: `${API_BASE_URL}/api/species`,
  SPECIES_REFERENCE_IMAGES: `${API_BASE_URL}/api/species-reference-images`,
};

export default API_ENDPOINTS;
