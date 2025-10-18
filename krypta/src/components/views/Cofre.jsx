import React, { useState } from 'react';
import { Copy, Edit, MoreVertical, Bell, Search, ChevronDown, Folder, Plus } from 'lucide-react';

const Cofre = ({ openModal }) => {
  const [passwords, setPasswords] = useState([
    { id: 1, name: 'Gmail', email: 'email@gmail.com', color: 'red' },
    { id: 2, name: 'Github', email: 'email@gmail.com', color: 'blue' },
    { id: 3, name: 'Spotify', email: 'email@gmail.com', color: 'purple' }
  ]);

  const handleCopy = (name) => alert(`Senha de ${name} copiada!`);
  const handleEdit = (name) => alert(`Editando ${name}`);
  const handleMenu = (name) => alert(`Menu de opções de ${name}`);

  return (
    <>
      <div id="left-panel">
        <div id="vault-selector"><ChevronDown size={16} /><span>Cofre 1</span></div>
        <div id="search-bar"><Search size={16} /><span>Pesquisar</span></div>
        <div id="tags">
          <div className="tag-title">Tags</div>
          <div className="tag-list">
            <div className="tag" style={{ borderLeftColor: 'red' }}>Email</div>
            <div className="tag" style={{ borderLeftColor: 'blue' }}>Apps</div>
          </div>
        </div>
        <div id="folders">
          <div className="folder-title">Pastas</div>
          <div className="folder-item"><Folder size={16} /><span>Backup</span></div>
        </div>
      </div>

      <div id="main-content">
        <div id="main-header">
          <h1>Meu cofre</h1>
          <div id="header-actions">
            <button className="new-button" onClick={openModal}><Plus size={16} />Novo</button>
            <button className="icon-button"><Bell size={20} /></button>
            <div id="user-avatar"></div>
          </div>
        </div>
        <div id="password-list">
          {passwords.map((password) => (
            <div key={password.id} className="password-item" style={{ borderLeftColor: password.color }}>
              <div>
                <div className="password-name">{password.name}</div>
                <div className="password-email">{password.email}</div>
              </div>
              <div className="password-actions">
                <button onClick={(e) => { e.stopPropagation(); handleCopy(password.name); }}><Copy size={16} /></button>
                <button onClick={(e) => { e.stopPropagation(); handleEdit(password.name); }}><Edit size={16} /></button>
                <button onClick={(e) => { e.stopPropagation(); handleMenu(password.name); }}><MoreVertical size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Cofre;