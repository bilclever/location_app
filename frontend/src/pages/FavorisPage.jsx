import React from 'react';
import { useFavoris } from '../hooks/useFavoris';
import AppartementCard from '../components/appartements/AppartementCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

const FavorisPage = () => {
  const { data: favoris, isLoading, error } = useFavoris();

  if (isLoading) return <LoadingSpinner fullPage />;

  if (error) {
    return (
      <div className="container">
        <div className="alert alert-error">
          Erreur lors du chargement des favoris
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      

      {favoris && favoris.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Vous n'avez pas encore d'appartements en favoris.</p>
          <a href="/appartements" className="btn btn-primary">
            Découvrir des appartements
          </a>
        </div>
      ) : (
        <div className="grid grid-3">
          {favoris.map(appartement => (
            <AppartementCard key={appartement.id} appartement={appartement} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FavorisPage;