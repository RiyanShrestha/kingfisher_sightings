import { Bird } from "lucide-react";

function Logo() {
  return (
    <div className="logo">
      <div className="logo-icon">
        <Bird size={24} strokeWidth={2.2} />
      </div>

      <span className="logo-text">KingFinder</span>
    </div>
  );
}

export default Logo;