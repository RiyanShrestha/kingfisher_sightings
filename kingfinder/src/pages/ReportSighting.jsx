import { useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Camera,
  Calendar,
  Compass,
  CheckCircle,
  AlertCircle,
  Upload,
  ArrowRight,
  ArrowLeft,
  Eye,
  Check,
} from "lucide-react";
import PageContainer from "../components/PageContainer";
import { API_ENDPOINTS } from "../config/api";

const API_URL = API_ENDPOINTS.USER_SIGHTINGS;

const KINGFISHER_SPECIES_OPTIONS = [
  { commonName: "White-throated Kingfisher", scientificName: "Halcyon smyrnensis" },
  { commonName: "Common Kingfisher", scientificName: "Alcedo atthis" },
  { commonName: "Pied Kingfisher", scientificName: "Ceryle rudis" },
  { commonName: "Stork-billed Kingfisher", scientificName: "Pelargopsis capensis" },
  { commonName: "Black-capped Kingfisher", scientificName: "Halcyon pileata" },
  { commonName: "Oriental Dwarf Kingfisher", scientificName: "Ceyx erithaca" },
];

const HABITAT_OPTIONS = [
  "Lake / Pond Margin",
  "River / Stream",
  "Wetland / Marsh",
  "Park / Garden Pond",
  "Urban Canal / Drain",
  "Forest Edge / Woodland",
  "Other",
];

const BEHAVIOUR_OPTIONS = [
  "Perching / Hunting Watch",
  "Active Fishing / Diving",
  "Flying / Transit",
  "Calling / Vocalising",
  "Nesting / Mating Display",
  "Other",
];

function ReportSighting() {
  const todayStr = new Date().toISOString().split("T")[0];
  const timeNowStr = new Date().toTimeString().slice(0, 5);

  const [formData, setFormData] = useState({
    speciesCommonName: "White-throated Kingfisher",
    speciesScientificName: "Halcyon smyrnensis",
    date: todayStr,
    time: timeNowStr,
    locationName: "Lalbagh Botanical Garden",
    latitude: 12.9507,
    longitude: 77.5848,
    count: 1,
    habitat: "Lake / Pond Margin",
    behaviour: "Perching / Hunting Watch",
    notes: "",
    photoUrl: "",
    photographerName: "",
    cameraInfo: "",
  });

  const [geoLocating, setGeoLocating] = useState(false);
  const [step, setStep] = useState(1); // 1: Details, 2: Review, 3: Success
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleSpeciesChange = (e) => {
    const name = e.target.value;
    const match = KINGFISHER_SPECIES_OPTIONS.find((s) => s.commonName === name);
    setFormData((prev) => ({
      ...prev,
      speciesCommonName: name,
      speciesScientificName: match ? match.scientificName : name,
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
          locationName: prev.locationName || "Current Geolocation",
        }));
        setGeoLocating(false);
      },
      (err) => {
        alert(`Location access denied or unavailable (${err.message}).`);
        setGeoLocating(false);
      }
    );
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("File size too large. Please select an image under 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, photoUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const validateStep1 = () => {
    if (!formData.speciesCommonName) return "Please select a species.";
    if (!formData.date) return "Please select an observation date.";
    if (!formData.latitude || !formData.longitude) return "Please provide valid location coordinates.";
    if (formData.latitude < -90 || formData.latitude > 90 || formData.longitude < -180 || formData.longitude > 180) {
      return "Latitude must be between -90 and 90, Longitude between -180 and 180.";
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep1();
    if (err) {
      alert(err);
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to submit sighting.");
      }
      setStep(3);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      speciesCommonName: "White-throated Kingfisher",
      speciesScientificName: "Halcyon smyrnensis",
      date: todayStr,
      time: timeNowStr,
      locationName: "Lalbagh Botanical Garden",
      latitude: 12.9507,
      longitude: 77.5848,
      count: 1,
      habitat: "Lake / Pond Margin",
      behaviour: "Perching / Hunting Watch",
      notes: "",
      photoUrl: "",
      photographerName: "",
      cameraInfo: "",
    });
    setStep(1);
    setSubmitError(null);
  };

  return (
    <PageContainer>
      <section className="page-header">
        <p className="eyebrow">CONTRIBUTE</p>
        <h1>Report a Kingfisher Sighting</h1>
        <p>Submit your observation to enrich community insights and help local birdwatchers & photographers in Bengaluru.</p>
      </section>

      {/* Progress Indicators */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "1.5rem",
          margin: "0 auto 2.5rem auto",
          maxWidth: "500px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              backgroundColor: step >= 1 ? "var(--color-primary)" : "#cbd5e1",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "0.85rem",
            }}
          >
            1
          </span>
          <span style={{ fontWeight: step === 1 ? 700 : 500, color: step === 1 ? "#0f172a" : "#64748b" }}>Details</span>
        </div>
        <div style={{ flex: 1, height: "2px", backgroundColor: step >= 2 ? "var(--color-primary)" : "#e2e8f0" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              backgroundColor: step >= 2 ? "var(--color-primary)" : "#cbd5e1",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "0.85rem",
            }}
          >
            2
          </span>
          <span style={{ fontWeight: step === 2 ? 700 : 500, color: step === 2 ? "#0f172a" : "#64748b" }}>Review</span>
        </div>
        <div style={{ flex: 1, height: "2px", backgroundColor: step === 3 ? "var(--color-primary)" : "#e2e8f0" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              backgroundColor: step === 3 ? "#10b981" : "#cbd5e1",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "0.85rem",
            }}
          >
            3
          </span>
          <span style={{ fontWeight: step === 3 ? 700 : 500, color: step === 3 ? "#0f172a" : "#64748b" }}>Success</span>
        </div>
      </div>

      {step === 1 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleNext();
          }}
          style={{ maxWidth: "800px", margin: "0 auto", display: "grid", gap: "1.75rem" }}
        >
          {/* Species & Count */}
          <div className="placeholder-card" style={{ padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Compass size={18} style={{ color: "var(--color-primary)" }} /> Species & Count
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                  Kingfisher Species *
                </label>
                <select
                  name="speciesCommonName"
                  value={formData.speciesCommonName}
                  onChange={handleSpeciesChange}
                  style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                >
                  {KINGFISHER_SPECIES_OPTIONS.map((sp) => (
                    <option key={sp.commonName} value={sp.commonName}>
                      {sp.commonName} ({sp.scientificName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                  Number of Birds Observed *
                </label>
                <input
                  type="number"
                  name="count"
                  min="1"
                  max="50"
                  value={formData.count}
                  onChange={handleInputChange}
                  style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  required
                />
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="placeholder-card" style={{ padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Calendar size={18} style={{ color: "var(--color-primary)" }} /> Observation Date & Time
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                  Date *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  max={todayStr}
                  style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                  Time of Day
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="placeholder-card" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <MapPin size={18} style={{ color: "var(--color-primary)" }} /> Location Coordinates *
              </h3>
              <button
                type="button"
                onClick={handleUseLocation}
                disabled={geoLocating}
                className="secondary-button"
                style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
              >
                <Compass size={14} /> {geoLocating ? "Locating..." : "Use My Current Geolocation"}
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                  Location Name / Spot
                </label>
                <input
                  type="text"
                  name="locationName"
                  placeholder="e.g. Hebbal Lake North Bank"
                  value={formData.locationName}
                  onChange={handleInputChange}
                  style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                  Latitude *
                </label>
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                  Longitude *
                </label>
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  required
                />
              </div>
            </div>

            <p style={{ fontSize: "0.8rem", color: "#64748b", margin: 0 }}>
              💡 Geolocation hint: Bengaluru coordinates are roughly Lat 12.8°–13.1° N, Lng 77.4°–77.8° E.
            </p>
          </div>

          {/* Habitat & Behaviour */}
          <div className="placeholder-card" style={{ padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Eye size={18} style={{ color: "var(--color-primary)" }} /> Context & Behaviour
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                  Habitat Type
                </label>
                <select
                  name="habitat"
                  value={formData.habitat}
                  onChange={handleInputChange}
                  style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                >
                  {HABITAT_OPTIONS.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                  Observed Behaviour
                </label>
                <select
                  name="behaviour"
                  value={formData.behaviour}
                  onChange={handleInputChange}
                  style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                >
                  {BEHAVIOUR_OPTIONS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                Field Notes & Descriptions
              </label>
              <textarea
                name="notes"
                rows="3"
                placeholder="Details about perch height, light conditions, active feeding, juvenile plumage, etc."
                value={formData.notes}
                onChange={handleInputChange}
                style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1", resize: "vertical" }}
              />
            </div>
          </div>

          {/* Photo & Photographer */}
          <div className="placeholder-card" style={{ padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Camera size={18} style={{ color: "var(--color-primary)" }} /> Photo & Observer Info
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                  Photographer / Observer Name
                </label>
                <input
                  type="text"
                  name="photographerName"
                  placeholder="e.g. Anita Sharma"
                  value={formData.photographerName}
                  onChange={handleInputChange}
                  style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                  Camera / Lens Gear
                </label>
                <input
                  type="text"
                  name="cameraInfo"
                  placeholder="e.g. Sony A7IV + 200-600mm"
                  value={formData.cameraInfo}
                  onChange={handleInputChange}
                  style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                Photo URL or Image Upload
              </label>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                <input
                  type="url"
                  name="photoUrl"
                  placeholder="https://example.com/kingfisher.jpg"
                  value={formData.photoUrl.startsWith("data:") ? "" : formData.photoUrl}
                  onChange={handleInputChange}
                  style={{ flex: 1, minWidth: "220px", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
                <label
                  className="secondary-button"
                  style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.6rem 1rem" }}
                >
                  <Upload size={16} /> Choose File
                  <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: "none" }} />
                </label>
              </div>
            </div>

            {formData.photoUrl && (
              <div style={{ marginTop: "1rem", textAlign: "center" }}>
                <p style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.4rem" }}>Photo Preview:</p>
                <img
                  src={formData.photoUrl}
                  alt="Sighting preview"
                  style={{ maxHeight: "200px", borderRadius: "8px", border: "1px solid #cbd5e1", objectFit: "cover" }}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          <div style={{ textAlign: "right", marginTop: "1rem" }}>
            <button
              type="submit"
              className="primary-button"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 2rem", fontSize: "1rem" }}
            >
              Review Sighting <ArrowRight size={18} />
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <div className="placeholder-card" style={{ padding: "2rem", marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "1.5rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem" }}>
              Review Your Sighting Report
            </h2>

            <div style={{ display: "grid", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Species:</span>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-primary)" }}>
                  {formData.speciesCommonName} <em>({formData.speciesScientificName})</em>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Date & Time:</span>
                  <div style={{ fontWeight: 600 }}>{formData.date} {formData.time && `at ${formData.time}`}</div>
                </div>
                <div>
                  <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Count:</span>
                  <div style={{ fontWeight: 600 }}>{formData.count} bird(s)</div>
                </div>
              </div>

              <div>
                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Location:</span>
                <div style={{ fontWeight: 600 }}>{formData.locationName}</div>
                <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                  ({formData.latitude}° N, {formData.longitude}° E)
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Habitat:</span>
                  <div style={{ fontWeight: 600 }}>{formData.habitat}</div>
                </div>
                <div>
                  <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Behaviour:</span>
                  <div style={{ fontWeight: 600 }}>{formData.behaviour}</div>
                </div>
              </div>

              {formData.notes && (
                <div>
                  <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Notes:</span>
                  <div style={{ fontWeight: 500, backgroundColor: "#f8fafc", padding: "0.6rem", borderRadius: "6px" }}>
                    {formData.notes}
                  </div>
                </div>
              )}

              {formData.photographerName && (
                <div>
                  <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Observer / Equipment:</span>
                  <div style={{ fontWeight: 600 }}>
                    {formData.photographerName} {formData.cameraInfo && `(${formData.cameraInfo})`}
                  </div>
                </div>
              )}

              {formData.photoUrl && (
                <div>
                  <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Attached Image:</span>
                  <div style={{ marginTop: "0.5rem" }}>
                    <img
                      src={formData.photoUrl}
                      alt="Attached"
                      style={{ maxHeight: "180px", borderRadius: "6px" }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {submitError && (
              <div
                style={{
                  padding: "0.75rem 1rem",
                  backgroundColor: "#fef2f2",
                  color: "#991b1b",
                  borderRadius: "6px",
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.9rem",
                }}
              >
                <AlertCircle size={16} /> {submitError}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="secondary-button"
                disabled={submitting}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
              >
                <ArrowLeft size={16} /> Back & Edit
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="primary-button"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 2rem" }}
              >
                {submitting ? "Submitting..." : "Confirm & Submit Sighting"} <Check size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
          <div className="placeholder-card" style={{ padding: "3rem 2rem" }}>
            <CheckCircle size={64} style={{ color: "#10b981", marginBottom: "1rem" }} />
            <h2 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "0.5rem" }}>Sighting Submitted!</h2>
            <p style={{ color: "#64748b", marginBottom: "2rem" }}>
              Thank you for contributing to KingFinder. Your observation for{" "}
              <strong>{formData.speciesCommonName}</strong> has been saved and added to the Bengaluru map database.
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
              <Link to="/explore" className="primary-button" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                View on Explore Map <ArrowRight size={16} />
              </Link>
              <button onClick={handleReset} className="secondary-button">
                Submit Another Sighting
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

export default ReportSighting;