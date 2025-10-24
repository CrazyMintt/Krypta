import React, { useState } from 'react';
import './styles/main.css';
import './styles/sidebar.css';
import './styles/cofre.css';
import './styles/dashboard.css';
import './styles/modal.css';
import './styles/auth.css';
import './styles/notifications.css';
import './styles/dropdown-menu.css';

import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import Sidebar from './components/layout/Sidebar';
import Modal from './components/layout/Modal';
import Cofre from './components/views/Cofre';
import Dashboard from './components/views/Dashboard';

// Mock data para simular uma estrutura de arquivos
const initialFileSystem = {
  '/': [
    { type: 'folder', name: 'Trabalho' },
    { type: 'folder', name: 'Pessoal' },
    { type: 'credential', name: 'senha_wifi', email: 'user@example.com' },
  ],
  '/Trabalho/': [
    { type: 'file', name: 'relatorio_q3.pdf' },
    { type: 'folder', name: 'Projetos' },
  ],
  '/Trabalho/Projetos/': [
    { type: 'file', name: 'projeto_krypta.docx' },
  ],
  '/Pessoal/': [
    { type: 'file', name: 'lista_compras.txt' },
  ],
};

const initialActivityLog = [
  {
    type: 'add',
    title: 'Senha do github criada',
    time: 'Há 1 minuto atrás',
  },
  {
    type: 'edit',
    title: 'Senha do gmail alterada',
    time: 'Há 1 hora atrás',
  },
];

const MainApp = () => {
    const [view, setView] = useState('cofre');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [fileSystem, setFileSystem] = useState(initialFileSystem);
    const [activityLog, setActivityLog] = useState(initialActivityLog);
    const [currentPath, setCurrentPath] = useState('/');

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    const changeView = (newView) => {
        if (view !== newView) {
            setView(newView);
        }
    };

    const CurrentView = () => {
        const commonProps = {
            openModal,
            fileSystem,
            setFileSystem,
            activityLog,
            setActivityLog,
            currentPath,
            setCurrentPath,
        };
        if (view === 'cofre') return <Cofre {...commonProps} />;
        if (view === 'dashboard') return <Dashboard {...commonProps} />;
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