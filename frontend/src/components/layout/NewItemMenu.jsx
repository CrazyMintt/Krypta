import React from 'react';
import { Folder, Lock } from 'lucide-react';

const NewItemMenu = React.forwardRef(({ onNewFolder, onNewCredential }, ref) => {
  return (
    <div className="dropdown-menu" ref={ref}>
      <div className="dropdown-item" onClick={onNewCredential}>
        <Lock size={16} />
        <span>Adicionar Credencial</span>
      </div>
      <div className="dropdown-item" onClick={onNewFolder}>
        <Folder size={16} />
        <span>Adicionar Pasta</span>
      </div>
    </div>
  );
});

export default NewItemMenu;
