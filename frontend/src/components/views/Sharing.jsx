import React, { useState } from 'react';
import Header from '../layout/Header';
import { MoreVertical } from 'lucide-react';
import '../../styles/sharing.css';
import { useSharedItems } from '../../context/SharedItemsContext';

const Sharing = () => {
  const { sharedItems } = useSharedItems();
  const [activeItemId, setActiveItemId] = useState(null);

  const handleActionClick = (e, itemId) => {
    e.stopPropagation();
    setActiveItemId(itemId === activeItemId ? null : itemId);
  };

  return (
    <div className="main-content">
      <Header title="Compartilhamentos Ativos" />
      <div className="sharing-list">
        {sharedItems.map((share) => (
          <div key={share.id} className="share-item">
            <div className="share-info">
              <span className="share-name">{share.name}</span>
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
