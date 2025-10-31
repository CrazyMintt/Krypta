import React, { useState } from 'react';

const ShareItemModal = ({ item, onCancel, onConfirm }) => {
  const [shareWith, setShareWith] = useState('');
  const [durationValue, setDurationValue] = useState(1);
  const [durationUnit, setDurationUnit] = useState('horas');

  const handleConfirm = () => {
    onConfirm({ shareWith, duration: `${durationValue} ${durationUnit}` });
  };

  return (
    <div className="share-modal">
      <div className="form-group">
        <label htmlFor="share-with">Compartilhar com (email):</label>
        <input
          type="email"
          id="share-with"
          className="form-input"
          value={shareWith}
          onChange={(e) => setShareWith(e.target.value)}
          placeholder="email@example.com"
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
        <button type="button" className="btn btn-primary" onClick={handleConfirm}>Compartilhar</button>
      </div>
    </div>
  );
};

export default ShareItemModal;
