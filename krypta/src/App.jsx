import React, { useState } from 'react';
import './App.css';

import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import Sidebar from './components/layout/Sidebar';
import Modal from './components/layout/Modal';
import Cofre from './components/views/Cofre';
import Dashboard from './components/views/Dashboard';

const MainApp = () => {
    const [view, setView] = useState('cofre');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    const changeView = (newView) => {
        if (view !== newView) {
            setView(newView);
        }
    };

    const CurrentView = () => {
        if (view === 'cofre') return <Cofre openModal={openModal} />;
        if (view === 'dashboard') return <Dashboard openModal={openModal} />;
        return null;
    };

    return (
        <div className="container">
            <Sidebar changeView={changeView} />
            <CurrentView />
            {isModalOpen && <Modal closeModal={closeModal} isOpen={isModalOpen} />}
        </div>
    );
};

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authView, setAuthView] = useState('login'); // 'login' or 'signup'

    const handleLoginSuccess = () => {
        setIsAuthenticated(true);
    };

    if (!isAuthenticated) {
        if (authView === 'login') {
            return <Login onNavigateToSignup={() => setAuthView('signup')} onLoginSuccess={handleLoginSuccess} />;
        }
        return <Signup onNavigateToLogin={() => setAuthView('login')} />;
    }

    return <MainApp />;
}

export default App;