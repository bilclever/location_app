import React from 'react';
import LocationCard from './LocationCard';
import LoadingSpinner from '../common/LoadingSpinner';

const LocationList = ({ locations, isLoading, error, onUpdate }) => {
  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="alert alert-error">
        Une erreur est survenue lors du chargement des réservations.
      </div>
    );
  }

  if (!locations || locations.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <p>Aucune réservation trouvée.</p>
      </div>
    );
  }

  return (
    <div>
      {locations.map(location => (
        <LocationCard
          key={location.id}
          location={location}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
};

export default LocationList;