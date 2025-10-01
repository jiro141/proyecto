import React from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./css/NavBar.css";

const NavBar = () => {
  const { logout } = useAuth();
  const location = useLocation();

  // Convertimos /dashboard → "Dashboard"
  const currentPath = location.pathname.split("/")[1] || "Inicio";
  const pageTitle = currentPath.charAt(0).toUpperCase() + currentPath.slice(1);

  return (
    <header className="navbar">
      <div className="navbar-brand">{pageTitle}</div>
      <button className="logout-button" onClick={logout}>
        Cerrar sesión
      </button>
    </header>
  );
};

export default NavBar;
