import React, { useRef } from "react";
import { login } from "../../services/userService";

const Login = ({ onNavigateToSignup, onLoginSuccess, onNavigateToLanding }) => {
  const passwordInputRef = useRef(null);
  const eyeIconRef = useRef(null);

  const togglePassword = () => {
    const input = passwordInputRef.current;
    const icon = eyeIconRef.current;

    if (input.type === "password") {
      input.type = "text";
      icon.innerHTML = `
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      `;
    } else {
      input.type = "password";
      icon.innerHTML = `
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      `;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const email = e.target.elements.email.value;
    const password = e.target.elements.password.value;

    try {
      const data = await login(email, password);

      localStorage.setItem("authToken", `${data.token_type} ${data.access_token}`);
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: data.id,
          nome: data.nome,
          email: data.email,
          created_at: data.created_at,
        })
      );

      alert("Login realizado com sucesso!");
      onLoginSuccess();
    } catch (err) {
      console.error("Erro ao fazer login:", err);
      alert(err.response?.data?.detail || "Email ou senha incorretos");
    }
  };

  return (
    <div className="auth-container">
      <div className="form-container login-form-container">
        <div className="form-header">
          <div className="form-header-row">
            <div className="form-subtitle">
              Bem-vindo ao{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateToLanding();
                }}
              >
                Krypta
              </a>
            </div>

            <div className="account-link">
              <span className="account-link-text">Não possui conta?</span>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateToSignup();
                }}
              >
                Criar conta
              </a>
            </div>
          </div>
          <h1 className="form-title">Entrar</h1>
        </div>

        <form id="loginForm" onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Digite seu nome de Usuário ou Email</label>
            <input name="email" type="text" className="form-input" placeholder="Nome de Usuário ou email" required />
          </div>

          <div className="form-group">
            <label className="form-label">Digite sua Senha</label>
            <div className="password-wrapper">
              <input name="password" type="password" className="form-input" ref={passwordInputRef} placeholder="Senha" required />
              <button type="button" className="toggle-password" onClick={togglePassword}>
                <svg ref={eyeIconRef} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
          </div>

          <button type="submit" className="submit-btn">Entrar</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
