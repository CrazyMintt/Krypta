import React, { useState, useEffect, useRef } from 'react';
import { Plus, Bell } from 'lucide-react';
import Notifications from './Notifications';
import NewItemMenu from './NewItemMenu';
import UserMenu from './UserMenu';
import "../../styles/header.css"

const Header = ({ title, onNewFolder, onNewCredential, onLogout }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNewItemMenu, setShowNewItemMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [user, setUser] = useState(null);
  const [avatarColor, setAvatarColor] = useState('#3b82f6');

  const notificationsRef = useRef(null);
  const bellRef = useRef(null);
  const newItemMenuRef = useRef(null);
  const newButtonRef = useRef(null);
  const userMenuRef = useRef(null);
  const userAvatarRef = useRef(null);

  const generateColorFromName = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 50%)`;
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setAvatarColor(generateColorFromName(parsedUser.nome || 'user'));
    }
  }, []);

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
      if (
        newItemMenuRef.current &&
        !newItemMenuRef.current.contains(event.target) &&
        newButtonRef.current &&
        !newButtonRef.current.contains(event.target)
      ) {
        setShowNewItemMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="main-header">
      <h1>{title}</h1>
      <div className="header-actions">
        <div className="header-action-item" ref={newItemMenuRef}>
          <button className="new-button" onClick={toggleNewItemMenu} ref={newButtonRef}>
            <Plus size={16} /> Novo
          </button>
          {showNewItemMenu && (
            <NewItemMenu onNewFolder={onNewFolder} onNewCredential={onNewCredential} />
          )}
        </div>

        <div className="header-action-item" ref={notificationsRef}>
          <button className="icon-button" onClick={toggleNotifications} ref={bellRef}>
            <Bell size={20} />
          </button>
          {showNotifications && <Notifications />}
        </div>

        {user && (
          <div className="header-action-item user-info" ref={userMenuRef}>
            <div
              className="user-avatar"
              style={{ backgroundColor: avatarColor }}
              onClick={toggleUserMenu}
              ref={userAvatarRef}
            >
              {user.nome ? user.nome.charAt(0).toUpperCase() : '?'}
            </div>
            <span className="user-name">{user.nome}</span>
            {showUserMenu && <UserMenu onLogout={onLogout} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default Header