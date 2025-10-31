import React from 'react';

const Landing = ({ onNavigateToLogin, onNavigateToSignup }) => {
  return (
    <div className="landing-container">
        <header className="landing-header">
            <div className="logo">Krypta</div>
            <nav className="landing-nav">
                <a href="#features">Features</a>
                <a href="#about">About</a>
                <a href="#" onClick={onNavigateToLogin} className="btn-login">Login</a>
            </nav>
        </header>

        <section className="hero-section">
            <h1>Secure & Manage Your Digital Credentials</h1>
            <p>Krypta is a modern password manager that helps you keep your sensitive information safe and organized.</p>
            <a href="#" onClick={onNavigateToSignup} className="cta-button">Get Started for Free</a>
        </section>

        <section id="features" className="features-section">
            <div className="feature-card">
                <h3>End-to-End Encryption</h3>
                <p>Your data is encrypted at all times. Only you can access your information.</p>
            </div>
            <div className="feature-card">
                <h3>Organize Your Vault</h3>
                <p>Use folders and tags to structure your credentials and find what you need quickly.</p>
            </div>
            <div className="feature-card">
                <h3>Cross-Platform Access</h3>
                <p>Access your vault from anywhere with our web and desktop applications.</p>
            </div>
        </section>

        <footer id="about" className="landing-footer">
            <p>&copy; 2025 Krypta. All rights reserved.</p>
        </footer>
    </div>
  );
};

export default Landing;