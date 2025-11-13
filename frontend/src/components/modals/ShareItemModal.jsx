// src/components/modals/ShareItemModal.jsx

import React, { useState } from "react";
import { useSharedItems } from "../../context/SharedItemsContext";
import { createShare } from "../../services/shareService";
import * as dataService from "../../services/dataService";
import { useCryptoKey } from "../../context/cryptoKeyContext";

const ShareItemModal = ({ item, onCancel }) => {
  const { cryptoKey } = useCryptoKey();

  const [accessCount, setAccessCount] = useState(1);
  const [durationValue, setDurationValue] = useState(1);
  const [durationUnit, setDurationUnit] = useState("horas");
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { addSharedItem, activityLog, setActivityLog } = useSharedItems();

  const handleGenerateLink = async () => {
    if (!item?.id) {
      alert("Item inválido para compartilhamento.");
      return;
    }

    if (!cryptoKey) {
      alert("Chave criptográfica não inicializada. Faça login/desbloqueie o cofre.");
      return;
    }

    setIsLoading(true);

    try {
      // =================================
      // 1. Calcular data de expiração
      // =================================
      const expiration = new Date();
      const duration = Number(durationValue);

      if (durationUnit === "minutos") {
        expiration.setMinutes(expiration.getMinutes() + duration);
      } else if (durationUnit === "horas") {
        expiration.setHours(expiration.getHours() + duration);
      } else if (durationUnit === "dias") {
        expiration.setDate(expiration.getDate() + duration);
      }

      // =================================
      // 2. Buscar dado completo no backend
      // =================================
      const full = await dataService.getDataById(item.id);
      // full.tipo provavelmente é "arquivo" ou "senha" (ou enum equivalente)
      const tipo = (full.tipo || "").toString().toLowerCase();

      let originalCipher = null;
      let originalIv = null;

      if (tipo === "arquivo" || tipo === "file") {
        originalCipher = full.arquivo?.arquivo_data || null;
        originalIv = full.arquivo?.iv_arquivo || null;
      } else if (tipo === "senha" || tipo === "credential") {
        originalCipher = full.senha?.senha_cripto || null;
        originalIv = full.senha?.iv_senha_cripto || null;
      }

      if (!originalCipher || !originalIv) {
        alert("Este item não possui dados criptografados para compartilhamento.");
        setIsLoading(false);
        return;
      }

      // =================================
      // 3. Transformar cipher original (Base64 → bytes)
      // =================================
      const cipherBytes = Uint8Array.from(
        atob(originalCipher),
        (c) => c.charCodeAt(0)
      );

      // =================================
      // 4. Gerar nova IV
      // =================================
      const newIv = crypto.getRandomValues(new Uint8Array(12));

      // =================================
      // 5. Recriptografar o blob inteiro (cipher original)
      // =================================
      const reencrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: newIv },
        cryptoKey,
        cipherBytes
      );

      const encryptedB64 = btoa(
        String.fromCharCode(...new Uint8Array(reencrypted))
      );
      const ivB64 = btoa(String.fromCharCode(...newIv));

      // =================================
      // 6. Montar payload para o backend
      // =================================
      const payload = {
        itens: [
          {
            dado_origem_id: item.id,
            dado_criptografado: encryptedB64,
            iv_dado: ivB64,
            meta: item.name,
          },
        ],
        data_expiracao: expiration.toISOString(),
        n_acessos_total: Number(accessCount),
      };

      // Chamada à API /shares/
      const response = await createShare(payload);

      // =================================
      // 7. Atualizar estado local (UI)
      // =================================
      setGeneratedLink(response.share_link);

      addSharedItem({
        id: response.id || Math.random(),
        name: item.name,
        sharedWith: "link",
        accessesLeft: accessCount,
        expiresIn: new Date(expiration).toLocaleString(),
      });

      setActivityLog([
        {
          type: "add",
          title: `Item "${item.name}" compartilhado`,
          time: new Date().toLocaleString(),
        },
        ...activityLog,
      ]);
    } catch (err) {
      console.error("Erro ao gerar link:", err);
      alert(err.response?.data?.detail || "Erro ao gerar link.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="share-modal">
      {!generatedLink ? (
        <>
          <div className="form-group">
            <label>Número de acessos permitidos:</label>
            <input
              type="number"
              className="form-input"
              value={accessCount}
              min="1"
              onChange={(e) => setAccessCount(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Duração:</label>
            <div className="duration-group">
              <input
                type="number"
                className="form-input"
                value={durationValue}
                min="1"
                onChange={(e) => setDurationValue(e.target.value)}
              />
              <select
                className="form-select"
                value={durationUnit}
                onChange={(e) => setDurationUnit(e.target.value)}
              >
                <option value="minutos">Minutos</option>
                <option value="horas">Horas</option>
                <option value="dias">Dias</option>
              </select>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleGenerateLink}
              disabled={isLoading}
            >
              {isLoading ? "Gerando..." : "Gerar"}
            </button>
          </div>
        </>
      ) : (
        <div className="generated-link-container">
          <p>Link de compartilhamento gerado:</p>
          <input
            type="text"
            className="form-input generated-link-input"
            value={generatedLink}
            readOnly
          />
          <button
            className="btn btn-primary generated-link-button"
            onClick={handleCopy}
          >
            {copied ? "Copiado!" : "Copiar"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ShareItemModal;
