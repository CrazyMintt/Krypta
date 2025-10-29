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
import Cofre from './components/views/Cofre';
import Dashboard from './components/views/Dashboard';

// Mock data para simular uma estrutura de arquivos
const initialFileSystem = {
  '/': [
    { id: Date.now() + 1, type: 'folder', name: 'Trabalho' },
    { id: Date.now() + 2, type: 'folder', name: 'Pessoal' },
    { id: Date.now() + 3, type: 'credential', name: 'senha_wifi', email: 'user@example.com' },
  ],
  '/Trabalho/': [
    { id: Date.now() + 4, type: 'file', name: 'relatorio_q3.pdf' },
    { id: Date.now() + 5, type: 'folder', name: 'Projetos' },
  ],
  '/Trabalho/Projetos/': [
    { id: Date.now() + 6, type: 'file', name: 'projeto_krypta.docx' },
  ],
  '/Pessoal/': [
    { id: Date.now() + 7, type: 'file', name: 'lista_compras.txt' },
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
  const [fileSystem, setFileSystem] = useState(initialFileSystem);
  const [activityLog, setActivityLog] = useState(initialActivityLog);
  const [currentPath, setCurrentPath] = useState('/');

  const changeView = (newView) => {
    if (view !== newView) {
      setView(newView);
    }
  };

  const commonProps = {
    fileSystem,
    setFileSystem,
    activityLog,
    setActivityLog,
    currentPath,
    setCurrentPath,
  };

  return (
    <div className="container">
      <Sidebar changeView={changeView} />
      
      {view === 'cofre' && 
        <Cofre 
          fileSystem={fileSystem} 
          setFileSystem={setFileSystem} 
          activityLog={activityLog} 
          setActivityLog={setActivityLog} 
          currentPath={currentPath} 
          setCurrentPath={setCurrentPath}
          changeView={changeView} // Pass changeView to Cofre
        />
      }
      {view === 'dashboard' && <Dashboard {...commonProps} />}
    </div>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState('login');

  const handleLoginSuccess = () => setIsAuthenticated(true);

  if (!isAuthenticated) {
    return authView === 'login'
      ? <Login onNavigateToSignup={() => setAuthView('signup')} onLoginSuccess={handleLoginSuccess} />
      : <Signup onNavigateToLogin={() => setAuthView('login')} />;
  }

  return <MainApp />;
}

export default App;