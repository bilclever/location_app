import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToggleFavori } from '../../hooks/useFavoris';
import { formatters } from '../../utils/formatters';

const AppartementCard = ({ appartement }) => {
  const { user, isAuthenticated } = useAuth();
  const { mutate: toggleFavori } = useToggleFavori();
  
  const isFavori = user?.profil_locataire?.favoris?.includes(appartement.id);

  const handleToggleFavori = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    toggleFavori({
      appartementId: appartement.id,
      action: isFavori ? 'remove' : 'add',
    });
  };

  return (
    <div className="card appartement-card">
      <Link to={`/appartements/${appartement.id}`}>
        <div className="image">
          <img 
            src={appartement.photoPrincipaleUrl || '/images/default-appartement.jpg'} 
            alt={appartement.titre}
          />
          <span className={`badge ${appartement.disponible ? 'badge-success' : 'badge-secondary'}`}>
            {appartement.disponible ? 'Disponible' : 'Indisponible'}
          </span>
        </div>

        <div className="content">
          <h3 className="title">{appartement.titre}</h3>
          <p className="location">{appartement.ville}</p>
          
          <div className="price">
            {formatters.price(appartement.loyerMensuel)}
            <small>/mois</small>
          </div>

          <div className="features">
            {appartement.surface && (
              <span>{formatters.surface(appartement.surface)}</span>
            )}
            <span>{appartement.nbPieces} pièce{appartement.nbPieces > 1 ? 's' : ''}</span>
          </div>
        </div>
      </Link>

      {user?.role === 'LOCATAIRE' && (
        <div className="card-footer">
          <button
            onClick={handleToggleFavori}
            className="btn btn-outline btn-sm"
            style={{ width: '100%' }}
          >
            {isFavori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          </button>
        </div>
      )}
    </div>
  );
};

export default AppartementCard;