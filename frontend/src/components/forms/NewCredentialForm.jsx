import React, { useRef, useState, useEffect } from "react";

const NewCredentialForm = ({ onCancel, addPassword, editItem, updatePassword, allTags = [] }) => {
  const passwordInputRef = useRef(null);
  const eyeIconRef = useRef(null);

  const [name, setName] = useState('');
  const [folder, setFolder] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [tagColor, setTagColor] = useState('#ff0000');

  const isEditing = Boolean(editItem);

  useEffect(() => {
    if (isEditing) {
      setName(editItem.name || "");
      setEmail(editItem.email || "");
      setFolder(editItem.vault || "");
      setPassword(editItem.password || "");
      setUrl(editItem.url || "");
      setTags(editItem.tags || []);
    } else {
      setName("");
      setEmail("");
      setFolder("");
      setPassword("");
      setUrl("");
      setTags([]);
    }
  }, [isEditing, editItem]);

  const togglePassword = () => {
    if (!passwordInputRef.current || !eyeIconRef.current) return;

    const input = passwordInputRef.current;
    if (input.type === "password") {
      input.type = "text";
      eyeIconRef.current.innerHTML = `
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      `;
    } else {
      input.type = "password";
      eyeIconRef.current.innerHTML = `
        <path d="M1 12s4-8 11-8 
        11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      `;
    }
  };

  const isTagAdded = tags.find(tag => tag.name === tagInput);

  const handleAddTag = () => {
    if (!tagInput) return;

    if (isTagAdded) {
      handleRemoveTag(tagInput);
    } else {
      setTags([...tags, { name: tagInput, color: tagColor }]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (name) => {
    setTags(tags.filter(tag => tag.name !== name));
  };

  const handleExistingTagClick = (existingTag) => {
    const isAlreadySelected = tags.find(tag => tag.name === existingTag.name);
    if (isAlreadySelected) {
      handleRemoveTag(existingTag.name);
    } else {
      setTags([...tags, existingTag]);
    }
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    const data = {
      ...editItem,
      name,
      vault: folder,
      email,
      password,
      url,
      tags,
      color: tags.length > 0 ? tags[0].color : "gray",
    };

    if (isEditing) {
      updatePassword(data);
    }
    else {
      addPassword(data);
    }
  };

  return (
    <form className="item-form" onSubmit={handleFormSubmit}>
      <div className="form-section">
        <div className="form-group">
          <label className="form-label">
            Nome <span className="required">*</span>
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="Digite o nome do item"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Pasta</label>
          <select
            className="form-select"
            value={folder}
            onChange={e => setFolder(e.target.value)}
          >
            <option value="">Selecione uma pasta</option>
            <option value="Cofre 1">Cofre 1</option>
            <option value="Cofre 2">Cofre 2</option>
            <option value="Cofre 3">Cofre 3</option>
          </select>
        </div>
      </div>
      <div className="divider"></div>
      <div className="form-section">
        <h3 className="section-title">Credenciais</h3>

        <div className="form-group">
          <label className="form-label">Email/username</label>
          <input
            type="text"
            className="form-input"
            placeholder="exemplo@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Senha</label>
          <div className="password-input-wrapper">
            <input
              type="password"
              ref={passwordInputRef}
              className="form-input"
              placeholder="Digite a senha"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button type="button" className="toggle-password" onClick={togglePassword}>
              <svg
                ref={eyeIconRef}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11
                8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="divider"></div>
      <div className="form-section">
        <h3 className="section-title">
          Preenchimento automático
        </h3>

        <div className="form-group">
          <label className="form-label">Site (url)</label>
          <input
            type="url"
            className="form-input"
            placeholder="https://exemplo.com"
            value={url}
            onChange={e => setUrl(e.target.value)}
          />
        </div>
      </div>
      <div className="divider"></div>
      <div className="form-section">
        <h3 className="section-title">Tags</h3>
        <div className="tag-management">
          <div className="tag-input-wrapper">
            <input
              type="text"
              className="form-input"
              placeholder="Nova tag"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
            />
            <input
              type="color"
              value={tagColor}
              onChange={e => setTagColor(e.target.value)}
            />
            <button 
              type="button" 
              className={`btn ${isTagAdded ? 'btn-danger' : 'btn-primary'}`}
              onClick={handleAddTag}
            >
              {isTagAdded ? 'Remover' : 'Adicionar'}
            </button>
          </div>
          <div className="tag-list-modal">
            {tags.map((tag) => (
              <div key={tag.name} className="tag-item-modal" style={{ backgroundColor: tag.color }}>
                {tag.name}
                <button type="button" onClick={() => handleRemoveTag(tag.name)}>
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="existing-tags-list">
            {allTags.map(tag => (
              <div 
                key={tag.name} 
                className={`existing-tag-pill ${tags.find(t => t.name === tag.name) ? 'selected' : ''}`}
                style={{ backgroundColor: tag.color, borderColor: tags.find(t => t.name === tag.name) ? tag.color : 'transparent' }}
                onClick={() => handleExistingTagClick(tag)}>
                {tag.name}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary">
          {isEditing ? "Salvar alterações" : "Salvar"}
        </button>
      </div>
    </form>
  );
}

export default NewCredentialForm;
