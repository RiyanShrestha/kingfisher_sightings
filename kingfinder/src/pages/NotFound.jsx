import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import PageContainer from "../components/PageContainer";

function NotFound() {
  return (
    <PageContainer>
      <section className="page-header">
        <p className="eyebrow">404</p>
        <h1>Page Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>

        <div className="hero-actions">
          <Link to="/" className="primary-button">
            <ArrowLeft size={18} />
            Back to Home
          </Link>
        </div>
      </section>
    </PageContainer>
  );
}

export default NotFound;
