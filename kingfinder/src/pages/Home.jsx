import { ArrowRight, Map, Camera, Bird } from "lucide-react";
import { Link } from "react-router-dom";
import PageContainer from "../components/PageContainer";

function Home() {
  return (
    <PageContainer className="home-page">
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <Bird size={16} />
            <span>Kingfisher Sightings & Photography</span>
          </div>

          <h1>
            Discover.
            <br />
            Observe.
            <br />
            <span>Photograph.</span>
          </h1>

          <p className="hero-description">
            Discover kingfisher sightings, explore active locations, and find
            the best time and conditions for wildlife photography.
          </p>

          <div className="hero-actions">
            <Link to="/explore" className="primary-button">
              <Map size={18} />
              Explore Sightings
              <ArrowRight size={18} />
            </Link>

            <Link to="/photographer" className="secondary-button">
              <Camera size={18} />
              Photographer Mode
            </Link>
          </div>
        </div>
      </section>
    </PageContainer>
  );
}

export default Home;