import React from "react";
import { Eye, EyeOff, Clipboard } from "lucide-react";
import { useCryptoKey } from "../../context/cryptoKeyContext";
import { decryptText } from "../../utils/decryptText";

const ReadCredentialModal = ({ credential }) => {

  const [plainPassword, setPlainPassword] = React.useState("");
  const { cryptoKey } = useCryptoKey();

  const [showPassword, setShowPassword] = React.useState(false);
  if (!credential) return null;

  const copyToClipboard = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      // fallback
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
  };

  React.useEffect(() => {
  if (!credential) return;
  const encrypted = credential.password;
  const iv = credential.passwordIv;

  if (!encrypted || !iv) return;
  if (!cryptoKey) return;

  const decrypt = async () => {
    try {
      const pwd = await decryptText(cryptoKey, encrypted, iv);
      setPlainPassword(pwd);
    } catch (err) {
      console.error("Erro ao descriptografar senha:", err);
      setPlainPassword("[erro]");
    }
  };

  decrypt();
}, [credential, cryptoKey]);

  return (
    <div className="item-form" role="region" aria-label="Detalhes da credencial">
      <div className="form-group">
        <label className="form-label">Nome</label>
        <div className="copyable-input">
          <input type="text" className="form-input" value={credential.name || ""} readOnly />
          <button type="button" className="copy-btn" aria-label="Copiar nome" onClick={() => copyToClipboard(credential.name || "")}>
            <Clipboard size={18} />
          </button>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Email/Usuário</label>
        <div className="copyable-input">
          <input type="text" className="form-input" value={credential.email || ""} readOnly />
          <button type="button" className="copy-btn" aria-label="Copiar email/usuário" onClick={() => copyToClipboard(credential.email || "")}>
            <Clipboard size={18} />
          </button>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Senha</label>
        <div className="password-input-wrapper two-buttons">
          <input
            type={showPassword ? "text" : "password"}
            className="form-input"
            value={plainPassword}
            readOnly
          />
          <button
            type="button"
            className="toggle-password"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          <button
            type="button"
            className="copy-btn"
            aria-label="Copiar senha"
            onClick={() => copyToClipboard(plainPassword)}
          >
            <Clipboard size={18} />
          </button>
        </div>
      </div>

      {credential.url ? (
        <div className="form-group">
          <label className="form-label">URL</label>
          <div className="copyable-input">
            <input type="text" className="form-input" value={credential.url} readOnly />
            <button type="button" className="copy-btn" aria-label="Copiar URL" onClick={() => copyToClipboard(credential.url)}>
              <Clipboard size={18} />
            </button>
          </div>
        </div>
      ) : null}

      {Array.isArray(credential.tags) && credential.tags.length > 0 && (
        <div className="form-group">
          <label className="form-label">Tags</label>
          <div className="tag-list-modal">
            {credential.tags.map((tag, idx) => (
              <div key={`${tag.name}-${idx}`} className="tag-item-modal" style={{ backgroundColor: tag.color || "#ccc" }} title={tag.name}>
                {tag.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReadCredentialModal;
