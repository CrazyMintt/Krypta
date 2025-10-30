import React, { useEffect } from 'react';

const Modal = ({ title, children, onCancel, isOpen, className }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  if (!isOpen) return null;

  return (
    <div className="overlay fade-in" onClick={(e) => e.target.classList.contains('overlay') && onCancel()}>
      <div className={`modal ${className || ''}`}>
        <button className="close-btn" onClick={onCancel}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
        </div>

        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;