import React from "react";
import NavBar from "../../components/NavBar";
import SideBar from "../../components/SideBar";
import { Outlet } from "react-router-dom";
import "../css/DashboardLayout.css";

const DashboardLayout = () => {
  return (
    <div className="dashboard-root">
      <SideBar />
      <div className="dashboard-main">
        <NavBar />
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
