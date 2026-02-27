import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useUpdateLocation, useAnnulerLocation, useConfirmerLocation } from '../../hooks/useLocations';
import { formatters } from '../../utils/formatters';
import { STATUT_COLORS, STATUT_LABELS } from '../../utils/constants';
import toast from 'react-hot-toast';

const LocationCard = ({ location, onUpdate }) => {
  const { user } = useAuth();
  const updateMutation = useUpdateLocation();
  const annulerMutation = useAnnulerLocation();
  const confirmerMutation = useConfirmerLocation();

  const handleStatutChange = async (e) => {
    const nouveauStatut = e.target.value;
    
    try {
      await updateMutation.mutateAsync({
        id: location.id,
        data: { statut: nouveauStatut },
      });
      toast.success('Statut mis à jour');
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Erreur de mise à jour');
    }
  };

  const handleAnnuler = async () => {
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

  const handleConfirmer = async () => {
    try {
      await confirmerMutation.mutateAsync(location.id);
      toast.success('Réservation confirmée');
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Erreur de confirmation');
    }
  };

  const isProprietaire = user?.role === 'PROPRIETAIRE';
  const isLocataire = user?.role === 'LOCATAIRE';
  const peutAnnuler = location.statut === 'RESERVE' || location.statut === 'CONFIRME';
  const peutConfirmer = isProprietaire && location.statut === 'PENDING';

  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <div className="card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <h4 style={{ marginBottom: '0.5rem' }}>
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

        {(isProprietaire || isLocataire) && (
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            {isProprietaire && (
              <>
                <select
                  value={location.statut}
                  onChange={handleStatutChange}
                  className="form-control"
                  style={{ width: 'auto', minWidth: '150px' }}
                >
                  <option value="RESERVE">Réservé</option>
                  <option value="CONFIRME">Confirmé</option>
                  <option value="PAYE">Payé</option>
                  <option value="TERMINE">Terminé</option>
                  <option value="ANNULE">Annulé</option>
                </select>

                {peutConfirmer && (
                  <button
                    onClick={handleConfirmer}
                    className="btn btn-success btn-sm"
                  >
                    Confirmer
                  </button>
                )}
              </>
            )}

            {peutAnnuler && (
              <button
                onClick={handleAnnuler}
                className="btn btn-danger btn-sm"
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