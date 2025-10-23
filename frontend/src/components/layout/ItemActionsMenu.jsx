import React from 'react';
import { Trash2 } from 'lucide-react';

const ItemActionsMenu = React.forwardRef(({ onDelete }, ref) => {
  return (
    <div className="dropdown-menu" ref={ref}>
      <div className="dropdown-item" onClick={onDelete}>
        <Trash2 size={16} />
        <span>Excluir</span>
      </div>
    </div>
  );
});

export default ItemActionsMenu;
