import "../css/SignIn.css";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../api/controllers/Login";
import { registerUser } from "../../api/controllers/registerUser";
import logo4 from "../../assets/img/Logotipo 4.png";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import { useAuth } from "../../context/AuthContext"

const SignIn = () => {
  const navigate = useNavigate(); // 🚀 Hook para redirigir
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");

  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    confirm_password: "",
  });
  const { login } = useAuth();

  const isLogin = mode === "login";

  const handleChange = (e) => {
    const { name, value } = e.target;
    isLogin
      ? setLoginForm({ ...loginForm, [name]: value })
      : setRegisterForm({ ...registerForm, [name]: value });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
  
    if (!isLogin && registerForm.password !== registerForm.confirm_password) {
      setError("Las contraseñas no coinciden");
      return;
    }
  
    try {
      if (isLogin) {
        const response = await loginUser(loginForm);
        login(response.access); // ✅ ACTUALIZA EL CONTEXTO
        navigate("/dashboard"); // ✅ REDIRECCIÓN
      } else {
        await registerUser(registerForm);
        alert("Registro exitoso!");
        setMode("login");
      }
    } catch (err) {
      setError(err?.detail || "Error desconocido");
    }
  };
  

  return (
    <div className={`auth-container ${!isLogin ? "register-mode" : ""}`}>
      <div className="auth-box">
        <div className="auth-left">
          <div className="form-wrapper">
            <div className={`form-slide ${mode}`}>
              {isLogin ? (
                <LoginForm
                  formData={loginForm}
                  onChange={handleChange}
                  onSubmit={handleSubmit}
                  error={error}
                />
              ) : (
                <RegisterForm
                  formData={registerForm}
                  onChange={handleChange}
                  onSubmit={handleSubmit}
                  error={error}
                />
              )}
            </div>
          </div>
          {/* <div style={{ textAlign: "center" }}>
            <button
              className="buttom-register"
              onClick={() => setMode(isLogin ? "register" : "login")}
            >
              {isLogin
                ? "¿No tienes cuenta? Regístrate"
                : "¿Ya tienes cuenta? Inicia sesión"}
            </button>
          </div> */}
        </div>
        <div className="auth-right">
          <img src={logo4} alt="Logo empresa" />
        </div>
      </div>
    </div>
  );
};

export default SignIn;
