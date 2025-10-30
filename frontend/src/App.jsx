import React, { useState } from 'react';
import './styles/main.css';
import './styles/sidebar.css';
import './styles/cofre.css';
import './styles/dashboard.css';
import './styles/modal.css';
import './styles/auth.css';
import './styles/notifications.css';
import './styles/dropdown-menu.css';
import './styles/settings.css';

import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import Sidebar from './components/layout/Sidebar';
import Cofre from './components/views/Cofre';
import Dashboard from './components/views/Dashboard';
import Modal from './components/layout/Modal';
import NewCredentialForm from './components/forms/NewCredentialForm';
import SettingsModal from './components/layout/SettingsModal';


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
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [isNewCredentialModalOpen, setIsNewCredentialModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const changeView = (newView) => {
    if (view !== newView) {
      setView(newView);
    }
  };

  const openNewFolderModal = () => setIsNewFolderModalOpen(true);
  const closeNewFolderModal = () => {
    setIsNewFolderModalOpen(false);
    setNewFolderName('');
  };

  const openNewCredentialModal = () => setIsNewCredentialModalOpen(true);
  const closeNewCredentialModal = () => setIsNewCredentialModalOpen(false);

  const openSettingsModal = () => setIsSettingsModalOpen(true);
  const closeSettingsModal = () => setIsSettingsModalOpen(false);

  const handleCreateFolder = (e) => {
    e.preventDefault();
    if (newFolderName.trim() === '') return;
    const newFolder = { id: Date.now(), type: 'folder', name: newFolderName.trim() };
    const newPath = `${currentPath}${newFolderName.trim()}/`;
    const updatedFileSystem = { ...fileSystem, [currentPath]: [...fileSystem[currentPath], newFolder], [newPath]: [] };
    setFileSystem(updatedFileSystem);

    const newLogEntry = {
      type: 'add',
      title: `Pasta "${newFolderName.trim()}" criada`,
      time: new Date().toLocaleString(),
    };
    setActivityLog([newLogEntry, ...activityLog]);

    closeNewFolderModal();
  };

  const addPassword = (newPassword) => {
    const newCredential = { id: Date.now(), type: 'credential', ...newPassword };
    const updatedFileSystem = { ...fileSystem, [currentPath]: [...fileSystem[currentPath], newCredential] };
    setFileSystem(updatedFileSystem);

    const newLogEntry = {
      type: 'add',
      title: `Credencial "${newPassword.name}" criada`,
      time: new Date().toLocaleString(),
    };
    setActivityLog([newLogEntry, ...activityLog]);

    closeNewCredentialModal();
  };

  const allTags = Array.from(
    Object.values(fileSystem)
      .flat()
      .filter(item => item.tags)
      .flatMap(item => item.tags)
      .reduce((map, tag) => {
        if (!map.has(tag.name)) {
          map.set(tag.name, tag);
        }
        return map;
      }, new Map()).values()
  );

  const commonProps = {
    fileSystem,
    setFileSystem,
    activityLog,
    setActivityLog,
    currentPath,
    setCurrentPath,
    openNewFolderModal,
    openNewCredentialModal
  };

  return (
    <div className="container">
      <Sidebar changeView={changeView} openSettingsModal={openSettingsModal} />
      
      {view === 'cofre' && 
        <Cofre 
          {...commonProps}
          changeView={changeView}
        />
      }
      {view === 'dashboard' && <Dashboard {...commonProps} />}

      <Modal title="Nova Pasta" isOpen={isNewFolderModalOpen} onCancel={closeNewFolderModal}>
        <form onSubmit={handleCreateFolder}>
          <div className="form-group">
            <label className="form-label">Nome da Pasta</label>
            <input 
              type="text"
              className="form-input"
              placeholder="Digite o nome da pasta"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={closeNewFolderModal}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Criar</button>
          </div>
        </form>
      </Modal>

      <Modal title="Novo Item" isOpen={isNewCredentialModalOpen} onCancel={closeNewCredentialModal}>
        <NewCredentialForm onCancel={closeNewCredentialModal} addPassword={addPassword} allTags={allTags} />
      </Modal>

      <SettingsModal isOpen={isSettingsModalOpen} onCancel={closeSettingsModal} />
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