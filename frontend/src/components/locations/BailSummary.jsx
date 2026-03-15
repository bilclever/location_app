import React from 'react';
import { formatters } from '../../utils/formatters';

const BailSummary = ({ location, appartement, onConfirm, onCancel, isLoading }) => {
  // Calculer la durée en mois basée sur les dates de réservation
  const dateDebut = new Date(location?.dateDebut);
  const dateFin = new Date(location?.dateFin);
  const dureeMs = dateFin - dateDebut;
  const dureeMois = Math.ceil(dureeMs / (1000 * 60 * 60 * 24 * 30.44));

  // Extraire les données du bail
  const bailData = {
    date_entree: location?.dateDebut,
    date_fin: location?.dateFin,
    duree_mois: dureeMois,
    loyer_mensuel: Number(appartement?.loyerMensuel),
    charges: 0,
    depot_garantie: Number(appartement?.loyerMensuel), // 1 mois de loyer par défaut
    location_id: location?.id,
    appartement_id: appartement?.id,
    locataire_nom: location?.nomLocataire,
  };

  const loyerTotal = bailData.loyer_mensuel + bailData.charges;

  const handleConfirm = async () => {
    await onConfirm(bailData);
  };

  return (
    <div className="bail-summary">
      <h3>Résumé du bail numérique</h3>
      
      <div className="form-section">
        <h4>Bien concerné</h4>
        <div className="bail-info-box">
          <p><strong>{appartement?.titre}</strong></p>
          <p>{appartement?.adresse}</p>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            {appartement?.ville} {appartement?.codePostal}
          </p>
        </div>
      </div>

      <div className="form-section">
        <h4>Locataire</h4>
        <div className="bail-info-box">
          <p><strong>{location?.nomLocataire}</strong></p>
          <p>{location?.emailLocataire}</p>
          {location?.telephoneLocataire && <p>{location?.telephoneLocataire}</p>}
        </div>
      </div>

      <div className="form-section">
        <h4>Conditions du bail</h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label className="form-label">Date d'entrée</label>
            <p className="form-value">{formatters.date(bailData.date_entree)}</p>
          </div>
          
          <div>
            <label className="form-label">Date de fin</label>
            <p className="form-value">{formatters.date(bailData.date_fin)}</p>
          </div>
          
          <div>
            <label className="form-label">Durée</label>
            <p className="form-value">{bailData.duree_mois} mois</p>
          </div>
          
          <div>
            <label className="form-label">Loyer mensuel</label>
            <p className="form-value">{formatters.price(bailData.loyer_mensuel)}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e0e0e0' }}>
          <div>
            <label className="form-label">Total charges comprises</label>
            <p className="form-value" style={{ fontSize: '1.125rem', fontWeight: '600', color: '#f2a65a' }}>
              {formatters.price(loyerTotal)}
            </p>
          </div>
          
          <div>
            <label className="form-label">Dépôt de garantie</label>
            <p className="form-value">{formatters.price(bailData.depot_garantie)}</p>
          </div>
        </div>
      </div>

      <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
        <strong>📄 Génération automatique du PDF</strong>
        <p style={{ marginBottom: 0, marginTop: '0.5rem' }}>
          Le bail numérique sera généré au format PDF et envoyé au locataire pour signature électronique. 
          Un lien d'accès sécurisé sera partagé par email.
        </p>
      </div>

      <div className="form-actions">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-outline"
          disabled={isLoading}
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading ? '⏳ Génération en cours...' : '✓ Générer le bail'}
        </button>
      </div>
    </div>
  );
};

export default BailSummary;
