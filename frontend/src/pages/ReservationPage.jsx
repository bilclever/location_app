import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppartement } from '../hooks/useAppartements';
import ReservationForm from '../components/locations/ReservationForm';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatters } from '../utils/formatters';

const ReservationPage = () => {
  const { id } = useParams();
  const { data: appartement, isLoading, error } = useAppartement(id);

  if (isLoading) return <LoadingSpinner fullPage />;

  if (error || !appartement) {
    return (
      <div className="container">
        <div className="alert alert-error">
          Appartement non trouvé
        </div>
        <Link to="/appartements" className="btn btn-primary">
          Retour aux appartements
        </Link>
      </div>
    );
  }

  if (!appartement.disponible) {
    return (
      <div className="container">
        <div className="alert alert-warning">
          Cet appartement n'est pas disponible pour le moment.
        </div>
        <Link to={`/appartements/${id}`} className="btn btn-primary">
          Retour à l'appartement
        </Link>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1rem' }}>
          <Link to={`/appartements/${id}`} className="btn btn-outline btn-sm">
            ← Retour
          </Link>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Réserver {appartement.titre}</h2>
          </div>
          <div className="card-body">
            <div style={{
              background: '#f3f4f6',
              padding: '1rem',
              borderRadius: '0.5rem',
              marginBottom: '2rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ marginBottom: '0.25rem' }}>{appartement.titre}</h4>
                  <p style={{ color: '#666' }}>{appartement.ville}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb' }}>
                    {formatters.price(appartement.loyerMensuel)}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>/mois</div>
                </div>
              </div>
            </div>

            <ReservationForm appartementId={id} appartement={appartement} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationPage;