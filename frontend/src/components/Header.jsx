import { useState } from "react";
import { Button } from "@/components/ui/button";
import "./Header.css";
import Logo from "./Logo";
const Header = ({ onRoleSelect }) => {
  const [activeRole, setActiveRole] = useState(null);

  const handleRoleClick = (role) => {
    setActiveRole(role);
    onRoleSelect(role);
  };

  return (
    <header className="flex justify-between items-center px-6 py-4 bg-black border-b border-gray-800">
      <div className="flex items-center">
        <Logo />
        <h1 className="text-xl font-bold text-white">
          MorphoView - AI-assisted pathology slide viewer
        </h1>
      </div>

      <div className="flex gap-3">
        <Button
          variant={activeRole === "pathologist" ? "default" : "outline"}
          onClick={() => handleRoleClick("pathologist")}
          className="bg-gray-900 text-white border-gray-700 hover:bg-gray-800"
        >
          👨‍⚕️ Pathologist
        </Button>

        <Button
          variant={activeRole === "engineer" ? "default" : "outline"}
          onClick={() => handleRoleClick("engineer")}
          className="bg-gray-900 text-white border-gray-700 hover:bg-gray-800"
        >
          🤖 Engineer
        </Button>
      </div>
    </header>
  );
};
export default Header;
