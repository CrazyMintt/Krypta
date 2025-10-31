import React, { useState } from 'react';
import Header from '../layout/Header';
import { MoreVertical } from 'lucide-react';
import '../../styles/sharing.css';

const mockActiveShares = [
  {
    id: 1,
    name: 'senha_wifi',
    sharedWith: 'user@example.com',
    accessesLeft: 5,
    expiresIn: '2 horas',
  },
  {
    id: 2,
    name: 'relatorio_q3.pdf',
    sharedWith: 'friend@example.com',
    accessesLeft: 1,
    expiresIn: '1 dia',
  },
];

const Sharing = () => {
  const [activeShares, setActiveShares] = useState(mockActiveShares);
  const [activeItemId, setActiveItemId] = useState(null);

  const handleActionClick = (e, itemId) => {
    e.stopPropagation();
    setActiveItemId(itemId === activeItemId ? null : itemId);
  };

  return (
    <div className="main-content">
      <Header title="Compartilhamentos Ativos" />
      <div className="sharing-list">
        {activeShares.map((share) => (
          <div key={share.id} className="share-item">
            <div className="share-info">
              <span className="share-name">{share.name}</span>
              <span className="share-with">Compartilhado com: {share.sharedWith}</span>
              <span className="share-details">
                Acessos restantes: {share.accessesLeft} | Expira em: {share.expiresIn}
              </span>
            </div>
            <div className="share-actions">
              <button onClick={(e) => handleActionClick(e, share.id)}>
                <MoreVertical size={16} />
              </button>
              {activeItemId === share.id && (
                <div className="item-actions-menu">
                  <div className="menu-item">Alterar</div>
                  <div className="menu-item">Remover</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sharing;
