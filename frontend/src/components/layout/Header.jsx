import React, { useState, useEffect, useRef } from 'react';
import { Plus, Bell } from 'lucide-react';
import Notifications from './Notifications';

const Header = ({ title, openModal }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef(null);
  const bellRef = useRef(null);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target) &&
        bellRef.current &&
        !bellRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
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
        <button className="new-button" onClick={() => openModal(null)}><Plus size={16} />Novo</button>
        <button className="icon-button" onClick={toggleNotifications} ref={bellRef}><Bell size={20} /></button>
        {showNotifications && <Notifications ref={notificationsRef} />}
        <div id="user-avatar"></div>
      </div>
    </div>
  );
};

export default Header;