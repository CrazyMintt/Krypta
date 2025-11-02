import React from 'react';
import { LogOut } from 'lucide-react';

const UserMenu = React.forwardRef(({ onLogout }, ref) => {
  const handleActionClick = (e, action) => {
    e.stopPropagation();
    action(e);
  };

  return (
    <div className="dropdown-menu" ref={ref}>
      <div className="dropdown-item" onClick={(e) => handleActionClick(e, onLogout)}>
        <LogOut size={16} />
        <span>Sair</span>
      </div>
    </div>
  );
});

export default UserMenu;
