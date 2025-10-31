import React, { useState } from 'react';

const ShareItemModal = ({ item, onCancel, onConfirm }) => {
  const [accessCount, setAccessCount] = useState(1);
  const [durationValue, setDurationValue] = useState(1);
  const [durationUnit, setDurationUnit] = useState('horas');
  const [generatedLink, setGeneratedLink] = useState('');

  const handleGenerateLink = () => {
    // Mock link generation
    const mockLink = `https://krypta.com/share/${Math.random().toString(36).substring(2, 15)}`;
    setGeneratedLink(mockLink);
  };

  return (
    <div className="share-modal">
      {!generatedLink ? (
        <>
          <div className="form-group">
            <label htmlFor="access-count">Número de acessos permitidos:</label>
            <input
              type="number"
              id="access-count"
              className="form-input"
              value={accessCount}
              onChange={(e) => setAccessCount(e.target.value)}
              min="1"
            />
          </div>
          <div className="form-group">
            <label htmlFor="duration">Duração:</label>
            <div className="duration-group">
              <input
                type="number"
                id="duration-value"
                className="form-input"
                value={durationValue}
                onChange={(e) => setDurationValue(e.target.value)}
                min="1"
              />
              <select id="duration-unit" className="form-select" value={durationUnit} onChange={(e) => setDurationUnit(e.target.value)}>
                <option value="minutos">Minutos</option>
                <option value="horas">Horas</option>
                <option value="dias">Dias</option>
              </select>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
            <button type="button" className="btn btn-primary" onClick={handleGenerateLink}>Gerar</button>
          </div>
        </>
      ) : (
        <div className="generated-link-container">
          <p>Link de compartilhamento gerado:</p>
          <input type="text" className="form-input" value={generatedLink} readOnly />
          <button type="button" className="btn btn-primary" onClick={() => navigator.clipboard.writeText(generatedLink)}>Copiar</button>
        </div>
      )}
    </div>
  );
};

export default ShareItemModal;
