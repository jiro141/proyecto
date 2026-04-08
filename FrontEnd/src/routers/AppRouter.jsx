// src/routers/AppRouter.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignIn from "../layouts/AuthLayout/SignIn";
import ProtectedRoute from "./ProtectedRoute";
import DashboardLayout from "../layouts/DashboardLayout/DashboardLayout";

import Dashboard from "../pages/Dashboard";
import InventarioHome from "../pages/InventarioHome";
import EppLayout from "../layouts/InventoryLayout/EppLayout";
import HerramientasLayout from "../layouts/InventoryLayout/HerramientasLayout";
import EmpleadosLayout from "../layouts/InventoryLayout/EmpleadosLayout";
import LogisticaLayout from "../layouts/InventoryLayout/LogisticaLayout";
import StockLayout from "../layouts/InventoryLayout/StockLayout";
import PresupuestosLayout from "../layouts/PresupuestosLayout/PresupuestosLayout";
import ConsumiblesLayout from "../layouts/InventoryLayout/ConsumiblesLayout";
import CrearPresupuestoLayout from "../layouts/PresupuestosLayout/CrearPresupuestoLayout";
import ProveedoresHome from "../pages/ProveedoresHome";
import ClientesHome from "../layouts/ClientsLayout/ClientesHome";
import ClientesCuentas from "../layouts/ClientsLayout/ClientesCuentas";

const AppRouter = () => {
  return (

    <Routes>
      {/* Ruta pública */}
      <Route path="/login" element={<SignIn />} />

      {/* Rutas protegidas */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardLayout />}>
          <Route path="dashboard" element={<Dashboard />} />

          <Route path="inventario">
            <Route index />
            <Route path="epp" element={<EppLayout />} />
            <Route path="herramientas" element={<HerramientasLayout />} />
            <Route path="empleados" element={<EmpleadosLayout />} />
            <Route path="logistica" element={<LogisticaLayout />} />
            <Route path="stock" element={<StockLayout />} />
            <Route path="consumibles" element={<ConsumiblesLayout />} />
          </Route>
          <Route path="Proveedores" element={<ProveedoresHome />} />
          <Route path="Clientes">
            <Route index />
            <Route path="Lista" element={<ClientesHome />} />
            <Route path="Cuentas" element={<ClientesCuentas />} />
          </Route>
          <Route path="Informes">
            <Route index />
            <Route path="Lista" element={<PresupuestosLayout />} />
            <Route path="Crear" element={<CrearPresupuestoLayout />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<SignIn />} />
    </Routes>

  );
};

export default AppRouter;
