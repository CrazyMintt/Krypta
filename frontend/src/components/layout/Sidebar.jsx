import React from 'react';

const Sidebar = ({  changeView, openSettingsModal  }) => (
  <div className="sidebar">
    <div className="logo">
      <div className="logo-icon">
        <img className="logo-size" src='logo.png'></img>
      </div>
      <span className="logo-text">Krypta</span>
    </div>
    <nav className="nav-menu">
      <div className="nav-item" onClick={() => changeView('cofre')}>Cofres</div>
      <div className="nav-item" onClick={() => changeView('sharing')}>Compartilhar</div>
      <div className="nav-item" onClick={() => changeView('dashboard')}>Dashboard</div>
      <div className="nav-item" onClick={openSettingsModal}>Configurações</div>
    </nav>
  </div>
);

export default Sidebar;
