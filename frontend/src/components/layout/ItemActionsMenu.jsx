import React from 'react';
import { Trash2, Edit, Eye, Share2 } from 'lucide-react';

const ItemActionsMenu = React.forwardRef(
  ({ onEditCredential, onEditFolder, onDelete, onViewCredential, onShare, itemType }, ref) => {
    const handleActionClick = (e, action) => {
      e.stopPropagation();
      action(e);
    };

    return (
      <div className="dropdown-menu" ref={ref}>
        {itemType === 'credential' && (
          <>
            <div className="dropdown-item" onClick={(e) => handleActionClick(e, onViewCredential)}>
              <Eye size={16} />
              <span>Visualizar</span>
            </div>
            <div className="dropdown-item" onClick={(e) => handleActionClick(e, onEditCredential)}>
              <Edit size={16} />
              <span>Editar</span>
            </div>
          </>
        )}
        {itemType === 'folder' && (
          <div className="dropdown-item" onClick={(e) => { e.stopPropagation(); onEditFolder(); }}>
            <Edit size={16} />
            <span>Renomear</span>
          </div>
        )}
        <div className="dropdown-item" onClick={(e) => handleActionClick(e, onShare)}>
          <Share2 size={16} />
          <span>Compartilhar</span>
        </div>
        <div className="dropdown-item" onClick={(e) => handleActionClick(e, onDelete)}>
          <Trash2 size={16} />
          <span>Excluir</span>
        </div>
      </div>
    );
  });

export default ItemActionsMenu;
