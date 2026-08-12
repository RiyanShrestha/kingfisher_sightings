import PageContainer from "../components/PageContainer";

function ReportSighting() {
  return (
    <PageContainer>
      <section className="page-header">
        <p className="eyebrow">CONTRIBUTE</p>
        <h1>Report a Sighting</h1>
        <p>
          Help the KingFinder community by contributing your own kingfisher
          sightings.
        </p>
      </section>

      <div className="placeholder-card">
        <h2>Sighting Form</h2>
        <p>
          The sighting submission form will be built in a later phase.
        </p>
      </div>
    </PageContainer>
  );
}

export default ReportSighting;