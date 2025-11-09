import React, { useRef, useState, useEffect } from "react";
import { credentialService, folderService, tagService } from "../../services";

const NewCredentialForm = ({
  onCancel,
  editItem,
  initialTags = [],
  onSuccess,
  currentFolderId = null,
}) => {
  const passwordInputRef = useRef(null);
  const eyeIconRef = useRef(null);

  const [name, setName] = useState("");
  const [folder, setFolder] = useState(currentFolderId || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState([]);
  const [allTags, setAllTags] = useState(initialTags);
  const [loadingTags, setLoadingTags] = useState(true);
  const [tagInput, setTagInput] = useState("");
  const [tagColor, setTagColor] = useState("#ff0000");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [folders, setFolders] = useState([]);
  const [loadingFolders, setLoadingFolders] = useState(true);

  const isEditing = Boolean(editItem);

  useEffect(() => {
    if (isEditing) {
      setName(editItem.nome_aplicacao || "");
      setEmail(editItem.senha?.email || "");
      setPassword(editItem.senha?.senha_cripto || "");
      setUrl(editItem.senha?.host_url || "");
      setFolder(editItem.id_pasta || currentFolderId || "");
      setDescription(editItem.descricao || "");
      setTags(editItem.tags || []);
    } else {
      setName("");
      setEmail("");
      setPassword("");
      setUrl("");
      setFolder(currentFolderId || "");
      setDescription("");
      setTags([]);
    }
  }, [isEditing, editItem, currentFolderId]);

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const data = await folderService.getRootFolders();
        setFolders(data || []);
      } catch (err) {
        console.error("Erro ao carregar pastas:", err);
        setFolders([]);
      } finally {
        setLoadingFolders(false);
      }
    };
    fetchFolders();
  }, []);

  useEffect(() => {
  const fetchTags = async () => {
    try {
      const data = await tagService.getAllTags();
      setAllTags(data || []);
    } catch (err) {
      console.error("Erro ao carregar tags:", err);
      setAllTags([]);
    } finally {
      setLoadingTags(false);
    }
  };
  fetchTags();
}, []);


  const togglePassword = () => {
    if (!passwordInputRef.current || !eyeIconRef.current) return;
    const input = passwordInputRef.current;
    if (input.type === "password") {
      input.type = "text";
      eyeIconRef.current.innerHTML = `
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20
        c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24
        A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19
        m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      `;
    } else {
      input.type = "password";
      eyeIconRef.current.innerHTML = `
        <path d="M1 12s4-8 11-8 11 8 11 8
        -4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      `;
    }
  };

  const isTagAdded = tags.find((tag) => tag.nome === tagInput);

  const handleAddTag = async () => {
  if (!tagInput.trim()) return;

  const existingTag = allTags.find(
    (tag) => tag.nome.toLowerCase() === tagInput.trim().toLowerCase()
  );

  try {
    let newTag;
    if (existingTag) {
      const alreadySelected = tags.some((t) => t.id === existingTag.id);
      if (alreadySelected) handleRemoveTag(existingTag.id);
      else setTags([...tags, existingTag]);
      return;
    }

    const created = await tagService.createTag({
      nome: tagInput.trim(),
      cor: tagColor,
    });
    newTag = created;

    setTags([...tags, newTag]);
    setAllTags([...allTags, newTag]);


    setTagInput("");
  } catch (err) {
    console.error("Erro ao criar tag:", err);
    alert(err.response?.data?.detail || "Erro ao criar nova tag.");
  }
};

  const handleRemoveTag = (tagId) => {
  setTags(tags.filter((tag) => tag.id !== tagId));
};

  const handleExistingTagClick = (existingTag) => {
  const isAlreadySelected = tags.some((tag) => tag.id === existingTag.id);
  if (isAlreadySelected) handleRemoveTag(existingTag.id);
  else setTags([...tags, existingTag]);
};

  const handleTagInputKeyDown = (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    if (!tagInput.trim() || isSubmitting) return;
    handleAddTag();
  }
};

  const handleFormSubmit = async (e) => {
  e.preventDefault();
  if (isSubmitting) return;
  setIsSubmitting(true);

  const payload = {
    nome_aplicacao: name,
    ...(description?.trim() && { descricao: description.trim() }),
    senha: {
      ...(password?.trim() && { senha_cripto: password.trim() }),
      ...(email?.trim() && { email: email.trim() }),
      ...(url?.trim() && { host_url: url.trim() }),
    },
    ...(folder && { id_pasta: folder }),
    ...(tags.length > 0 && { id_tags: tags.map((t) => t.id || 0) }),
  };

  try {
    if (isEditing) {
      await credentialService.updateCredential(editItem.id, payload);
      alert("Credencial atualizada com sucesso!");
    } else {
      await credentialService.createCredential(payload);
      alert("Credencial criada com sucesso!");
    }

    if (onSuccess) onSuccess();
    onCancel();
  } catch (err) {
    console.error("Erro ao salvar credencial:", err);
    alert(err.response?.data?.detail || "Erro ao salvar credencial.");
  } finally {
    setIsSubmitting(false);
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
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Pasta</label>
          {loadingFolders ? (
            <p>Carregando pastas...</p>
          ) : (
            <select
              className="form-select"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
            >
              <option value={currentFolderId || ""}>
                {currentFolderId ? "Pasta atual" : "Raiz (sem pasta)"}
              </option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </select>
          )}
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
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">
            Senha <span className="required">*</span>
          </label>
          <div className="password-input-wrapper">
            <input
              type="password"
              ref={passwordInputRef}
              className="form-input"
              placeholder="Digite a senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="toggle-password"
              onClick={togglePassword}
            >
              <svg
                ref={eyeIconRef}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8
                -4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="divider"></div>
      <div className="form-section">
        <h3 className="section-title">Preenchimento automático</h3>
        <div className="form-group">
          <label className="form-label">Site (url)</label>
          <input
            type="url"
            className="form-input"
            placeholder="https://exemplo.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Descrição (opcional)</label>
          <textarea
            className="form-input"
            placeholder="Digite uma descrição (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
            />
            <input
              type="color"
              value={tagColor}
              onChange={(e) => setTagColor(e.target.value)}
            />
            <button
              type="button"
              className={`btn ${isTagAdded ? "btn-danger" : "btn-primary"}`}
              onClick={handleAddTag}
            >
              {isTagAdded ? "Remover" : "Adicionar"}
            </button>
          </div>
          <div className="tag-list-modal">
            {tags.map((tag) => (
              <div
                key={tag.nome}
                className="tag-item-modal"
                style={{ backgroundColor: tag.cor }}
              >
                {tag.nome}
                <button type="button" onClick={() => handleRemoveTag(tag.id)}>
                  ✕
                </button>
              </div>
            ))}
          </div>

          {loadingTags ? (
            <p>Carregando tags...</p>
          ) : allTags.length > 0 ? (
            <div className="existing-tags-list">
              {allTags.map((tag) => (
                <div
                  key={tag.id}
                  className={`existing-tag-pill ${
                    tags.some((t) => t.id === tag.id) ? "selected" : ""
                  }`}
                  style={{
                    backgroundColor: tag.cor,
                    borderColor: tags.some((t) => t.id === tag.id)
                      ? tag.cor
                      : "transparent",
                  }}
                  onClick={() => handleExistingTagClick(tag)}
                >
                  {tag.nome}
                </div>
              ))}
            </div>
          ) : (
            <p>Nenhuma tag disponível.</p>
          )}

        </div>
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting
            ? "Salvando..."
            : isEditing
            ? "Salvar alterações"
            : "Salvar"}
        </button>
      </div>
    </form>
  );
};

export default NewCredentialForm;
