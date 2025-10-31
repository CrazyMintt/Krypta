import React from 'react';

const Sidebar = ({  changeView, openSettingsModal  }) => (
  <div className="sidebar">
    <div className="logo">
      <div className="logo-icon">
        <svg viewBox="0 0 24 24"><path d="M12 2L4 7v10c0 5.5 3.8 7.8 8 9 4.2-1.2 8-3.5 8-9V7l-8-5zm0 18c-3.1-.9-6-2.5-6-7V8.3l6-3.6 6 3.6V13c0 4.5-2.9 6.1-6 7z" /></svg>
      </div>
      <span className="logo-text">Krypta</span>
    </div>
    <nav className="nav-menu">
      <div className="nav-item" onClick={() => changeView('cofre')}>Cofres</div>
      <div className="nav-item">Compartilhar</div>
      <div className="nav-item">Relatórios</div>
      <div className="nav-item" onClick={() => changeView('dashboard')}>Dashboard</div>
      <div className="nav-item" onClick={openSettingsModal}>Configurações</div>
    </nav>
  </div>
);

export default Sidebar;
