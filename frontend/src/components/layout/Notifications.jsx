import React, { forwardRef, useEffect, useState } from "react";
import { getMyNotifications } from "../../services/notificationService";

const Notifications = forwardRef((props, ref) => {
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await getMyNotifications(1, 20);
      setNotifications(data);
    } catch (err) {
      setError("Erro ao carregar notificações.");
    } finally {
      setLoading(false);
    }
  };

  function formatDateRelative(isoDate) {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now - date;

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Agora";
  if (minutes < 60) return `${minutes} min atrás`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h atrás`;

  const days = Math.floor(hours / 24);
  return `${days} dia${days > 1 ? "s" : ""} atrás`;
}


  return (
    <div className="notifications-panel" ref={ref}>
      <div className="notifications-header">
        <h4>Notificações</h4>
      </div>

      <div className="notifications-list">
        {loading && <p>Carregando...</p>}

        {error && <p className="error-text">{error}</p>}

        {!loading && notifications.length === 0 && (
          <p className="empty-text">Nenhuma notificação encontrada.</p>
        )}

        {!loading &&
          notifications.map((n) => (
            <div key={n.id} className="notification-item">
              <p className="notification-title">{n.notificacao}</p>
              <p className="notification-time">
                {formatDateRelative(n.created_at)}
              </p>
            </div>
          ))}
      </div>
    </div>
  );
});

export default Notifications;
