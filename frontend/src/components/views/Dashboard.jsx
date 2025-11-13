import React, { useEffect, useRef, useState } from "react";
import Header from "../layout/Header";
import { getUserDashboardStats } from "../../services/userService";
import { getMyNotifications } from "../../services/notificationService";


const Dashboard = ({
  openNewFolderModal,
  openNewCredentialModal,
  fileSystem,
  activityLog = [],
  onLogout,
}) => {
  const canvasRef = useRef(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);


  // ------------------- Busca dados do backend -------------------
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getUserDashboardStats();
      setStats(data);
    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  loadNotifications();
}, []);

const loadNotifications = async () => {
  try {
    setIsLoadingNotifications(true);
    const data = await getMyNotifications(1, 10); // primeira página, 10 registros
    setNotifications(data);
  } catch (err) {
    console.error("Erro ao carregar notificações:", err);
  } finally {
    setIsLoadingNotifications(false);
  }
};


  // ------------------- Helpers -------------------
  const bytesToGB = (b) => (b / (1024 ** 3)).toFixed(2);
  const bytesToMB = (b) => (b / (1024 ** 2)).toFixed(1);

  const formatRelativeTime = (iso) => {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now - date;

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Agora";
  if (minutes < 60) return `${minutes} min atrás`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h atrás`;

  const days = Math.floor(hours / 24);
  return `${days} dia${days > 1 ? "s" : ""} atrás`;
};


  // ------------------- Donut Chart -------------------
  useEffect(() => {
    if (!stats) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const total = stats.armazenamento_total_bytes;
      const used = stats.armazenamento_usado_bytes;

      const percent = (used / total) * 100;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 100;
      const lineWidth = 35;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Fundo
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = "#666";
      ctx.stroke();

      // Parte usada
      const usedAngle = (percent / 100) * 2 * Math.PI;
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "#8b5cf6");
      gradient.addColorStop(0.5, "#7c3aed");
      gradient.addColorStop(1, "#6d28d9");

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + usedAngle);
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = gradient;
      ctx.lineCap = "round";
      ctx.stroke();
    };

    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [stats]);

  // ------------------- UI -------------------
  const ActivityIcon = ({ type }) => {
    switch (type) {
      case "edit":
        return (
          <svg viewBox="0 0 24 24">
            <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
          </svg>
        );
      case "delete":
        return (
          <svg viewBox="0 0 24 24">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        );
    }
  };

  return (
    <div className="main-content dashboard-view">
      <Header
        title="Dashboard"
        onNewFolder={openNewFolderModal}
        onNewCredential={openNewCredentialModal}
        onLogout={onLogout}
      />

      <div className="dashboard-grid">
        {/* ------------------- Armazenamento ------------------- */}
        <div className="dashboard-section">
          <h2 className="section-title">Armazenamento</h2>

          {loading || !stats ? (
            <p>Carregando...</p>
          ) : (
            <>
              <div className="chart-container">
                <div className="donut-chart">
                  <canvas ref={canvasRef} width="280" height="280"></canvas>
                  <div className="chart-center">
                    <div className="chart-value">
                      {bytesToGB(stats.armazenamento_usado_bytes)} GB
                    </div>
                    <div className="chart-label">
                      de {bytesToGB(stats.armazenamento_total_bytes)} GB
                    </div>
                  </div>
                </div>
              </div>

              <div className="file-list">
                {stats.armazenamento_por_tipo.length === 0 ? (
                  <p className="empty-file-list">Nenhum arquivo armazenado.</p>
                ) : (
                  stats.armazenamento_por_tipo.map((f, i) => (
                    <div key={i} className="file-item">
                      <span className="file-type">{f.extensao.toUpperCase()}</span>
                      <span className="file-size">{bytesToMB(f.bytes_usados)} MB</span>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* ------------------- Atividade recente ------------------- */}
        <div className="dashboard-section">
          <h2 className="section-title">Atividade recente</h2>
          <div className="activity-list">
            {isLoadingNotifications && <p>Carregando...</p>}

            {!isLoadingNotifications && notifications.length === 0 && (
              <p>Nenhuma atividade encontrada.</p>
            )}

            {!isLoadingNotifications &&
              notifications.map((n) => (
                <div key={n.id} className="activity-item">
                  <div className="activity-icon">
                    <ActivityIcon type="info" />
                  </div>

                  <div className="activity-info">
                    <div className="activity-title">{n.notificacao}</div>
                    <div className="activity-time">
                      {formatRelativeTime(n.created_at)}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
