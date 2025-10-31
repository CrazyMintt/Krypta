import React, { useState } from 'react';
import { useSharedItems } from '../../context/SharedItemsContext';

const ShareItemModal = ({ item, onCancel }) => {
  const [accessCount, setAccessCount] = useState(1);
  const [durationValue, setDurationValue] = useState(1);
  const [durationUnit, setDurationUnit] = useState('horas');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const { addSharedItem, activityLog, setActivityLog } = useSharedItems();

  const handleGenerateLink = () => {
    const mockLink = `https://krypta.com/share/${Math.random().toString(36).substring(2, 15)}`;
    setGeneratedLink(mockLink);
    addSharedItem({
      id: Math.random(),
      name: item.name,
      sharedWith: 'link',
      accessesLeft: accessCount,
      expiresIn: `${durationValue} ${durationUnit}`,
    });

    const newLogEntry = {
      type: 'add',
      title: `Item "${item.name}" compartilhado`,
      time: new Date().toLocaleString(),
    };
    setActivityLog([newLogEntry, ...activityLog]);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
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
          <p className="generated-link-label">Link de compartilhamento gerado:</p>
          <input type="text" className="form-input generated-link-input" value={generatedLink} readOnly />
          <button type="button" className="btn btn-primary generated-link-button" onClick={handleCopy}>
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ShareItemModal;
