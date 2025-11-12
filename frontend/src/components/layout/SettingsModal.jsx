import React, { useState, useEffect } from 'react';
import Modal from './Modal';

const SettingsModal = ({ isOpen, onCancel }) => {
  const [activeTab, setActiveTab] = useState('cofres');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));

  return (
    <Modal title="Configurações" isOpen={isOpen} onCancel={onCancel} className="settings">
      <div className="settings-modal">
        <div className="settings-sidebar">
          <ul>
            <li
              className={activeTab === 'cofres' ? 'active' : ''}
              onClick={() => setActiveTab('cofres')}
            >
              Cofres
            </li>
            <li
              className={activeTab === 'sobre' ? 'active' : ''}
              onClick={() => setActiveTab('sobre')}
            >
              Sobre
            </li>
          </ul>
        </div>

        <div className="settings-content">
          {activeTab === 'cofres' && (
            <>
              <h2>Dados</h2>
              <div className="settings-section">
                <div className="settings-item">
                  <div>
                    <h3>Importar</h3>
                    <p>Função para importar senhas de outras fontes.</p>
                  </div>
                  <button className="btn btn-primary">Importar</button>
                </div>

                <div className="settings-item">
                  <div>
                    <h3>Exportar</h3>
                    <p>Função para exportar senhas de outras fontes.</p>
                  </div>
                  <button className="btn btn-primary">Exportar</button>
                </div>

                <div className="settings-item">
                  <div>
                    <h3>Deletar</h3>
                    <p>Função para deletar completamente o cofre.</p>
                  </div>
                  <button className="btn btn-danger">Deletar</button>
                </div>
              </div>

              <h2>Aparência</h2>
              <div className="settings-section">
                <div className="settings-item">
                  <div>
                    <h3>Tema do aplicativo</h3>
                    <p>Escolha entre tema claro ou escuro.</p>
                  </div>
                  <div className="theme-toggle">
                    <label className="theme-switch">
                      <input
                        type="checkbox"
                        checked={theme === 'light'}
                        onChange={toggleTheme}
                      />
                      <span className="slider" />
                    </label>
                    <span className="theme-label">
                      {theme === 'dark' ? 'Escuro' : 'Claro'}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'sobre' && (
            <>
              <h2>Sobre o Krypta</h2>
              <div className="settings-section">
                <p>
                  O Krypta é um gerenciador de senhas projetado para oferecer uma solução segura
                  e fácil de usar para armazenar e gerenciar suas credenciais.
                </p>
                <br />
                <p>
                  Nossa missão é fornecer uma alternativa transparente e confiável aos gerenciadores
                  de senha comerciais, colocando a privacidade e a segurança do usuário em primeiro lugar.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;
