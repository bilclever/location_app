import React from 'react';
import { useQuery } from 'react-query';
import { dashboardService } from '../../services/dashboard';
import StatCard from './StatCard';
import LoadingSpinner from '../common/LoadingSpinner';
import { formatters } from '../../utils/formatters';
import { Link, useNavigate } from 'react-router-dom';
import { STATUT_LABELS } from '../../utils/constants';

const ProprietaireDashboard = ({ isEmbedded = false }) => {
  const navigate = useNavigate();
  const { data: stats, isLoading, error } = useQuery(
    'proprietaireStats',
    () => dashboardService.getProprietaireStats()
  );

  if (isLoading) return isEmbedded ? <p>Chargement...</p> : <LoadingSpinner fullPage />;

  if (error) {
    return (
      <div className="alert alert-error">
        Erreur lors du chargement des statistiques
      </div>
    );
  }

  const content = (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        {!isEmbedded && <h2>Tableau de bord propriétaire</h2>}
        <Link to="/appartements/ajouter" className="btn btn-primary">
          + Ajouter un appartement
        </Link>
      </div>

      <div className="dashboard-stats">
        <StatCard
          label="Appartements"
          value={stats.appartements.total}
        />
        
        <StatCard
          label="Disponibles"
          value={stats.appartements.disponibles}
          color="#10b981"
        />
        
        <StatCard
          label="Occupés"
          value={stats.appartements.occupes}
          color="#ef4444"
        />
        
        <StatCard
          label="Locations en cours"
          value={stats.locations.en_cours}
          color="#f59e0b"
        />
      </div>

      <div className="dashboard-stats">
        <StatCard
          label="Total locations"
          value={stats.locations.total}
        />
        
        <StatCard
          label="Revenus totaux"
          value={formatters.price(stats.revenus.total)}
        />
        
        <StatCard
          label="Revenus du mois"
          value={formatters.price(stats.revenus.mois_en_cours)}
          color="#10b981"
        />
        
        <StatCard
          label="Commission"
          value={formatters.price(stats.revenus.commission)}
          color="#8b5cf6"
        />
      </div>

      {stats.locations.par_statut && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Répartition des statuts</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {stats.locations.par_statut.map(item => (
              <div key={item.statut} className="card" style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>
                  {STATUT_LABELS[item.statut]}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {item.count}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.top_appartements && stats.top_appartements.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Appartements les plus réservés</h3>
          <div className="dashboard-annonces-grid">
            {stats.top_appartements.map(app => (
              <div
                key={app.id}
                className="card dashboard-annonce-card"
                role="button"
                tabIndex={0}
                onClick={() => navigate(app.slug ? `/appartements/${app.slug}` : '/appartements')}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    navigate(app.slug ? `/appartements/${app.slug}` : '/appartements');
                  }
                }}
              >
                <div className="card-body dashboard-annonce-card-body">
                  <h4>{app.titre}</h4>
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Réservations:</span>
                      <span style={{ fontWeight: 'bold' }}>{app.nb_locations}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                      <span>Revenus:</span>
                      <span style={{ fontWeight: 'bold', color: '#2563eb' }}>
                        {formatters.price(app.revenus)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <div className="container">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {content}
      </div>
    </div>
  );
};

export default ProprietaireDashboard;