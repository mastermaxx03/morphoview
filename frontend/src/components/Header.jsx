import { useState } from "react";
import { Button } from "../ui/button";
import "./Header.css";
import Logo from "./Logo.jsx";
const Header = ({ onRoleSelect }) => {
  const [activeRole, setActiveRole] = useState(null);

  const handleRoleClick = (role) => {
    setActiveRole(role);
    onRoleSelect(role);
  };

  return (
    <header className="header">
      <div className="header-left">
        <Logo />
        <h1 className="app-name">MorphoView</h1>
      </div>

      <div className="header-right">
        <Button
          variant={activeRole === "pathologist" ? "default" : "outline"}
          onClick={() => handleRoleClick("pathologist")}
          className="role-btn"
        >
          👨‍⚕️ Pathologist
        </Button>

        <Button
          variant={activeRole === "engineer" ? "default" : "outline"}
          onClick={() => handleRoleClick("engineer")}
          className="role-btn"
        >
          🤖 Engineer
        </Button>
      </div>
    </header>
  );
};

export default Header;
