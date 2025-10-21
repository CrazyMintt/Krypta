import React, { forwardRef } from 'react';

const Notifications = forwardRef((props, ref) => {
  return (
    <div className="notifications-panel" ref={ref}>
      <div className="notifications-header">
        <h4>Notificações</h4>
      </div>
      <div className="notifications-list">
        <div className="notification-item">
          <p className="notification-title">Nova atividade na sua conta</p>
          <p className="notification-time">2 minutos atrás</p>
        </div>
        <div className="notification-item">
          <p className="notification-title">Senha atualizada com sucesso</p>
          <p className="notification-time">1 hora atrás</p>
        </div>
        <div className="notification-item">
          <p className="notification-title">Bem-vindo ao Krypta!</p>
          <p className="notification-time">1 dia atrás</p>
        </div>
      </div>
    </div>
  );
});

export default Notifications;
