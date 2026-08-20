import { Link } from "react-router-dom";
import PageContainer from "../components/PageContainer";

function NotFound() {
  return (
    <PageContainer>
      <section className="page-header">
        <p className="eyebrow">404</p>
        <h1>Page Not Found</h1>
        <p>
          The page you're looking for doesn't exist.
        </p>
      </section>

      <div className="placeholder-card">
        <Link to="/" className="primary-button">
          Back to Home
        </Link>
      </div>
    </PageContainer>
  );
}

export default NotFound;
