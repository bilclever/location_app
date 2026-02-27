import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToggleFavori } from '../../hooks/useFavoris';
import { formatters } from '../../utils/formatters';

const AppartementCard = ({ appartement }) => {
  const { user, isAuthenticated } = useAuth();
  const { mutate: toggleFavori } = useToggleFavori();
  
  // Initialiser l'état avec la valeur correcte dès le départ
  const [isFavori, setIsFavori] = useState(() => {
    return user?.profil_locataire?.favoris?.includes(appartement.id) ?? false;
  });
  
  // Mettre à jour l'état local quand l'utilisateur change
  useEffect(() => {
    if (user?.profil_locataire?.favoris) {
      setIsFavori(user.profil_locataire.favoris.includes(appartement.id));
    } else {
      setIsFavori(false);
    }
  }, [user?.profil_locataire?.favoris, appartement.id]);

  const handleToggleFavori = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    
    // Optimistic update
    setIsFavori(!isFavori);
    
    toggleFavori({
      appartementId: appartement.id,
      action: isFavori ? 'remove' : 'add',
    });
  };

  return (
    <div className="card appartement-card-compact">
      <Link to={`/appartements/${appartement.slug}`} className="card-link">
        <div className="image-wrapper">
          <img 
            src={appartement.photoPrincipaleUrl || '/images/default-appartement.jpg'} 
            alt={appartement.titre}
          />
          {appartement.disponible && (
            <span className="badge-disponible">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M12 3L4 9v12h16V9l-8-6zm6 16h-5v-6h-2v6H6v-9l6-4.5 6 4.5v9z"/>
              </svg>
            </span>
          )}
        </div>

        <div className="card-content-compact">
          <div className="price-compact">
            {formatters.price(appartement.loyerMensuel)}
          </div>
          
          <h3 className="title-compact">{appartement.titre}</h3>
          
          <p className="location-compact">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '4px' }}>
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            </svg>
            {appartement.ville}
          </p>
        </div>
      </Link>

      {user?.role === 'LOCATAIRE' && (
        <button
          onClick={handleToggleFavori}
          className="btn-favori-compact"
          aria-label={isFavori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill={isFavori ? '#ff9800' : 'none'} stroke={isFavori ? '#ff9800' : 'currentColor'} strokeWidth="2">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
      )}
    </div>
  );
};

export default AppartementCard;