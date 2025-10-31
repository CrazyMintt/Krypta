import React from 'react';
import { Eye, EyeOff, Clipboard } from 'lucide-react';

const ReadCredentialModal = ({ credential }) => {
  const [showPassword, setShowPassword] = React.useState(false);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    // You might want to show a notification that the text was copied
  };

  if (!credential) return null;

  return (
    <div className="item-form">
      <div className="form-group">
        <label className="form-label">Name</label>
        <input type="text" className="form-input" value={credential.name} readOnly />
      </div>
      <div className="form-group">
        <label className="form-label">Email/Username</label>
        <input type="text" className="form-input" value={credential.email} readOnly />
      </div>
      <div className="form-group">
        <label className="form-label">Password</label>
        <div className="password-input-wrapper two-buttons">
          <input
            type={showPassword ? 'text' : 'password'}
            className="form-input"
            value={credential.password} // Assuming the credential object has a password field
            readOnly
          />
          <button onClick={() => setShowPassword(!showPassword)} className="toggle-password">
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          <button onClick={() => handleCopy(credential.password)} className="copy-btn">
            <Clipboard size={18} />
          </button>
        </div>
      </div>
      {credential.url && (
        <div className="form-group">
          <label className="form-label">URL</label>
          <input type="text" className="form-input" value={credential.url} readOnly />
        </div>
      )}
      {credential.tags && credential.tags.length > 0 && (
        <div className="form-group">
          <label className="form-label">Tags</label>
          <div className="tag-list-modal">
            {credential.tags.map((tag) => (
              <div key={tag.name} className="tag-item-modal" style={{ backgroundColor: tag.color }}>
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
