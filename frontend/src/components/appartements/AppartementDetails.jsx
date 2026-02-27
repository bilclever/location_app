import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { formatters } from '../../utils/formatters';
import { STATUT_LABELS } from '../../utils/constants';

const AppartementDetails = ({ appartement, onRefresh }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [selectedImage, setSelectedImage] = useState(null);

  const handleReserver = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate(`/reservations/${appartement.slug}`);
  };

  const allPhotos = [
    ...(appartement.photoPrincipaleUrl ? [appartement.photoPrincipaleUrl] : []),
    ...(appartement.photos?.map(p => p.image) || [])
  ];

  return (
    <div className="appartement-details">
      <div className="appartement-gallery">
        <div className="main-image">
          <img 
            src={selectedImage || appartement.photoPrincipaleUrl || '/images/default-appartement.jpg'} 
            alt={appartement.titre}
          />
        </div>
        
        {allPhotos.length > 1 && (
          <div className="thumbnails">
            {allPhotos.map((photo, index) => (
              <img
                key={index}
                src={photo}
                alt={`${appartement.titre} - ${index + 1}`}
                className={selectedImage === photo ? 'active' : ''}
                onClick={() => setSelectedImage(photo)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="appartement-info-section">
        <div className="info-header">
          <h1 className="info-title">{appartement.titre}</h1>
          <span className={`badge ${appartement.disponible ? 'badge-success' : 'badge-secondary'}`}>
            {appartement.disponible ? 'Disponible' : 'Indisponible'}
          </span>
        </div>

        <p className="info-location">{appartement.adresse}</p>
        <p className="info-city">{appartement.code_postal} {appartement.ville}</p>

        <div className="info-price">
          {formatters.price(appartement.loyerMensuel)}
          <span>/mois</span>
        </div>

        <div className="info-stats">
          <div className="stat">
            <span className="stat-label">Vues</span>
            <span className="stat-value">{appartement.nbVues || 0}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Favoris</span>
            <span className="stat-value">{appartement.nb_favoris || 0}</span>
          </div>
        </div>

        <div className="info-section">
          <h3>Description</h3>
          <p className="info-description">{appartement.description}</p>
        </div>

        <div className="info-section">
          <h3>Caractéristiques</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="item-label">Surface</span>
              <span className="item-value">{formatters.surface(appartement.surface)}</span>
            </div>
            <div className="info-item">
              <span className="item-label">Pièces</span>
              <span className="item-value">{appartement.nbPieces}</span>
            </div>
            <div className="info-item">
              <span className="item-label">Caution</span>
              <span className="item-value">{formatters.price(appartement.caution)}</span>
            </div>
          </div>
        </div>

        {appartement.proprietaire && (
          <div className="info-section">
            <h3>Propriétaire</h3>
            <div className="proprietaire-info">
              <p><strong>{appartement.proprietaire.user.full_name}</strong></p>
              {appartement.proprietaire.note_moyenne > 0 && (
                <p>Note: {appartement.proprietaire.note_moyenne}/5</p>
              )}
            </div>
          </div>
        )}

        {appartement.locations && appartement.locations.length > 0 && (
          <div className="info-section">
            <h3>Prochaines réservations</h3>
            <div className="reservations-list">
              {appartement.locations.map(location => (
                <div key={location.id} className="reservation-item">
                  <div className="reservation-dates">
                    du {formatters.date(location.date_debut)} au {formatters.date(location.date_fin)}
                  </div>
                  <span className={`badge badge-${location.statut.toLowerCase()}`}>
                    {STATUT_LABELS[location.statut]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="info-actions">
          {appartement.disponible ? (
            <button onClick={handleReserver} className="btn btn-primary btn-lg">
              Réserver maintenant
            </button>
          ) : (
            <button className="btn btn-secondary btn-lg" disabled>
              Non disponible
            </button>
          )}
          
          <Link to="/appartements" className="btn btn-outline">
            Retour à la liste
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AppartementDetails;