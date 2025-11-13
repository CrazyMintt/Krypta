import React, { useState, useEffect } from "react";
import Modal from "../layout/Modal";

const TagModal = ({ isOpen, onCancel, onSave, initialValue = null }) => {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#ff0000");

  const normalizeColor = (c) => {
    if (!c) return "#ff0000";

    // #rrggbb
    if (c.length === 7) return c.toLowerCase();

    // #rgb → #rrggbb
    if (c.length === 4) {
      const r = c[1];
      const g = c[2];
      const b = c[3];
      return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }

    return "#ff0000";
  };

  useEffect(() => {
    if (initialValue) {
      setName(initialValue.name || "");
      setColor(normalizeColor(initialValue.color)); // pega cor existente
    } else {
      setName("");
      setColor("#ff0000");
    }
  }, [initialValue, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      color,
    });
  };

  return (
    <Modal
      title={initialValue ? "Editar Tag" : "Nova Tag"}
      isOpen={isOpen}
      onCancel={onCancel}
    >
      <form onSubmit={handleSubmit} className="tag-modal-form">
        <div className="form-group">
          <label className="form-label">Nome</label>
          <input
            type="text"
            className="form-input"
            placeholder="Nome da tag"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Cor</label>
          <div className="color-picker-wrapper">
            <input
              type="color"
              className="color-picker"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
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
    </Modal>
  );
};

export default TagModal;
