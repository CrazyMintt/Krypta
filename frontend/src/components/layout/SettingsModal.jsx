import React from 'react';
import Modal from './Modal';

const SettingsModal = ({ isOpen, onCancel }) => {
  return (
    <Modal title="Configurações" isOpen={isOpen} onCancel={onCancel} className="settings">
      <div className="settings-modal">
        <div className="settings-sidebar">
          <ul>
            <li className="active">Cofres</li>
          </ul>
        </div>
        <div className="settings-content">
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
        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;
