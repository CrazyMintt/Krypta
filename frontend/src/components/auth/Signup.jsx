import React from 'react';

const Signup = ({ onNavigateToLogin }) => {
    const handleSignup = (e) => {
        e.preventDefault();
        const password = e.target.elements.password.value;
        const confirmPassword = e.target.elements.confirmPassword.value;
        if (password !== confirmPassword) {
            alert('As senhas não coincidem!');
            return;
        }
        alert('Conta criada com sucesso!');
        onNavigateToLogin();
    };

    return (
        <div className="auth-container">
            <div className="form-container signup-form-container">
                <div className="account-link">
                    <span className="account-link-text">Já possui uma conta?</span>
                    <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToLogin(); }}>Entrar</a>
                </div>
                <div className="form-header">
                    <div className="form-subtitle">Bem-vindo ao <a href="#">Krypta</a></div>
                    <h1 className="form-title">Criar Conta</h1>
                </div>
                <form id="signupForm" onSubmit={handleSignup}>
                    <div className="form-group">
                        <label className="form-label">Digite seu nome de usuário ou email</label>
                        <input type="text" className="form-input" placeholder="Usuário ou email" required />
                    </div>
                    <div className="form-row">
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Nome</label>
                            <input type="text" className="form-input" placeholder="Nome Completo" required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Digite sua senha</label>
                            <input type="password" name="password" className="form-input" placeholder="Senha" required />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Confirmar senha</label>
                        <input type="password" name="confirmPassword" className="form-input" placeholder="Senha" required />
                    </div>
                    <button type="submit" className="submit-btn">Criar Conta</button>
                </form>
            </div>
        </div>
    );
};

export default Signup;
