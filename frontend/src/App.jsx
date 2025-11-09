// src/App.jsx

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
import './styles/sharing.css';
import './styles/landing.css';

import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import Sidebar from './components/layout/Sidebar';
import Cofre from './components/views/Cofre';
import Dashboard from './components/views/Dashboard';
import Sharing from './components/views/Sharing';
import Modal from './components/layout/Modal';
import NewCredentialForm from './components/forms/NewCredentialForm';
import SettingsModal from './components/layout/SettingsModal';
import Landing from './components/views/Landing';
import { SharedItemsProvider } from './context/SharedItemsContext';

import * as folderService from './services/folderService'; // corrigido

const MainApp = ({ onLogout }) => {
  const [view, setView] = useState('cofre');

  // Log local
  const [activityLog, setActivityLog] = useState([]);

  // Pasta atual (null = raiz). O Cofre atualiza via onFolderChange.
  const [currentFolderId, setCurrentFolderId] = useState(null);

  // Sinal para recarregar listagens no Cofre após criar/editar/excluir
  const [refreshKey, setRefreshKey] = useState(0);

  // Modais
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [isNewCredentialModalOpen, setIsNewCredentialModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Form da nova pasta
  const [newFolderName, setNewFolderName] = useState('');

  const changeView = (newView) => {
    if (view !== newView) setView(newView);
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

  // Criação de pasta -> backend
  const handleCreateFolder = async (e) => {
    e.preventDefault();
    const nome = newFolderName.trim();
    if (!nome) return;

    try {
      await folderService.createFolder({
        nome,
        id_pasta_raiz: currentFolderId ?? null,
      });

      setActivityLog((prev) => [
        { type: 'add', title: `Pasta "${nome}" criada`, time: new Date().toLocaleString() },
        ...prev,
      ]);

      setRefreshKey((k) => k + 1); // força reload no Cofre
      closeNewFolderModal();
    } catch (err) {
      console.error('Erro ao criar pasta', err);
      alert('Erro ao criar a pasta.');
    }
  };

  // Sucesso ao criar/editar credencial -> recarregar Cofre
  const handleCredentialSaved = () => {
    setRefreshKey((k) => k + 1);
    closeNewCredentialModal();
  };

  return (
    <SharedItemsProvider activityLog={activityLog} setActivityLog={setActivityLog}>
      <div className="container">
        <Sidebar changeView={changeView} openSettingsModal={openSettingsModal} />

        {view === 'cofre' && (
          <Cofre
            activityLog={activityLog}
            setActivityLog={setActivityLog}
            openNewFolderModal={openNewFolderModal}
            openNewCredentialModal={openNewCredentialModal}
            onLogout={onLogout}
            onFolderChange={setCurrentFolderId} // Cofre informa a pasta atual
            refreshKey={refreshKey}            // Cofre recarrega quando mudar
          />
        )}

        {view === 'dashboard' && <Dashboard onLogout={onLogout} />}
        {view === 'sharing' && <Sharing />}

        {/* Nova Pasta */}
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
              <button type="button" className="btn btn-secondary" onClick={closeNewFolderModal}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Criar
              </button>
            </div>
          </form>
        </Modal>

        {/* Nova Credencial */}
        <Modal title="Novo Item" isOpen={isNewCredentialModalOpen} onCancel={closeNewCredentialModal}>
          <NewCredentialForm
            onCancel={closeNewCredentialModal}
            onSuccess={handleCredentialSaved}
            currentFolderId={currentFolderId} // criar já na pasta atual
          />
        </Modal>

        <SettingsModal isOpen={isSettingsModalOpen} onCancel={closeSettingsModal} />
      </div>
    </SharedItemsProvider>
  );
};

function KryptaApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState('landing');

  const handleLoginSuccess = () => setIsAuthenticated(true);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setCurrentView('landing');
  };

  if (!isAuthenticated) {
    if (currentView === 'landing') {
      return (
        <Landing
          onNavigateToLogin={() => setCurrentView('login')}
          onNavigateToSignup={() => setCurrentView('signup')}
        />
      );
    }
    if (currentView === 'login') {
      return (
        <Login
          onNavigateToSignup={() => setCurrentView('signup')}
          onLoginSuccess={handleLoginSuccess}
          onNavigateToLanding={() => setCurrentView('landing')}
        />
      );
    }
    if (currentView === 'signup') {
      return (
        <Signup
          onNavigateToLogin={() => setCurrentView('login')}
          onNavigateToLanding={() => setCurrentView('landing')}
        />
      );
    }
  }

  return <MainApp onLogout={handleLogout} />;
}

export default KryptaApp;
