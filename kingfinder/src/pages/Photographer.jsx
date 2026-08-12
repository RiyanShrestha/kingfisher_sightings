import PageContainer from "../components/PageContainer";

function Photographer() {
  return (
    <PageContainer>
      <section className="page-header">
        <p className="eyebrow">PHOTOGRAPHY</p>
        <h1>Photographer Mode</h1>
        <p>
          Find the best locations, times, and conditions for kingfisher
          photography.
        </p>
      </section>

      <div className="placeholder-card">
        <h2>Photography Recommendations</h2>
        <p>
          The recommendation system will be built in a later phase.
        </p>
      </div>
    </PageContainer>
  );
}

export default Photographer;