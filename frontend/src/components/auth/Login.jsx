import React, { useRef } from 'react';

const Login = ({ onNavigateToSignup, onLoginSuccess, onNavigateToLanding }) => {
    const passwordInputRef = useRef(null);
    const eyeIconRef = useRef(null);

    const togglePassword = () => {
        if (passwordInputRef.current.type === 'password') {
            passwordInputRef.current.type = 'text';
            eyeIconRef.current.innerHTML = `
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
            `;
        } else {
            passwordInputRef.current.type = 'password';
            eyeIconRef.current.innerHTML = `
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
            `;
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        const email = e.target.elements.email.value;
        const password = e.target.elements.password.value;

        const formData = new URLSearchParams();
        formData.append("username", email);
        formData.append("password", password);

        try {
            const response = await fetch("https://localhost:8000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: formData.toString()
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.detail || "Email ou senha incorretos");
                return;
            }

            localStorage.setItem("authToken", `${data.token_type} ${data.access_token}`);

            alert("Login realizado com sucesso!");
            onLoginSuccess();
        } catch (error) {
            console.error("Erro ao fazer login:", error);
            alert("Erro no servidor");
        }
    };

    return (
        <div className="auth-container">
            <div className="form-container login-form-container">
                <div className="form-header">
                    <div className="form-header-row">
                        <div className="form-subtitle">Bem-vindo ao <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToLanding(); }}>Krypta</a></div>

                        <div className="account-link">
                            <span className="account-link-text">Não possui conta?</span>
                            <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToSignup(); }}>Criar conta</a>
                        </div>
                    </div>

                    <h1 className="form-title">Entrar</h1>
                </div>
                <form id="loginForm" onSubmit={handleLogin}>
                    <div className="form-group">
                        <label className="form-label">Digite seu nome de Usuário ou Email</label>
                        <input 
                            name="email"
                            type="text"
                            className="form-input"
                            placeholder="Nome de Usuário ou email"
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Digite sua Senha</label>
                        <div className="password-wrapper">
                            <input 
                                name="password"
                                type="password" 
                                className="form-input" 
                                ref={passwordInputRef} 
                                placeholder="Senha" 
                                required 
                            />
                            <button type="button" className="toggle-password" onClick={togglePassword}>
                                <svg ref={eyeIconRef} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                                </svg>
                            </button>
                        </div>
                        <div className="forgot-password"><a href="#">Esqueci minha senha</a></div>
                    </div>
                    <button type="submit" className="submit-btn">Entrar</button>
                </form>
                <div className="divider"><div className="divider-text">OU</div></div>
                <div className="social-login">
                     <button className="social-btn"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg><span>Entrar com o Google</span></button>
                     <button className="social-btn"><svg viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></button>
                     <button className="social-btn"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l-.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg></button>
                </div>
            </div>
        </div>
    );
};

export default Login;
