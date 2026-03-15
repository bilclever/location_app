import React, { useState } from 'react';
import { validators } from '../../utils/validators';

const BailForm = ({ location, appartement, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    date_entree: '',
    duree_mois: '12',
    loyer_mensuel: appartement?.loyerMensuel || location?.montantTotal || '',
    charges: '',
    depot_garantie: appartement?.loyerMensuel || '',
    conditions_particulieres: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const calculateDateFin = () => {
    if (!formData.date_entree || !formData.duree_mois) return '';
    
    const dateEntree = new Date(formData.date_entree);
    dateEntree.setMonth(dateEntree.getMonth() + parseInt(formData.duree_mois));
    return dateEntree.toISOString().split('T')[0];
  };

  const validate = () => {
    const newErrors = {};

    if (!validators.required(formData.date_entree)) {
      newErrors.date_entree = 'Date d\'entrée requise';
    }

    if (!validators.required(formData.loyer_mensuel) || Number(formData.loyer_mensuel) <= 0) {
      newErrors.loyer_mensuel = 'Loyer invalide';
    }

    if (!validators.required(formData.depot_garantie) || Number(formData.depot_garantie) < 0) {
      newErrors.depot_garantie = 'Dépôt de garantie invalide';
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const dateFin = calculateDateFin();
    
    const submitData = {
      ...formData,
      date_fin: dateFin,
      location_id: location?.id,
      appartement_id: appartement?.id,
      loyer_mensuel: Number(formData.loyer_mensuel),
      charges: Number(formData.charges || 0),
      depot_garantie: Number(formData.depot_garantie),
    };

    onSubmit(submitData);
  };

  const dateFin = calculateDateFin();
  const loyerTotal = (Number(formData.loyer_mensuel) || 0) + (Number(formData.charges) || 0);

  return (
    <form onSubmit={handleSubmit} className="bail-form">
      <h3>Génération du bail numérique</h3>
      
      <div className="form-section">
        <h4>Bien concerné</h4>
        <div className="bail-info-box">
          <p><strong>{appartement?.titre}</strong></p>
          <p>{appartement?.adresse}</p>
        </div>
      </div>

      <div className="form-section">
        <h4>Locataire</h4>
        <div className="bail-info-box">
          <p><strong>{location?.nomLocataire}</strong></p>
          <p>{location?.emailLocataire}</p>
          <p>{location?.telephoneLocataire}</p>
        </div>
      </div>

      <div className="form-section">
        <h4>Conditions du bail</h4>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="date_entree" className="form-label">Date d'entrée *</label>
            <input
              type="date"
              id="date_entree"
              name="date_entree"
              className={`form-control ${errors.date_entree ? 'error' : ''}`}
              value={formData.date_entree}
              onChange={handleChange}
              required
            />
            {errors.date_entree && <div className="form-error">{errors.date_entree}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="duree_mois" className="form-label">Durée (mois) *</label>
            <select
              id="duree_mois"
              name="duree_mois"
              className="form-control"
              value={formData.duree_mois}
              onChange={handleChange}
              required
            >
              <option value="3">3 mois</option>
              <option value="6">6 mois</option>
              <option value="12">12 mois</option>
              <option value="24">24 mois</option>
              <option value="36">36 mois</option>
            </select>
          </div>
        </div>

        {dateFin && (
          <div className="form-hint">
            Date de fin calculée: <strong>{new Date(dateFin).toLocaleDateString('fr-FR')}</strong>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="loyer_mensuel" className="form-label">Loyer mensuel (€) *</label>
            <input
              type="number"
              id="loyer_mensuel"
              name="loyer_mensuel"
              step="0.01"
              min="0"
              className={`form-control ${errors.loyer_mensuel ? 'error' : ''}`}
              value={formData.loyer_mensuel}
              onChange={handleChange}
              required
            />
            {errors.loyer_mensuel && <div className="form-error">{errors.loyer_mensuel}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="charges" className="form-label">Charges (€)</label>
            <input
              type="number"
              id="charges"
              name="charges"
              step="0.01"
              min="0"
              className="form-control"
              value={formData.charges}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-hint">
          Loyer total charges comprises: <strong>{loyerTotal.toFixed(2)} €</strong>
        </div>

        <div className="form-group">
          <label htmlFor="depot_garantie" className="form-label">Dépôt de garantie (€) *</label>
          <input
            type="number"
            id="depot_garantie"
            name="depot_garantie"
            step="0.01"
            min="0"
            className={`form-control ${errors.depot_garantie ? 'error' : ''}`}
            value={formData.depot_garantie}
            onChange={handleChange}
            required
          />
          {errors.depot_garantie && <div className="form-error">{errors.depot_garantie}</div>}
          <small className="form-hint">
            Généralement 1 mois de loyer HC
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="conditions_particulieres" className="form-label">
            Conditions particulières (optionnel)
          </label>
          <textarea
            id="conditions_particulieres"
            name="conditions_particulieres"
            rows="4"
            className="form-control"
            value={formData.conditions_particulieres}
            onChange={handleChange}
            placeholder="Ex: animaux non autorisés, travaux à prévoir, etc."
          />
        </div>
      </div>

      <div className="alert alert-info">
        <strong>📄 Génération automatique du PDF</strong>
        <p>Le bail sera généré automatiquement au format PDF et envoyé au locataire pour signature électronique.</p>
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
          type="submit"
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading ? 'Génération...' : 'Générer le bail'}
        </button>
      </div>
    </form>
  );
};

export default BailForm;
