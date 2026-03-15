import React, { useState } from 'react';
import { formatters } from '../../utils/formatters';
import { STATUT_LABELS } from '../../utils/constants';
import DossierLocataireForm from './DossierLocataireForm';
import BailSummary from './BailSummary';

const ReservationRequests = ({ 
  locations, 
  appartement,
  onConfirm,
  onReject,
  onCreateDossier,
  onCreateBail,
  isLoading 
}) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showDossierForm, setShowDossierForm] = useState(false);
  const [showBailForm, setShowBailForm] = useState(false);

  const handleCreateDossier = (locationId) => {
    const location = locations.find(loc => loc.id === locationId);
    setSelectedLocation(location);
    setShowDossierForm(true);
  };

  const handleCreateBail = (locationId) => {
    const location = locations.find(loc => loc.id === locationId);
    setSelectedLocation(location);
    setShowBailForm(true);
  };

  const handleDossierSubmit = async (formData) => {
    try {
      await onCreateDossier(selectedLocation.id, formData);
      setShowDossierForm(false);
      setSelectedLocation(null);
    } catch (error) {
      console.error('Erreur création dossier:', error);
    }
  };

  const handleBailSubmit = async (bailData) => {
    try {
      await onCreateBail(selectedLocation.id, bailData);
      setShowBailForm(false);
      setSelectedLocation(null);
    } catch (error) {
      console.error('Erreur génération bail:', error);
    }
  };

  const handleCancel = () => {
    setShowDossierForm(false);
    setShowBailForm(false);
    setSelectedLocation(null);
  };

  if (showDossierForm && selectedLocation) {
    return (
      <DossierLocataireForm
        location={selectedLocation}
        onSubmit={handleDossierSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    );
  }

  if (showBailForm && selectedLocation) {
    return (
      <BailSummary
        location={selectedLocation}
        appartement={appartement}
        onConfirm={handleBailSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    );
  }

  if (!locations || locations.length === 0) {
    return (
      <div className="alert alert-info">
        Aucune demande de réservation en attente
      </div>
    );
  }

  return (
    <div className="reservation-requests">
      <h3>Demandes de réservation ({locations.length})</h3>
      
      {locations.map((location) => (
        <div key={location.id} className="reservation-card">
          <div className="reservation-header">
            <div>
              <h4>{location.nomLocataire}</h4>
              <p className="text-muted">
                {location.emailLocataire} • {location.telephoneLocataire}
              </p>
            </div>
            <span className={`badge badge-${location.statut === 'RESERVE' ? 'warning' : 'info'}`}>
              {STATUT_LABELS[location.statut] || location.statut}
            </span>
          </div>

          <div className="reservation-details">
            <div className="detail-row">
              <span className="label">Période souhaitée:</span>
              <span className="value">
                {formatters.date(location.dateDebut)} → {formatters.date(location.dateFin)}
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Montant:</span>
              <span className="value">{formatters.price(location.montantTotal)}</span>
            </div>
            <div className="detail-row">
              <span className="label">Date de demande:</span>
              <span className="value">{formatters.dateTime(location.dateReservation)}</span>
            </div>
          </div>

          <div className="reservation-actions">
            <button
              onClick={() => handleCreateDossier(location.id)}
              className="btn btn-primary btn-sm"
              disabled={isLoading}
            >
              Créer dossier locataire
            </button>
            
            <button
              onClick={() => handleCreateBail(location.id)}
              className="btn btn-success btn-sm"
              disabled={isLoading}
            >
              Générer bail numérique
            </button>

            <button
              onClick={() => onConfirm(location.id)}
              className="btn btn-outline btn-sm"
              disabled={isLoading}
            >
              Confirmer
            </button>

            <button
              onClick={() => onReject(location.id)}
              className="btn btn-outline-danger btn-sm"
              disabled={isLoading}
            >
              Rejeter
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReservationRequests;
