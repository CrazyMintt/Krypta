import React from 'react';
import './CredentialDetails.css';

interface Credential {
  id: number;
  nome_aplicacao: string;
  senha: {
    email: string;
    host_url: string;
    senha_cripto: string;
  };
}

interface CredentialDetailsProps {
  credential: Credential;
  onBack: () => void;
}

const CredentialDetails: React.FC<CredentialDetailsProps> = ({ credential, onBack }) => {
  return (
    <div className="details-container">
      <button className="back-button" onClick={onBack}>Back</button>
      <div className="credential-details">
        <h2>{credential.nome_aplicacao}</h2>
        <p><strong>Email:</strong> {credential.senha.email}</p>
        <p><strong>Host:</strong> {credential.senha.host_url}</p>
        <p><strong>Password:</strong> {credential.senha.senha_cripto}</p>
      </div>
    </div>
  );
};

export default CredentialDetails;
