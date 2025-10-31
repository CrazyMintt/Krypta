import React, { useState, useEffect, useRef } from 'react';
import { Plus, Bell, User } from 'lucide-react';
import Notifications from './Notifications';
import NewItemMenu from './NewItemMenu';
import UserMenu from './UserMenu';

const Header = ({ title, onNewFolder, onNewCredential, onLogout }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNewItemMenu, setShowNewItemMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const notificationsRef = useRef(null);
  const bellRef = useRef(null);
  const newItemMenuRef = useRef(null);
  const newButtonRef = useRef(null);
  const userMenuRef = useRef(null);
  const userAvatarRef = useRef(null);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    setShowNewItemMenu(false);
    setShowUserMenu(false);
  };

  const toggleNewItemMenu = () => {
    setShowNewItemMenu(!showNewItemMenu);
    setShowNotifications(false);
    setShowUserMenu(false);
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
    setShowNotifications(false);
    setShowNewItemMenu(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close notifications
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target) &&
        bellRef.current &&
        !bellRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target) &&
        userAvatarRef.current &&
        !userAvatarRef.current.contains(event.target)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="main-header">
      <h1>{title}</h1>
      <div className="header-actions">
        <div className="header-action-item">
          <button className="new-button" onClick={toggleNewItemMenu} ref={newButtonRef}><Plus size={16} />Novo</button>
          {showNewItemMenu && <NewItemMenu ref={newItemMenuRef} onNewFolder={onNewFolder} onNewCredential={onNewCredential} />}
        </div>
        <div className="header-action-item">
          <button className="icon-button" onClick={toggleNotifications} ref={bellRef}><Bell size={20} /></button>
          {showNotifications && <Notifications ref={notificationsRef} />}
        </div>
        <div className="header-action-item">
            <button className="icon-button user-avatar" onClick={toggleUserMenu} ref={userAvatarRef}>
                <User size={20} />
            </button>
            {showUserMenu && <UserMenu ref={userMenuRef} onLogout={onLogout} />}
        </div>
      </div>
    </div>
  );
};

export default Header;