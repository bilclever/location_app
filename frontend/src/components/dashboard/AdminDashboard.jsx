import React from 'react';
import { useQuery } from 'react-query';
import { dashboardService } from '../../services/dashboard';
import StatCard from './StatCard';
import RecentLocations from './RecentLocations';
import LoadingSpinner from '../common/LoadingSpinner';
import { formatters } from '../../utils/formatters';

const AdminDashboard = () => {
  const { data: stats, isLoading, error } = useQuery(
    'adminStats',
    () => dashboardService.getAdminStats()
  );

  if (isLoading) return <LoadingSpinner fullPage />;

  if (error) {
    return (
      <div className="alert alert-error">
        Erreur lors du chargement des statistiques
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: '2rem' }}>Administration</h2>

      <div className="dashboard-stats">
        <StatCard
          label="Appartements"
          value={stats.appartements.total}
          icon="🏢"
        />
        
        <StatCard
          label="Disponibles"
          value={stats.appartements.disponibles}
          icon="✓"
          color="#10b981"
        />
        
        <StatCard
          label="Occupés"
          value={stats.appartements.occupes}
          icon="✗"
          color="#ef4444"
        />
        
        <StatCard
          label="Locations"
          value={stats.locations.total}
          icon="📋"
        />
      </div>

      <div className="dashboard-stats">
        <StatCard
          label="Utilisateurs"
          value={stats.utilisateurs.total}
          icon="👥"
        />
        
        <StatCard
          label="Locataires"
          value={stats.utilisateurs.locataires}
          icon="👤"
          color="#f59e0b"
        />
        
        <StatCard
          label="Propriétaires"
          value={stats.utilisateurs.proprietaires}
          icon="👤"
          color="#8b5cf6"
        />
        
        <StatCard
          label="Locations actives"
          value={stats.locations.actives}
          icon="📅"
          color="#10b981"
        />
      </div>

      <div className="dashboard-stats">
        <StatCard
          label="Revenus totaux"
          value={formatters.price(stats.revenus.total)}
          icon="💰"
        />
        
        <StatCard
          label="Revenus du mois"
          value={formatters.price(stats.revenus.mois_en_cours)}
          icon="💶"
          color="#10b981"
        />
        
        <StatCard
          label="Locations à venir"
          value={stats.locations.a_venir}
          icon="📆"
          color="#f59e0b"
        />
        
        <StatCard
          label="Terminées"
          value={stats.locations.terminees}
          icon="✓"
          color="#6b7280"
        />
      </div>

      {stats.appartements.top_villes && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Top villes</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
            {stats.appartements.top_villes.map(ville => (
              <div key={ville.ville} className="card" style={{ padding: '1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{ville.ville}</div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>{ville.count} appartements</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;