import React, { useEffect, useRef } from 'react';

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

export default Modal;
