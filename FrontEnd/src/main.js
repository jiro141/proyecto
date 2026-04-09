// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"
import { AuthProvider } from "./context/AuthContext";
import 'react-calendar/dist/Calendar.css';
import { PresupuestoProvider } from "./context/PresupuestoContext";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router><AuthProvider>
      <PresupuestoProvider>
        <App />
      </PresupuestoProvider>
    </AuthProvider></Router>
  </React.StrictMode>
);
