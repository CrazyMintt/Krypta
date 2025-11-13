import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import { useCryptoKey } from "../../context/cryptoKeyContext";
import { deleteUserData } from "../../services/userService";


import {
  exportVaultDecryptedJSON,
  exportVaultDecryptedCSV,
} from "../../utils/exportVault";

import {
  readFileAsync,
  importDecryptedJSON,
  importDecryptedCSV,
} from "../../utils/importVault";

const SettingsModal = ({ isOpen, onCancel }) => {
  const [activeTab, setActiveTab] = useState("cofres");
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAll = async () => {
  if (isDeleting) return;

  setIsDeleting(true);

  try {
    await deleteUserData();

    alert("Todos os dados do cofre foram apagados com sucesso.");

    window.location.reload();
  } catch (err) {
    alert("Erro ao deletar: " + err.message);
  } finally {
    setIsDeleting(false);
    setShowDeleteConfirm(false);
  }
};

  const { cryptoKey } = useCryptoKey();

  const [importFileContent, setImportFileContent] = useState(null);
  const [importFormat, setImportFormat] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  const handleFileSelected = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await readFileAsync(file);
      setImportFileContent(text);

      if (file.name.endsWith(".json")) setImportFormat("json");
      else if (file.name.endsWith(".csv")) setImportFormat("csv");
      else {
        alert("Formato inválido. Apenas .json ou .csv.");
        return;
      }
    } catch (err) {
      alert("Falha ao ler arquivo: " + err.message);
    }
  };

  useEffect(() => {
    if (!importFileContent || !importFormat) return;

    confirmImport();
  }, [importFileContent, importFormat]);

  const confirmImport = async () => {
    if (!cryptoKey) {
      alert("A chave criptográfica ainda não está carregada. Tente novamente.");
      return;
    }

    setIsImporting(true);

    try {
      if (importFormat === "json") {
        await importDecryptedJSON(importFileContent, cryptoKey);
      } else {
        await importDecryptedCSV(importFileContent, cryptoKey);
      }

      alert("Importação concluída com sucesso.");
    } catch (err) {
      alert("Erro ao importar: " + err.message);
    } finally {
      setImportFileContent(null);
      setImportFormat(null);
      setIsImporting(false);
    }
  };

  const handleExportJSON = async () => {
    if (!cryptoKey) {
      alert("Chave de criptografia não carregada. Faça login novamente.");
      return;
    }

    try {
      await exportVaultDecryptedJSON(cryptoKey);
    } catch (err) {
      alert("Erro ao exportar JSON: " + err.message);
    }
  };

  const handleExportCSV = async () => {
    if (!cryptoKey) {
      alert("Chave de criptografia não carregada. Faça login novamente.");
      return;
    }

    try {
      await exportVaultDecryptedCSV(cryptoKey);
    } catch (err) {
      alert("Erro ao exportar CSV: " + err.message);
    }
  };

  return (
    <>
      <Modal title="Configurações" isOpen={isOpen} onCancel={onCancel} className="settings">
        <div className="settings-modal">

          <div className="settings-sidebar">
            <ul>
              <li
                className={activeTab === "cofres" ? "active" : ""}
                onClick={() => setActiveTab("cofres")}
              >
                Cofres
              </li>
              <li
                className={activeTab === "sobre" ? "active" : ""}
                onClick={() => setActiveTab("sobre")}
              >
                Sobre
              </li>
            </ul>
          </div>

          <div className="settings-content">
            {activeTab === "cofres" && (
              <>
                <h2>Dados</h2>

                <div className="settings-section">

                  <div className="settings-item">
                    <div>
                      <h3>Importar</h3>
                      <p>Importe senhas em CSV ou JSON (texto puro).</p>
                    </div>

                    <input
                      type="file"
                      id="vault-import-input"
                      style={{ display: "none" }}
                      accept=".json,.csv"
                      onChange={handleFileSelected}
                    />

                    <button
                      className="btn btn-primary"
                      disabled={isImporting}
                      onClick={() =>
                        document.getElementById("vault-import-input").click()
                      }
                    >
                      {isImporting ? "Importando..." : "Importar"}
                    </button>
                  </div>

                  <div className="settings-item">
                    <div>
                      <h3>Exportar</h3>
                      <p>Exporte suas senhas em formato legível.</p>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <button className="btn btn-primary" onClick={handleExportJSON}>
                        Exportar JSON
                      </button>

                      <button className="btn btn-primary" onClick={handleExportCSV}>
                        Exportar CSV
                      </button>
                    </div>
                  </div>

                  <div className="settings-item">
                    <div>
                      <h3>Deletar</h3>
                      <p>Apagar completamente o cofre.</p>
                    </div>
                    <button
                      className="btn btn-danger"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      Deletar
                    </button>
                  </div>
                </div>

                {/* Aparência */}
                <h2>Aparência</h2>
                <div className="settings-section">
                  <div className="settings-item">
                    <div>
                      <h3>Tema</h3>
                      <p>Escolha entre tema claro ou escuro.</p>
                    </div>
                    <div className="theme-toggle">
                      <label className="theme-switch">
                        <input
                          type="checkbox"
                          checked={theme === "light"}
                          onChange={toggleTheme}
                        />
                        <span className="slider" />
                      </label>
                      <span className="theme-label">
                        {theme === "dark" ? "Escuro" : "Claro"}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === "sobre" && (
              <>
                <h2>Sobre o Krypta</h2>
                <div className="settings-section">
                  <p>
                    O Krypta é um gerenciador de senhas focado em segurança e simplicidade.
                    Todo conteúdo é criptografado localmente antes de ser enviado ao servidor.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        title="Apagar Cofre"
        isOpen={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        >
        <p>
          Tem certeza que deseja apagar completamente seu cofre?
          <br /><br />
          <strong>Esta ação é irreversível.</strong><br />
          Todas as suas credenciais, pastas e arquivos serão removidos permanentemente.
        </p>

        <div className="modal-actions">
          <button
            className="btn btn-secondary"
            onClick={() => setShowDeleteConfirm(false)}
          >
            Cancelar
          </button>

          <button
            className="btn btn-danger"
            onClick={handleDeleteAll}
            disabled={isDeleting}
          >
            {isDeleting ? "Apagando..." : "Deletar Tudo"}
          </button>
        </div>
        </Modal>
    </>
  );
};

export default SettingsModal;
