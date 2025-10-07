// src/components/auth/RegisterForm.jsx
import React from "react";

const RegisterForm = ({ formData, onChange, onSubmit, error }) => (
  <>
    <h2 className="auth-title">Crear Cuenta</h2>
    {error && (
      <p className="auth-error">{`${
        error === "No active account found with the given credentials"
          ? "No se encontró ninguna cuenta activa con las credenciales proporcionadas"
          : ""
      }`}</p>
    )}
    <form className="auth-form" onSubmit={onSubmit}>
      <div className="form-row">
        <div>
          <label>Nombre</label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={onChange}
            required
          />
        </div>
        <div>
          <label>Apellido</label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={onChange}
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div>
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={onChange}
            required
          />
        </div>
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
      </div>

      <div className="form-row">
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
        <div>
          <label>Confirmar</label>
          <input
            type="password"
            name="confirm_password"
            value={formData.confirm_password}
            onChange={onChange}
            required
          />
        </div>
      </div>

      <button type="submit">Registrarme</button>
    </form>
  </>
);

export default RegisterForm;
