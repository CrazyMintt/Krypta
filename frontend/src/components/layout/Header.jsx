import React, { useState, useEffect, useRef } from 'react';
import { Plus, Bell } from 'lucide-react';
import Notifications from './Notifications';
import NewItemMenu from './NewItemMenu';
import "../../styles/header.css";

const Header = ({ title, onNewFolder, onNewCredential }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNewItemMenu, setShowNewItemMenu] = useState(false);
  const [user, setUser] = useState(null);
  const [avatarColor, setAvatarColor] = useState('#3b82f6');

  const notificationsRef = useRef(null);
  const bellRef = useRef(null);
  const newItemMenuRef = useRef(null);
  const newButtonRef = useRef(null);


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
      const color = generateColorFromName(parsedUser.nome || 'user');
      setAvatarColor(color);
    }
  }, []);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    setShowNewItemMenu(false);
  };

  const toggleNewItemMenu = () => {
    setShowNewItemMenu(!showNewItemMenu);
    setShowNotifications(false);
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
      // Close new item menu
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
        <div className="header-buttons">
          <button
            className="new-button"
            onClick={toggleNewItemMenu}
            ref={newButtonRef}
          >
            <Plus size={16} /> Novo
          </button>
          {showNewItemMenu && (
            <NewItemMenu
              ref={newItemMenuRef}
              onNewFolder={onNewFolder}
              onNewCredential={onNewCredential}
            />
          )}

          <button
            className="icon-button"
            onClick={toggleNotifications}
            ref={bellRef}
          >
            <Bell size={20} />
          </button>
          {showNotifications && <Notifications ref={notificationsRef} />}
        </div>
        {user && (
          <div className="user-info" title={user.nome}>
            <div
              className="user-avatar"
              style={{ backgroundColor: avatarColor }}
            >
              {user.nome ? user.nome.charAt(0).toUpperCase() : '?'}
            </div>
            <span className="user-name">{user.nome}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;