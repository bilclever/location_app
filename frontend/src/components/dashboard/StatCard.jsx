import React from 'react';

const StatCard = ({ label, value, change, icon, color = '#2563eb' }) => {
  const changeClass = change > 0 ? 'positive' : change < 0 ? 'negative' : '';

  return (
    <div className="dashboard-stat-card">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
        {icon && (
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: `${color}20`,
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '0.75rem',
            fontSize: '1.25rem',
          }}>
            {icon}
          </div>
        )}
        <div className="stat-label">{label}</div>
      </div>
      
      <div className="stat-value">{value}</div>
      
      {change !== undefined && (
        <div className={`stat-change ${changeClass}`}>
          {change > 0 ? '↑' : change < 0 ? '↓' : ''} {Math.abs(change)}% par rapport au mois dernier
        </div>
      )}
    </div>
  );
};

export default StatCard;