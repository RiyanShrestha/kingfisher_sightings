import { useEffect, useState } from "react";

function Explore() {
  const [sightings, setSightings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSightings = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/sightings"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch sightings");
        }

        const data = await response.json();

        setSightings(data.sightings || []);
      } catch (err) {
        console.error(err);
        setError("Unable to load real sightings.");
      } finally {
        setLoading(false);
      }
    };

    fetchSightings();
  }, []);

  return (
    <main className="page">
      <section className="page-header">
        <p className="eyebrow">DISCOVER</p>

        <h1>Explore Sightings</h1>

        <p>
          Discover recent real-world kingfisher
          observations around Bengaluru.
        </p>
      </section>

      <section className="explore-content">
        {loading && (
          <div className="status-card">
            <h2>Loading real observations...</h2>
            <p>
              Fetching current data from iNaturalist.
            </p>
          </div>
        )}

        {error && (
          <div className="status-card error">
            <h2>Something went wrong</h2>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="data-summary">
              <div>
                <span className="summary-number">
                  {sightings.length}
                </span>

                <span className="summary-label">
                  real observations
                </span>
              </div>

              <div>
                <span className="summary-label">
                  Region
                </span>

                <strong>
                  Bengaluru, Karnataka
                </strong>
              </div>

              <div>
                <span className="summary-label">
                  Source
                </span>

                <strong>
                  iNaturalist
                </strong>
              </div>
            </div>

            <div className="sightings-grid">
              {sightings.slice(0, 30).map((sighting) => (
                <article
                  className="sighting-card"
                  key={sighting.id}
                >
                  {sighting.media?.length > 0 && (
                    <img
                      src={sighting.media[0].url}
                      alt={
                        sighting.species.commonName
                      }
                      className="sighting-image"
                    />
                  )}

                  <div className="sighting-body">
                    <p className="sighting-species">
                      {sighting.species.commonName}
                    </p>

                    <p className="scientific-name">
                      {sighting.species.scientificName}
                    </p>

                    <div className="sighting-details">
                      <span>
                        📍{" "}
                        {sighting.location.name ||
                          "Bengaluru"}
                      </span>

                      <span>
                        📅{" "}
                        {sighting.observation.date ||
                          "Date unavailable"}
                      </span>
                    </div>

                    <a
                      href={sighting.source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="source-link"
                    >
                      View original observation →
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default Explore;