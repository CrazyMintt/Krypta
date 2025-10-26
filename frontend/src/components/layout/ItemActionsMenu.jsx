import React from 'react';
import { Trash2, Edit } from 'lucide-react';

const ItemActionsMenu = React.forwardRef(
  ({ onEditCredential, onEditFolder, onDelete, itemType }, ref) => {
    return (
      <div className="dropdown-menu" ref={ref}>
        {itemType === 'credential' && (
          <div className="dropdown-item" onClick={onEditCredential}>
            <Edit size={16} />
            <span>Editar</span>
          </div>
        )}
        {itemType === 'folder' && (
          <div className="dropdown-item" onClick={onEditFolder}>
            <Edit size={16} />
            <span>Renomear</span>
          </div>
        )}
        <div className="dropdown-item" onClick={onDelete}>
          <Trash2 size={16} />
          <span>Excluir</span>
        </div>
      </div>
    );
  });

export default ItemActionsMenu;
