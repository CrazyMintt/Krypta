import React, { useState, useEffect } from "react";

const RenameFolderForm = ({ folder, onCancel, updateFolderName }) => {
  const [name, setName] = useState("");

  useEffect(() => {
    if (folder) setName(folder.name);
  }, [folder]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim() === "") return;
    
    updateFolderName({
      index: folder.index,
      name: name.trim()
    });
  };

  return (
    <form className="item-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label">Novo nome da pasta</label>
        <input
          type="text"
          className="form-input"
          placeholder="Nome da pasta"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          required
        />
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary">
          Salvar
        </button>
      </div>
    </form>
  );
};

export default RenameFolderForm;
