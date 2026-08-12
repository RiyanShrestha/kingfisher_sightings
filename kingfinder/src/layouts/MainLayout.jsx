import Navbar from "../components/Navbar";

function MainLayout({ children }) {
  return (
    <div className="app-shell">
      <Navbar />

      <div className="main-content">
        {children}
      </div>

      <footer className="footer">
        <p>© 2026 KingFinder. Discover. Observe. Photograph.</p>
      </footer>
    </div>
  );
}

export default MainLayout;