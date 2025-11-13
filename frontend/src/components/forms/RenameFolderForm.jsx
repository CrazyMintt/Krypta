import React, { useState, useEffect } from "react";
import { folderService } from "../../services";

const RenameFolderForm = ({ folder, onCancel, updateFolderName }) => {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (folder) setName(folder.nome || "");
  }, [folder]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newName = name.trim();
    if (!newName || newName === folder.nome) return;

    setIsSubmitting(true);
    try {
      await folderService.updateFolder(folder.id, { nome: newName });
      updateFolderName({ ...folder, nome: newName });
      onCancel();
    } catch (err) {
      console.error("Erro ao renomear pasta:", err);
      alert(err.response?.data?.detail || "Erro ao renomear pasta.");
    } finally {
      setIsSubmitting(false);
    }
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
          maxLength={40}
        />
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
};

export default RenameFolderForm;
