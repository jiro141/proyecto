import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import "./css/SideBar.css";
import logo from "../assets/img/logo.png";
import {
  FaHome,
  FaBoxOpen,
  FaChevronDown,
  FaChevronUp,
  FaTools,
} from "react-icons/fa";
import { FaHelmetSafety } from "react-icons/fa6";
import { LuDrill } from "react-icons/lu";
import { GrDocumentPdf } from "react-icons/gr";

const SideBar = () => {
  const [showInventory, setShowInventory] = useState(false);

  return (
    <aside className="sidebar">
      <div style={{ textAlign: "center", padding: "1rem" }}>
        <img className="logoBar" src={logo} alt="Logo tipo" />
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className="sidebar-link">
          <FaHome />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/inventario"
          className="sidebar-link submenu-toggle"
          onClick={() => setShowInventory(!showInventory)}
        >
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <FaBoxOpen />
            <span>Inventario</span>
          </div>
          {showInventory ? (
            <FaChevronUp size={12} />
          ) : (
            <FaChevronDown size={12} />
          )}
        </NavLink>

        {showInventory && (
          <div className="submenu">
            <NavLink to="/inventario/epp" className="sidebar-sublink">
              <FaHelmetSafety />
              E.P.P.
            </NavLink>
            <NavLink to="/inventario/stock" className="sidebar-sublink">
              <FaTools />
              Ferretería
            </NavLink>
            <NavLink to="/inventario/consumibles" className="sidebar-sublink">
              <LuDrill />
              Consumibles
            </NavLink>
          </div>
        )}

        <NavLink to="/reportes" className="sidebar-link">
          <GrDocumentPdf />
          Reportes
        </NavLink>
      </nav>
    </aside>
  );
};

export default SideBar;
