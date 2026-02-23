import React from 'react';
import { useQuery } from 'react-query';
import { dashboardService } from '../../services/dashboard';
import { useLocations } from '../../hooks/useLocations';
import StatCard from './StatCard';
import LocationList from '../locations/LocationList';
import LoadingSpinner from '../common/LoadingSpinner';
import { formatters } from '../../utils/formatters';
import { Link } from 'react-router-dom';

const LocataireDashboard = () => {
  const { data: stats, isLoading: statsLoading } = useQuery(
    'locataireStats',
    () => dashboardService.getLocataireStats()
  );

  const { data: locationsData, isLoading: locationsLoading, refetch } = useLocations({
    ordering: '-date_reservation',
    page_size: 5,
  });

  if (statsLoading || locationsLoading) return <LoadingSpinner fullPage />;

  return (
    <div>
      <h2 style={{ marginBottom: '2rem' }}>Tableau de bord locataire</h2>

      <div className="dashboard-stats">
        <StatCard
          label="Total réservations"
          value={stats.locations.total}
          icon="📋"
        />
        
        <StatCard
          label="À venir"
          value={stats.locations.a_venir}
          icon="📅"
          color="#f59e0b"
        />
        
        <StatCard
          label="Passées"
          value={stats.locations.passees}
          icon="✓"
          color="#10b981"
        />
        
        <StatCard
          label="Dépenses totales"
          value={formatters.price(stats.depenses.total)}
          icon="💰"
        />
      </div>

      {stats.prochaine_location && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-body">
            <h3>Prochaine réservation</h3>
            <div style={{ marginTop: '1rem' }}>
              <h4>{stats.prochaine_location.appartement_titre}</h4>
              <p>{stats.prochaine_location.appartementVille}</p>
              <div style={{ display: 'flex', gap: '2rem', margin: '1rem 0' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>Arrivée</div>
                  <div style={{ fontWeight: '500' }}>
                    {formatters.date(stats.prochaine_location.dateDebut)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>Départ</div>
                  <div style={{ fontWeight: '500' }}>
                    {formatters.date(stats.prochaine_location.dateFin)}
                  </div>
                </div>
              </div>
              <Link
                to={`/appartements/${stats.prochaine_location.appartement_id}`}
                className="btn btn-outline btn-sm"
              >
                Voir l'appartement
              </Link>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3>Réservations récentes</h3>
        <Link to="/mes-reservations" className="btn btn-outline btn-sm">
          Voir tout
        </Link>
      </div>

      <LocationList
        locations={locationsData?.results}
        isLoading={locationsLoading}
        onUpdate={refetch}
      />
    </div>
  );
};

export default LocataireDashboard;