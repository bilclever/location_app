import React, { useState } from 'react';
import { validators } from '../../utils/validators';

const DossierLocataireForm = ({ location, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    nom: location?.nomLocataire?.split(' ')[0] || '',
    prenom: location?.nomLocataire?.split(' ').slice(1).join(' ') || '',
    email: location?.emailLocataire || '',
    telephone: location?.telephoneLocataire || '',
    profession: '',
    date_naissance: '',
    piece_identite: null,
    garant_nom: '',
    garant_email: '',
    garant_telephone: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (files && files.length > 0) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!validators.required(formData.nom)) {
      newErrors.nom = 'Nom requis';
    }

    if (!validators.required(formData.prenom)) {
      newErrors.prenom = 'Prénom requis';
    }

    if (!validators.email(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    if (!validators.required(formData.profession)) {
      newErrors.profession = 'Profession requise';
    }

    if (!formData.piece_identite && !location?.pieceIdentiteUrl) {
      newErrors.piece_identite = 'Pièce d\'identité requise';
    }

    if (formData.garant_email && !validators.email(formData.garant_email)) {
      newErrors.garant_email = 'Email garant invalide';
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

    const submitData = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] != null && formData[key] !== '') {
        submitData.append(key, formData[key]);
      }
    });

    if (location?.id) {
      submitData.append('location_id', location.id);
    }

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="dossier-locataire-form">
      <h3>Création du dossier locataire</h3>
      
      <div className="form-section">
        <h4>Informations personnelles</h4>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="nom" className="form-label">Nom *</label>
            <input
              type="text"
              id="nom"
              name="nom"
              className={`form-control ${errors.nom ? 'error' : ''}`}
              value={formData.nom}
              onChange={handleChange}
              required
            />
            {errors.nom && <div className="form-error">{errors.nom}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="prenom" className="form-label">Prénom *</label>
            <input
              type="text"
              id="prenom"
              name="prenom"
              className={`form-control ${errors.prenom ? 'error' : ''}`}
              value={formData.prenom}
              onChange={handleChange}
              required
            />
            {errors.prenom && <div className="form-error">{errors.prenom}</div>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              className={`form-control ${errors.email ? 'error' : ''}`}
              value={formData.email}
              onChange={handleChange}
              required
            />
            {errors.email && <div className="form-error">{errors.email}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="telephone" className="form-label">Téléphone</label>
            <input
              type="tel"
              id="telephone"
              name="telephone"
              className="form-control"
              value={formData.telephone}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="profession" className="form-label">Profession *</label>
            <input
              type="text"
              id="profession"
              name="profession"
              className={`form-control ${errors.profession ? 'error' : ''}`}
              value={formData.profession}
              onChange={handleChange}
              required
            />
            {errors.profession && <div className="form-error">{errors.profession}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="date_naissance" className="form-label">Date de naissance</label>
            <input
              type="date"
              id="date_naissance"
              name="date_naissance"
              className="form-control"
              value={formData.date_naissance}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="piece_identite" className="form-label">
            Pièce d'identité (PDF) *
          </label>
          <input
            type="file"
            id="piece_identite"
            name="piece_identite"
            className={`form-control ${errors.piece_identite ? 'error' : ''}`}
            accept=".pdf,image/*"
            onChange={handleChange}
          />
          {errors.piece_identite && <div className="form-error">{errors.piece_identite}</div>}
          {location?.pieceIdentiteUrl && (
            <small className="form-hint">Document existant disponible</small>
          )}
        </div>
      </div>

      <div className="form-section">
        <h4>Informations du garant (optionnel)</h4>
        
        <div className="form-group">
          <label htmlFor="garant_nom" className="form-label">Nom complet du garant</label>
          <input
            type="text"
            id="garant_nom"
            name="garant_nom"
            className="form-control"
            value={formData.garant_nom}
            onChange={handleChange}
            placeholder="Ex: M. Leroy (père)"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="garant_email" className="form-label">Email du garant</label>
            <input
              type="email"
              id="garant_email"
              name="garant_email"
              className={`form-control ${errors.garant_email ? 'error' : ''}`}
              value={formData.garant_email}
              onChange={handleChange}
            />
            {errors.garant_email && <div className="form-error">{errors.garant_email}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="garant_telephone" className="form-label">Téléphone du garant</label>
            <input
              type="tel"
              id="garant_telephone"
              name="garant_telephone"
              className="form-control"
              value={formData.garant_telephone}
              onChange={handleChange}
            />
          </div>
        </div>
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
          {isLoading ? 'Création...' : 'Créer le dossier'}
        </button>
      </div>
    </form>
  );
};

export default DossierLocataireForm;
