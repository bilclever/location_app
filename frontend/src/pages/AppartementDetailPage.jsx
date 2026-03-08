import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppartement } from '../hooks/useAppartements';
import { useAuthContext as useAuth } from '../context/AuthContext';
import { formatters } from '../utils/formatters';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PhotoManager from '../components/appartements/PhotoManager';

const AppartementDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { data: appartement, isLoading, error } = useAppartement(slug);
  const [selectedImage, setSelectedImage] = useState(null);

  if (isLoading) return <LoadingSpinner fullPage />;

  if (error || !appartement) {
    return (
      <div className="page detail">
        <section className="section section-surface">
          <div className="container">
            <div className="alert alert-error">
              {error?.message || 'Appartement non trouvé'}
              {error?.response?.status === 404 && (
                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                  Slug: {slug}
                </p>
              )}
            </div>
            <Link to="/appartements" className="btn btn-primary">
              Retour aux appartements
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const handleReserver = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate(`/reservations/${slug}`);
  };

  const buildWhatsAppLink = () => {
    const rawPhone = appartement?.proprietaireTelephone || '';
    const digitsOnly = String(rawPhone).replace(/\D/g, '');

    if (!digitsOnly) {
      return null;
    }

    const normalizedPhone = digitsOnly.startsWith('228')
      ? digitsOnly
      : `228${digitsOnly}`;

    const message = `Bonjour, je suis intéressé par l'annonce : ${appartement.titre}`;
    return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
  };

  const whatsappLink = buildWhatsAppLink();
  const cautionMois = Number(appartement?.cautionMois || 0);
  const cautionAmount = cautionMois > 0
    ? Number(appartement.loyerMensuel || 0) * cautionMois
    : Number(appartement.caution || 0);

  // Vérifier si l'utilisateur connecté est le propriétaire
  let isOwner = false;
  if (user && appartement) {
    // Dans le modèle unifié, proprietaire est directement l'UUID de l'utilisateur
    const proprietaireId = appartement.proprietaire;
    const userId = user.id;
    
    // Debug: afficher les valeurs pour comprendre le format
    console.log('User ID:', userId, 'Type:', typeof userId);
    console.log('Proprietaire ID:', proprietaireId, 'Type:', typeof proprietaireId);
    console.log('Comparaison stricte:', userId === proprietaireId);
    console.log('Comparaison String:', String(userId) === String(proprietaireId));
    
    isOwner = String(userId) === String(proprietaireId);
    console.log('isOwner:', isOwner);
  }

  return (
    <div className="page detail">
      <section className="section section-surface">
        <div className="container">
          <div style={{ marginBottom: '1rem' }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                fontSize: '1.5rem',
                color: '#666',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                marginTop: '-0.5rem',
              }}
              title="Retour"
            >
              ← <span>Retour</span>
            </button>
          </div>

          <div className="appartement-details">
            <div>
              <div className="gallery">
                <img
                  src={selectedImage || appartement.photoPrincipaleUrl || '/images/default-appartement.jpg'}
                  alt={appartement.titre}
                  className="main-image"
                />

                {appartement.photos && appartement.photos.length > 0 && (
                  <div className="thumbnails">
                    {appartement.photos.map((photo, index) => {
                      // Gérer le format de photo (string ou objet)
                      const photoUrl = typeof photo === 'string' ? photo : photo?.image || photo?.url;
                      const photoId = photo?.id || `photo-${index}`;
                      
                      if (!photoUrl) return null;
                      
                      return (
                        <img
                          key={photoId}
                          src={photoUrl}
                          alt={photo.legende || `Photo ${index + 1}`}
                          className={selectedImage === photoUrl ? 'active' : ''}
                          onClick={() => setSelectedImage(photoUrl)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="info">
                <h3>Description</h3>
                <p style={{ whiteSpace: 'pre-line' }}>{appartement.description}</p>

                <h3 style={{ marginTop: '2rem' }}>Caracteristiques</h3>
                <div>
                  <div className="detail-item">
                    <span className="label">Adresse</span>
                    <span className="value">{appartement.adresse}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Ville</span>
                    <span className="value">{appartement.ville} {appartement.codePostal}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Surface</span>
                    <span className="value">{formatters.surface(appartement.surface)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Nombre de pieces</span>
                    <span className="value">{appartement.nbPieces}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Loyer mensuel</span>
                    <span className="value">{formatters.price(appartement.loyerMensuel)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Caution</span>
                    <span className="value">{cautionMois} mois ({formatters.price(cautionAmount)})</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Disponibilite</span>
                    <span className="value">
                      <span className={`badge ${appartement.disponible ? 'badge-success' : 'badge-secondary'}`}>
                        {appartement.disponible ? 'Disponible' : 'Indisponible'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="booking-card">
                <h3>Reserver</h3>

                <div className="price-display">
                  {formatters.price(appartement.loyerMensuel)}
                  <small>/mois</small>
                </div>

                {appartement.disponible ? (
                  <button
                    onClick={handleReserver}
                    className="btn btn-primary btn-block btn-lg"
                  >
                    Reserver maintenant
                  </button>
                ) : (
                  <div className="alert alert-warning">
                    Cet appartement n'est pas disponible pour le moment.
                  </div>
                )}

                {whatsappLink && (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-block"
                    style={{ marginTop: '0.75rem' }}
                  >
                    Discuter sur WhatsApp
                  </a>
                )}
              </div>

              {/* Section propriétaire temporairement désactivée - à adapter au modèle unifié */}
              {/*
              {appartement.proprietaire && (
                <div className="booking-card" style={{ marginTop: '1rem' }}>
                  <h3>Proprietaire</h3>
                  <p>
                    <strong>{appartement.proprietaire.user.full_name}</strong>
                  </p>
                  {appartement.proprietaire.note_moyenne > 0 && (
                    <p>Note: {appartement.proprietaire.note_moyenne}/5</p>
                  )}
                </div>
              )}
              */}
            </div>
          </div>

          {isOwner && (
            <div style={{ marginTop: '2rem' }}>
              <PhotoManager appartement={appartement} />
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AppartementDetailPage;