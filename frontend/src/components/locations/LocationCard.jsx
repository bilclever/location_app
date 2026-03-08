import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnnulerLocation, useConfirmerLocation } from '../../hooks/useLocations';
import { useAuthContext as useAuth } from '../../context/AuthContext';
import { formatters } from '../../utils/formatters';
import { STATUT_COLORS, STATUT_LABELS } from '../../utils/constants';
import toast from 'react-hot-toast';

const LocationCard = ({ location, onUpdate, isOwnProperty = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const annulerMutation = useAnnulerLocation();
  const confirmerMutation = useConfirmerLocation();

  const handleCardClick = () => {
    if (location.appartementSlug) {
      navigate(`/appartements/${location.appartementSlug}`);
    }
  };

  const handleAnnuler = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      return;
    }

    try {
      await annulerMutation.mutateAsync(location.id);
      toast.success('Réservation annulée');
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error("Erreur lors de l'annulation");
    }
  };

  const handleConfirmer = async (e) => {
    e.stopPropagation();
    
    try {
      await confirmerMutation.mutateAsync(location.id);
      toast.success('Réservation confirmée');
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Erreur de confirmation');
    }
  };

  // Le propriétaire (ou admin via backend) peut confirmer une réservation en attente
  const isPropertyOwner = isOwnProperty || (
    user?.id && location?.appartementProprietaireId && String(user.id) === String(location.appartementProprietaireId)
  );
  const peutAnnuler = location.statut === 'RESERVE' || location.statut === 'CONFIRME';
  const peutConfirmer = isPropertyOwner && location.statut === 'RESERVE';

  return (
    <div 
      className="card" 
      style={{ marginBottom: '1rem', cursor: 'pointer' }}
      onClick={handleCardClick}
    >
      <div className="card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <h4 style={{ marginBottom: '0.5rem', color: '#1f2937' }}>
              {location.appartementTitre}
            </h4>
            <p style={{ color: '#666', marginBottom: '0.5rem' }}>
              {location.appartementVille}
            </p>
          </div>
          
          <span className={`badge badge-${STATUT_COLORS[location.statut]}`}>
            {STATUT_LABELS[location.statut]}
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          margin: '1rem 0',
        }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>Locataire</div>
            <div style={{ fontWeight: '500' }}>{location.nomLocataire}</div>
            <div style={{ fontSize: '0.875rem' }}>{location.emailLocataire}</div>
            <div style={{ fontSize: '0.875rem' }}>{location.telephoneLocataire}</div>
          </div>

          <div>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>Dates</div>
            <div style={{ fontWeight: '500' }}>
              du {formatters.date(location.dateDebut)}
            </div>
            <div style={{ fontWeight: '500' }}>
              au {formatters.date(location.dateFin)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>Montant</div>
            <div style={{ fontWeight: '500', color: '#2563eb' }}>
              {formatters.price(location.montantTotal)}
            </div>
            <div style={{ fontSize: '0.875rem' }}>
              Réservé le {formatters.date(location.dateReservation)}
            </div>
          </div>
        </div>

        {location.notes && (
          <div style={{
            background: '#f3f4f6',
            padding: '0.75rem',
            borderRadius: '0.375rem',
            marginTop: '0.5rem',
            fontSize: '0.875rem',
          }}>
            <strong>Notes :</strong> {location.notes}
          </div>
        )}

        {(isPropertyOwner) && (
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            {peutConfirmer && (
              <button
                onClick={handleConfirmer}
                className="btn btn-success btn-sm"
                disabled={confirmerMutation.isLoading}
              >
                {confirmerMutation.isLoading ? 'Confirmation...' : 'Confirmer la réservation'}
              </button>
            )}

            {peutAnnuler && (
              <button
                onClick={handleAnnuler}
                className="btn btn-danger btn-sm"
                disabled={annulerMutation.isLoading}
              >
                Annuler
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationCard;