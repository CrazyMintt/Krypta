import React, { useState } from "react";
import Header from "../layout/Header";
import { useSharedWithMe } from "../../context/SharedWithMeContext";
import "../../styles/shared-with-me.css";

const SharedWithMePage = () => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const {
    receivedShares,
    addSharedToken,
    removeSharedToken
  } = useSharedWithMe();

  const extractToken = (urlOrToken) => {
    if (urlOrToken.includes("/share/")) {
      const parts = urlOrToken.split("/share/");
      return parts[1]?.trim().replace(/\//g, "");
    }
    return urlOrToken.trim();
  };

  const handleAdd = async () => {
    const token = extractToken(input);
    if (!token) return alert("Token inválido");

    setIsLoading(true);
    try {
      await addSharedToken(token);
      setInput("");
    } catch (err) {
      console.error(err);
      alert("Não foi possível adicionar o compartilhamento.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="main-content shared-with-me-container">
      <Header title="Compartilhados Comigo" />

      <div className="share-input-box">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Cole o link ou token de compartilhamento"
          className="form-input"
        />
        <button className="btn btn-primary" onClick={handleAdd} disabled={isLoading}>
          {isLoading ? "Carregando..." : "Adicionar"}
        </button>
      </div>

      <div className="sharing-list">
        {receivedShares.length === 0 && (
          <p className="empty-text">Nenhum compartilhamento encontrado.</p>
        )}

        {receivedShares.map((share) => (
          <div key={share.token} className="share-item">
            <div className="share-info">
              <span className="share-name">Token: {share.token}</span>
              <span className="share-details">
                Expira em: {new Date(share.dataExpiracao).toLocaleString()}
              </span>
            </div>

            <div className="share-actions">
              <button
                className="btn btn-secondary"
                onClick={() => removeSharedToken(share.token)}
              >
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SharedWithMePage;
