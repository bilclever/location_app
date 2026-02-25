import React from 'react';
import AppartementCard from './AppartementCard';
import LoadingSpinner from '../common/LoadingSpinner';

const AppartementList = ({ appartements, isLoading, error }) => {
  if (isLoading) return <LoadingSpinner fullPage />;

  if (error) {
    return (
      <div className="alert alert-error">
        Une erreur est survenue lors du chargement des appartements.
        <button 
          onClick={() => window.location.reload()} 
          className="btn btn-outline btn-sm"
          style={{ marginLeft: '1rem' }}
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!appartements || appartements.length === 0) {
    return (
      <div className="empty-state">
        <p>Aucun appartement trouvé.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-4 gap-4">
      {appartements.map(appartement => (
        <AppartementCard key={appartement.id} appartement={appartement} />
      ))}
    </div>
  );
};

export default AppartementList;