import React, { useEffect, useRef } from 'react';
import { Plus, Bell } from 'lucide-react';

const Dashboard = ({ openModal }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const drawDonutChart = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 100;
      const lineWidth = 35;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const used = 1.3;
      const total = 1.5;
      const percentage = (used / total) * 100;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = '#666';
      ctx.stroke();

      const usedAngle = (percentage / 100) * 2 * Math.PI;
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#8b5cf6');
      gradient.addColorStop(0.5, '#7c3aed');
      gradient.addColorStop(1, '#6d28d9');

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + usedAngle);
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = gradient;
      ctx.lineCap = 'round';
      ctx.stroke();
    };

    drawDonutChart();
    window.addEventListener('resize', drawDonutChart);
    return () => window.removeEventListener('resize', drawDonutChart);
  }, []);

  return (
    <div id="main-content" className="main-content dashboard-view">
        <div id="main-header">
          <h1>Dashboard</h1>
          <div id="header-actions">
            <button className="new-button" onClick={openModal}><Plus size={16} />Novo</button>
            <button className="icon-button"><Bell size={20} /></button>
            <div id="user-avatar"></div>
          </div>
        </div>
        <div className="dashboard-grid">
          <div className="dashboard-section">
            <h2 className="section-title">Armazenamento</h2>
            <div className="chart-container">
              <div className="donut-chart">
                <canvas ref={canvasRef} id="storageChart" width="280" height="280"></canvas>
                <div className="chart-center">
                  <div className="chart-value">1.3 GB</div>
                  <div className="chart-label">de 1.5 GB</div>
                </div>
              </div>
            </div>
            <div className="file-list">
              <div className="file-item"><span className="file-type">.TXT</span><span className="file-size">300 MBs</span></div>
              <div className="file-item"><span className="file-type">.PY</span><span className="file-size">190 MBs</span></div>
              <div className="file-item"><span className="file-type">.PDF</span><span className="file-size">30 MBs</span></div>
            </div>
          </div>
          <div className="dashboard-section">
            <h2 className="section-title">Atividade recente</h2>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg></div>
                <div className="activity-info">
                  <div className="activity-title">Senha do github criada</div>
                  <div className="activity-time">Há 1 minuto atrás</div>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon"><svg viewBox="0 0 24 24"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" /></svg></div>
                <div className="activity-info">
                  <div className="activity-title">Senha do gmail alterada</div>
                  <div className="activity-time">Há 1 hora atrás</div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default Dashboard;
