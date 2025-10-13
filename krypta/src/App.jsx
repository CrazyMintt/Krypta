import React, { useState, useEffect, useRef } from 'react';
import { Copy, Edit, MoreVertical, Bell, Search, ChevronDown, Folder, Plus } from 'lucide-react';
import './App.css';

// --- MODAL COMPONENT ---
const Modal = ({ closeModal, isOpen }) => {
  const passwordInputRef = useRef(null);
  const eyeIconRef = useRef(null);

  const togglePassword = () => {
    if (passwordInputRef.current.type === 'password') {
      passwordInputRef.current.type = 'text';
      eyeIconRef.current.innerHTML = `
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      `;
    } else {
      passwordInputRef.current.type = 'password';
      eyeIconRef.current.innerHTML = `
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      `;
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    alert('Item salvo com sucesso!');
    closeModal();
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeModal]);

  return (
    <div className={`overlay ${isOpen ? 'fade-in' : 'fade-out'}`} onClick={(e) => e.target.classList.contains('overlay') && closeModal()}>
      <div className="modal">
        <button className="close-btn" onClick={closeModal}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <div className="modal-header">
          <h2 className="modal-title">Novo Item</h2>
        </div>
        <form id="itemForm" onSubmit={handleFormSubmit}>
          <div className="form-section">
            <div className="form-group">
              <label className="form-label">Nome <span className="required">*</span></label>
              <input type="text" className="form-input" placeholder="Digite o nome do item" required />
            </div>
            <div className="form-group">
              <label className="form-label">Pasta</label>
              <select className="form-select">
                <option value="">Selecione uma pasta</option>
                <option value="backup">Backup</option>
                <option value="trabalho">Trabalho</option>
                <option value="pessoal">Pessoal</option>
              </select>
            </div>
          </div>
          <div className="divider"></div>
          <div className="form-section">
            <h3 className="section-title">
              <svg className="section-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" /></svg>
              Credenciais
            </h3>
            <div className="form-group">
              <label className="form-label">Email/username</label>
              <input type="text" className="form-input" placeholder="exemplo@email.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Senha</label>
              <div className="password-input-wrapper">
                <input type="password" className="form-input" id="passwordInput" ref={passwordInputRef} placeholder="Digite a senha" />
                <button type="button" className="toggle-password" onClick={togglePassword}>
                  <svg id="eyeIcon" ref={eyeIconRef} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div className="divider"></div>
          <div className="form-section">
            <h3 className="section-title">
              <svg className="section-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z" /></svg>
              Preenchimento automático
            </h3>
            <div className="form-group">
              <label className="form-label">Site (url)</label>
              <input type="url" className="form-input" placeholder="https://exemplo.com" />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
            <button type="submit" className="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- DASHBOARD COMPONENT ---
const Dashboard = ({ openModal }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const drawDonutChart = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 100;
      const lineWidth = 35;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const used = 1.3;
      const total = 1.5;
      const percentage = (used / total) * 100;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = '#666';
      ctx.stroke();

      const usedAngle = (percentage / 100) * 2 * Math.PI;
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#8b5cf6');
      gradient.addColorStop(0.5, '#7c3aed');
      gradient.addColorStop(1, '#6d28d9');

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + usedAngle);
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = gradient;
      ctx.lineCap = 'round';
      ctx.stroke();
    };

    drawDonutChart();
    window.addEventListener('resize', drawDonutChart);
    return () => window.removeEventListener('resize', drawDonutChart);
  }, []);

  return (
    <div className="main-content dashboard-view">
        <div className="header">
          <div>
            <h1 className="header-title">Dashboard</h1>
          </div>
          <div className="header-right">
            <button className="new-button" onClick={openModal}>
              <span>+</span>
              <span>Novo</span>
            </button>
            <button className="icon-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" /></svg>
            </button>
            <div className="profile-pic"></div>
          </div>
        </div>
        <div className="dashboard-grid">
          <div className="dashboard-section">
            <h2 className="section-title">Armazenamento</h2>
            <div className="chart-container">
              <div className="donut-chart">
                <canvas ref={canvasRef} id="storageChart" width="280" height="280"></canvas>
                <div className="chart-center">
                  <div className="chart-value">1.3 GB</div>
                  <div className="chart-label">de 1.5 GB</div>
                </div>
              </div>
            </div>
            <div className="file-list">
              <div className="file-item"><span className="file-type">.TXT</span><span className="file-size">300 MBs</span></div>
              <div className="file-item"><span className="file-type">.PY</span><span className="file-size">190 MBs</span></div>
              <div className="file-item"><span className="file-type">.PDF</span><span className="file-size">30 MBs</span></div>
            </div>
          </div>
          <div className="dashboard-section">
            <h2 className="section-title">Atividade recente</h2>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg></div>
                <div className="activity-info">
                  <div className="activity-title">Senha do github criada</div>
                  <div className="activity-time">Há 1 minuto atrás</div>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon"><svg viewBox="0 0 24 24"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" /></svg></div>
                <div className="activity-info">
                  <div className="activity-title">Senha do gmail alterada</div>
                  <div className="activity-time">Há 1 hora atrás</div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};

// --- COFRE COMPONENT ---
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
            <button onClick={openModal}><Plus size={16} />Novo</button>
            <button><Bell size={20} /></button>
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

// --- SIDEBAR COMPONENT ---
const Sidebar = ({ changeView }) => (
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
      <div className="nav-item">Configurações</div>
    </nav>
  </div>
);


// --- MAIN APP COMPONENT ---
function App() {
  const [view, setView] = useState('cofre');
  const [isFading, setIsFading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);

  const openModal = () => {
      setModalContent(<Modal closeModal={closeModal} isOpen={true} />);
      setIsModalOpen(true);
  }

  const closeModal = () => {
    setIsFading(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setIsFading(false);
    }, 300);
  }

  const changeView = (newView) => {
    if (view !== newView) {
      setIsFading(true);
      setTimeout(() => {
        setView(newView);
        setIsFading(false);
      }, 300);
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
      <div className={`view-wrapper ${isFading ? 'fade-out' : 'fade-in'}`}>
        <CurrentView />
      </div>
      {isModalOpen && modalContent}
    </div>
  );
}

export default App;
