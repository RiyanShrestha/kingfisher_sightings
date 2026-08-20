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

          <p className="hero-supporting">
            Live sightings · Local hotspots · Photography insights
          </p>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="hero-visual-badge">
            <svg
              viewBox="0 0 200 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="hero-visual-svg"
            >
              {/* Decorative concentric orbital rings */}
              <circle
                cx="100"
                cy="100"
                r="88"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeDasharray="4 6"
                opacity="0.35"
              />
              <circle
                cx="100"
                cy="100"
                r="68"
                stroke="currentColor"
                strokeWidth="0.8"
                opacity="0.2"
              />

              {/* Perch branch line */}
              <path
                d="M42 144 C75 142, 120 144, 162 140"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                opacity="0.45"
              />
              <path
                d="M124 143 C136 150, 146 154, 154 156"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                opacity="0.3"
              />

              {/* Kingfisher silhouette */}
              {/* Beak */}
              <path
                d="M54 77 L86 84 L86 88 Z"
                fill="currentColor"
                opacity="0.85"
              />
              {/* Head, Crest, Body */}
              <path
                d="M84 74 C88 67, 98 65, 108 67 C116 68, 124 73, 122 79 C126 77, 131 77, 133 81 C128 82, 122 84, 120 88 C122 96, 120 108, 118 116 C114 130, 108 142, 105 144 C102 144, 100 141, 99 137 C94 129, 92 117, 90 107 C86 97, 82 87, 84 74 Z"
                fill="currentColor"
                opacity="0.75"
              />
              {/* Wing */}
              <path
                d="M102 89 C112 90, 124 98, 123 112 C122 124, 115 138, 111 148 C107 141, 104 126, 102 114 C100 102, 101 93, 102 89 Z"
                fill="currentColor"
                opacity="0.9"
              />
              {/* Eye accent */}
              <circle
                cx="94"
                cy="79"
                r="2.2"
                fill="var(--color-surface, #ffffff)"
                opacity="0.95"
              />
              {/* Tail */}
              <path
                d="M109 143 L113 161 L107 159 L105 145 Z"
                fill="currentColor"
                opacity="0.8"
              />
              {/* Feet */}
              <path
                d="M101 143 L101 146 M105 143 L105 146"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.75"
              />
            </svg>
          </div>
        </div>
      </section>
    </PageContainer>
  );
}

export default Home;