import { NavLink } from "react-router-dom";
import { Compass, Camera, PlusCircle, BarChart3 } from "lucide-react";
import Logo from "./Logo";

function Navbar() {
  const navItems = [
    {
      name: "Explore",
      path: "/explore",
      icon: Compass,
    },
    {
      name: "Photographer",
      path: "/photographer",
      icon: Camera,
    },
    {
      name: "Report Sighting",
      path: "/report",
      icon: PlusCircle,
    },
    {
      name: "Insights",
      path: "/insights",
      icon: BarChart3,
    },
  ];

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-logo-link">
          <Logo />
        </NavLink>

        <nav className="navbar-links">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <Icon size={17} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <NavLink to="/explore" className="navbar-cta">
          Explore Now
        </NavLink>
      </div>
    </header>
  );
}

export default Navbar;