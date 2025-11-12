import React, { useState } from "react";
import { signup } from "../../services/userService";

const Signup = ({ onNavigateToLogin, onNavigateToLanding }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const email = e.target.elements.email.value.trim();
    const nome = e.target.elements.nome.value.trim();
    const password = e.target.elements.password.value;
    const confirmPassword = e.target.elements.confirmPassword.value;

    if (password !== confirmPassword) {
      alert("As senhas não coincidem!");
      setIsSubmitting(false);
      return;
    }

    try {
      await signup(email, nome, password);
      alert("Conta criada com sucesso!");
      e.target.reset();
      onNavigateToLogin();
    } catch (error) {
      console.error("Erro ao registrar usuário:", error);
      const errMsg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        (error.response?.status === 409
          ? "Este email já está registrado."
          : "Erro ao registrar usuário.");
      alert(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="form-container signup-form-container">
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
              <span className="account-link-text">Já possui uma conta?</span>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateToLogin();
                }}
              >
                Entrar
              </a>
            </div>
          </div>
          <h1 className="form-title">Criar Conta</h1>
        </div>

        <form id="signupForm" onSubmit={handleSignup}>
          <div className="form-group">
            <label className="form-label">Digite seu nome de usuário ou email</label>
            <input name="email" type="email" className="form-input" placeholder="Usuário ou email" required />
          </div>

          <div className="form-row">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nome</label>
              <input name="nome" type="text" className="form-input" placeholder="Nome Completo" required />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Digite sua senha</label>
              <input name="password" type="password" className="form-input" placeholder="Senha" required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirmar senha</label>
            <input name="confirmPassword" type="password" className="form-input" placeholder="Senha" required />
          </div>

          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? "Criando conta..." : "Criar Conta"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signup;
