import React, { useState } from 'react';
import './styles/main.css';
import './styles/sidebar.css';
import './styles/cofre.css';
import './styles/dashboard.css';
import './styles/modal.css';
import './styles/auth.css';
import './styles/notifications.css';

import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import Sidebar from './components/layout/Sidebar';
import Modal from './components/layout/Modal';
import Cofre from './components/views/Cofre';
import Dashboard from './components/views/Dashboard';

const MainApp = () => {
    const [view, setView] = useState('cofre');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [selectedPassword, setSelectedPassword] = useState(null);

    const openModal = (password = null) => {
        setSelectedPassword(password);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedPassword(null);
        setIsModalOpen(false);
    };

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

            {isModalOpen && (
                <Modal
                    closeModal={closeModal}
                    isOpen={isModalOpen}
                    password={selectedPassword}
                />
            )}
        </div>
    );
};

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authView, setAuthView] = useState('login');

    const handleLoginSuccess = () => {
        setIsAuthenticated(true);
    };

    if (!isAuthenticated) {
        if (authView === 'login') {
            return (
                <Login
                    onNavigateToSignup={() => setAuthView('signup')}
                    onLoginSuccess={handleLoginSuccess}
                />
            );
        }
        return <Signup onNavigateToLogin={() => setAuthView('login')} />;
    }

    return <MainApp />;
}

export default App;