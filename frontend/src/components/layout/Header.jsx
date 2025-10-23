import React, { useState, useEffect, useRef } from 'react';
import { Plus, Bell } from 'lucide-react';
import Notifications from './Notifications';
import NewItemMenu from './NewItemMenu';

const Header = ({ title, onNewFolder, onNewCredential }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNewItemMenu, setShowNewItemMenu] = useState(false);
  
  const notificationsRef = useRef(null);
  const bellRef = useRef(null);
  const newItemMenuRef = useRef(null);
  const newButtonRef = useRef(null);

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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div id="main-header">
      <h1>{title}</h1>
      <div id="header-actions">
        <div style={{ position: 'relative' }}>
          <button className="new-button" onClick={toggleNewItemMenu} ref={newButtonRef}><Plus size={16} />Novo</button>
          {showNewItemMenu && <NewItemMenu ref={newItemMenuRef} onNewFolder={onNewFolder} onNewCredential={onNewCredential} />}
        </div>
        <div style={{ position: 'relative' }}>
          <button className="icon-button" onClick={toggleNotifications} ref={bellRef}><Bell size={20} /></button>
          {showNotifications && <Notifications ref={notificationsRef} />}
        </div>
        <div id="user-avatar"></div>
      </div>
    </div>
  );
};

export default Header;