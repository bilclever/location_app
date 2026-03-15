import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppartement, useAppartementLocations } from '../hooks/useAppartements';
import { 
  useConfirmerLocation, 
  useAnnulerLocation, 
  useCreateDossierLocataire,
  useGenerateBail 
} from '../hooks/useLocations';
import { useAuthContext as useAuth } from '../context/AuthContext';
import { formatters } from '../utils/formatters';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PhotoManager from '../components/appartements/PhotoManager';
import ReservationRequests from '../components/locations/ReservationRequests';
import AppartementFinances from '../components/appartements/AppartementFinances';

const AppartementDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { data: appartement, isLoading, error } = useAppartement(slug);
  const { data: locationsData } = useAppartementLocations(slug, { statut: 'RESERVE' });
  const [selectedImage, setSelectedImage] = useState(null);
  
  const confirmerMutation = useConfirmerLocation();
  const annulerMutation = useAnnulerLocation();
  const createDossierMutation = useCreateDossierLocataire();
  const generateBailMutation = useGenerateBail();

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

  // Vérifier si l'utilisateur connecté est le propriétaire
  let isOwner = false;
  if (user && appartement) {
    // Dans le modèle unifié, proprietaire est directement l'UUID de l'utilisateur
    const proprietaireId = appartement.proprietaire;
    const userId = user.id;
    
    isOwner = String(userId) === String(proprietaireId);
  }

  // Extraire les locations en attente 
  const pendingLocations = locationsData?.results || [];
  const premiumBienId = typeof appartement?.bien === 'object' && appartement?.bien !== null
    ? appartement.bien.id
    : appartement?.bien;

  const handleConfirm = async (locationId) => {
    await confirmerMutation.mutateAsync(locationId);
  };

  const handleReject = async (locationId) => {
    await annulerMutation.mutateAsync(locationId);
  };

  const handleCreateDossier = async (locationId, formData) => {
    await createDossierMutation.mutateAsync({ id: locationId, formData });
  };

  const handleCreateBail = async (locationId, data) => {
    await generateBailMutation.mutateAsync({ id: locationId, data });
  };

  return (
    <div className="page detail appartement-detail-page">
      <section className="section appartement-detail-surface">
        <div className="container">
          <div className="detail-back-nav">
            <button
              onClick={() => navigate(-1)}
              className="detail-back-btn"
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
                <div className="appartement-headline">
                  <h2 className="headline-title">{appartement.titre}</h2>
                  <div className="headline-price">
                    {formatters.price(appartement.loyerMensuel)}
                    <small>/mois</small>
                  </div>

                  <p className="headline-address">{appartement.adresse}</p>
                  <p className="headline-city">{appartement.ville} {appartement.codePostal}</p>

                  <div className="headline-badges">
                    <span className={`badge ${appartement.disponible ? 'badge-success' : 'badge-secondary'}`}>
                      {appartement.disponible ? 'Disponible' : 'Indisponible'}
                    </span>
                    <span className="badge badge-primary">
                      {appartement.nbPieces} pieces
                    </span>
                    {appartement.surface && (
                      <span className="badge badge-info">
                        {formatters.surface(appartement.surface)}
                      </span>
                    )}
                  </div>
                </div>

                <h3>Description</h3>
                <p style={{ whiteSpace: 'pre-line' }}>{appartement.description}</p>
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

              {isOwner && (
                <div className="owner-photo-manager owner-photo-manager-desktop">
                  <PhotoManager appartement={appartement} />
                </div>
              )}

              {isOwner && user?.plan === 'premium' && (
                <div className="premium-finances premium-finances-desktop">
                  <AppartementFinances bienId={premiumBienId} />
                </div>
              )}

            </div>
          </div>

          {/* Section Propriétaire : Ajout des photos et réservations */}
          {isOwner && (
            <>
              <div className="owner-photo-manager owner-photo-manager-mobile">
                <PhotoManager appartement={appartement} />
              </div>
              
              {pendingLocations.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                  <ReservationRequests
                    locations={pendingLocations}
                    appartement={appartement}
                    onConfirm={handleConfirm}
                    onReject={handleReject}
                    onCreateDossier={handleCreateDossier}
                    onCreateBail={handleCreateBail}
                    isLoading={
                      confirmerMutation.isLoading || 
                      annulerMutation.isLoading || 
                      createDossierMutation.isLoading ||
                      generateBailMutation.isLoading
                    }
                  />
                </div>
              )}

              {/* Section Comptabilité Premium */}
              {user?.plan === 'premium' && (
                <div className="premium-finances premium-finances-mobile">
                  <AppartementFinances bienId={premiumBienId} />
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default AppartementDetailPage;