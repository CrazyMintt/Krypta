import React from 'react';
import { Folder, Lock, FilePlus } from 'lucide-react';

const NewItemMenu = React.forwardRef(
  ({ onNewFolder, onNewCredential, onNewFile }, ref) => {
    return (
      <div className="dropdown-menu" ref={ref}>
        <div className="dropdown-item" onClick={onNewCredential}>
          <Lock size={16} />
          <span>Adicionar Credencial</span>
        </div>

        <div className="dropdown-item" onClick={onNewFile}>
          <FilePlus size={16} />
          <span>Adicionar Arquivo</span>
        </div>

        <div className="dropdown-item" onClick={onNewFolder}>
          <Folder size={16} />
          <span>Adicionar Pasta</span>
        </div>
      </div>
    );
  }
);

export default NewItemMenu;
