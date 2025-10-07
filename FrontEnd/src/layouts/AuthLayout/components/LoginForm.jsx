// src/components/auth/LoginForm.jsx
import React from "react";

const LoginForm = ({ formData, onChange, onSubmit, error }) => (
  <>
    <h2 className="auth-title">Iniciar Sesión</h2>
    {error && (
      <p className="auth-error">{`${
        error === "No active account found with the given credentials"
          ? "No se encontró ninguna cuenta activa con las credenciales proporcionadas"
          : ""
      }`}</p>
    )}
    <form className="auth-form" onSubmit={onSubmit}>
      <div>
        <label>Usuario</label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={onChange}
          required
        />
      </div>
      <div>
        <label>Contraseña</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={onChange}
          required
        />
      </div>
      <button type="submit">Ingresar</button>
    </form>
  </>
);

export default LoginForm;
