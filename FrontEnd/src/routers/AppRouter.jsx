// src/routers/AppRouter.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignIn from "../layouts/AuthLayout/SignIn";
import ProtectedRoute from "./ProtectedRoute";
import DashboardLayout from "../layouts/DashboardLayout/DashboardLayout";

import Dashboard from "../pages/Dashboard";
import InventarioHome from "../pages/InventarioHome";
import EppLayout from "../layouts/InventoryLayout/EppLayout";
import StockLayout from "../layouts/InventoryLayout/StockLayout";
import ConsumiblesLayout from "../layouts/InventoryLayout/ConsumiblesLayout";
import ProveedoresHome from "../pages/ProveedoresHome";

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        {/* Ruta pública */}
        <Route path="/login" element={<SignIn />} />

        {/* Rutas protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardLayout />}>
            <Route path="dashboard" element={<Dashboard />} />

            <Route path="inventario">
              <Route index element={<InventarioHome />} />
              <Route path="epp" element={<EppLayout />} />
              <Route path="stock" element={<StockLayout />} />
              <Route path="consumibles" element={<ConsumiblesLayout />} />
            </Route>
            <Route path="Proveedores" element={<ProveedoresHome />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<SignIn />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
