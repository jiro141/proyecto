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
  FaTruckLoading,
  FaUserFriends,
  FaHammer,
  FaFileInvoiceDollar,
  FaPlusCircle,
  FaUsers 
} from "react-icons/fa";
import { FaMoneyBillWave } from "react-icons/fa6";
import { FaHelmetSafety } from "react-icons/fa6";
import { GrDocumentPdf } from "react-icons/gr";

const SideBar = () => {
  const [showInventory, setShowInventory] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showClients, setShowClients] = useState(false);

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ textAlign: "center", padding: "1rem" }}>
        <img className="logoBar" src={logo} alt="Logo tipo" />
      </div>

      {/* Navegación */}
      <nav className="sidebar-nav">
        {/* --- Dashboard --- */}
        <NavLink to="/dashboard" className="sidebar-link">
          <FaHome />
          <span>Dashboard</span>
        </NavLink>

        {/* --- Inventario --- */}
        <div
          className="sidebar-link submenu-toggle"
          onClick={() => setShowInventory(!showInventory)}
          style={{ cursor: "pointer" }}
        >
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <FaBoxOpen />
            <span>Inventario</span>
          </div>
          {showInventory ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
        </div>

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
              <FaHammer />
              Consumibles
            </NavLink>
          </div>
        )}

        {/* --- Proveedores --- */}
        <NavLink to="/proveedores" className="sidebar-link">
          <FaTruckLoading />
          <span>Proveedores</span>
        </NavLink>

                {/* --- Clientes --- */}
        <div
          className="sidebar-link submenu-toggle"
          onClick={() => setShowClients(!showClients)}
          style={{ cursor: "pointer" }}
        >
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <FaUsers />
            <span>Clientes</span>
          </div>
          {showClients ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
        </div>

        {showClients && (
          <div className="submenu">
            <NavLink to="/clientes/Lista" className="sidebar-sublink">
              <FaUserFriends />
              <span>Ver Clientes</span>
            </NavLink>
            <NavLink to="/clientes/Cuentas" className="sidebar-sublink">
              <FaMoneyBillWave />
              <span>Cuentas por cobrar</span>
            </NavLink>
          </div>
        )}

        {/* --- Presupuestos (Informes) --- */}
        <div
          className="sidebar-link submenu-toggle"
          onClick={() => setShowReports(!showReports)}
          style={{ cursor: "pointer" }}
        >
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <GrDocumentPdf />
            <span>Presupuestos</span>
          </div>
          {showReports ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
        </div>

        {showReports && (
          <div className="submenu">
            {/* <NavLink to="/informes/Lista" className="sidebar-sublink">
              <FaFileInvoiceDollar />
              <span>Ver Presupuestos</span>
            </NavLink> */}
            <NavLink to="/informes/Crear" className="sidebar-sublink">
              <FaPlusCircle />
              <span>Crear Nuevo</span>
            </NavLink>
          </div>
        )}
      </nav>
    </aside>
  );
};

export default SideBar;
