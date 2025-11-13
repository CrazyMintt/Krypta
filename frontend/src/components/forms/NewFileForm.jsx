import React, { useState } from "react";
import * as fileService from "../../services/fileService";
import { encryptFile } from "../../utils/encryptFile";
import { useCryptoKey } from "../../context/cryptoKeyContext";

const NewFileForm = ({ onCancel, onSuccess, currentFolderId }) => {
  const [file, setFile] = useState(null);
  const [customName, setCustomName] = useState("");
  const { cryptoKey } = useCryptoKey();

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;

    setFile(f);

    setCustomName(f.name.replace(/\.[^/.]+$/, ""));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      alert("Selecione um arquivo.");
      return;
    }

    if (!cryptoKey) {
      alert("Chave de criptografia não carregada. Faça login novamente.");
      return;
    }

    try {
      // Ler arquivo como ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Criptografar arquivo
      const encrypted = await encryptFile(cryptoKey, arrayBuffer);

      const ext = "." + file.name.split(".").pop();

      const payload = {
        nome_aplicacao: customName || file.name,
        arquivo: {
          arquivo_data: encrypted.ciphertext,
          iv_arquivo: encrypted.iv,
          extensao: ext,
          nome_arquivo: file.name,
        },
        id_pasta: currentFolderId ?? null,
        id_tags: [],
      };

      await fileService.createFile(payload);

      onSuccess();
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar arquivo: " + err.message);
    }
  };

  return (
    <form className="item-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Arquivo</label>
        <input type="file" onChange={handleFileChange} />
      </div>

      <div className="form-group">
        <label>Nome exibido</label>
        <input
          type="text"
          className="form-input"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
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

export default NewFileForm;
