import React from 'react';

const Signup = ({ onNavigateToLogin }) => {
  const handleSignup = async (e) => {
    e.preventDefault();

    const email = e.target.elements.email.value;
    const nome = e.target.elements.nome.value;
    const password = e.target.elements.password.value;
    const confirmPassword = e.target.elements.confirmPassword.value;

    if (password !== confirmPassword) {
      alert("As senhas não coincidem!");
      return;
    }

    try {
      const response = await fetch("https://localhost:8000/users/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          nome: nome,
          senha_mestre: password,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        alert(errData.detail || "Erro ao registrar usuário");
        return;
      }

      alert("Conta criada com sucesso!");
      onNavigateToLogin();
      
    } catch (error) {
      console.error("Erro ao registrar usuário:", error);
      alert("Erro no servidor");
    }
  };

  return (
    <div className="auth-container">
      <div className="form-container signup-form-container">
        <div className="form-header">
            <div className="form-header-row">
                <div className="form-subtitle">
                    Bem-vindo ao <a href="#">Krypta</a>
                </div>
                <div className="account-link">
                    <span className="account-link-text">Já possui uma conta?</span>
                    <a href="#" onClick={(e) => {
                        e.preventDefault();
                        onNavigateToLogin();
                        }}>
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

          <button type="submit" className="submit-btn">Criar Conta</button>
        </form>
      </div>
    </div>
  );
};

export default Signup;
