import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateAppartement, useUpdateAppartement } from '../../hooks/useAppartements';
import { validators } from '../../utils/validators';
import { VILLES, NB_PIECES } from '../../utils/constants';

const AppartementForm = ({ appartement, onSuccess }) => {
  const navigate = useNavigate();
  const createMutation = useCreateAppartement();
  const updateMutation = useUpdateAppartement();
  
  const [formData, setFormData] = useState({
    titre: appartement?.titre || '',
    description: appartement?.description || '',
    adresse: appartement?.adresse || '',
    ville: appartement?.ville || 'Paris',
    code_postal: appartement?.code_postal || '',
    loyer_mensuel: appartement?.loyer_mensuel || '',
    caution: appartement?.caution || '',
    surface: appartement?.surface || '',
    nb_pieces: appartement?.nb_pieces || 1,
    disponible: appartement?.disponible ?? true,
  });
  
  const [errors, setErrors] = useState({});
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    setPhotos(prev => [...prev, ...files]);
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const newErrors = {};

    if (!validators.required(formData.titre)) {
      newErrors.titre = 'Titre requis';
    }

    if (!validators.required(formData.description)) {
      newErrors.description = 'Description requise';
    }

    if (!validators.required(formData.adresse)) {
      newErrors.adresse = 'Adresse requise';
    }

    if (!validators.required(formData.code_postal)) {
      newErrors.code_postal = 'Code postal requis';
    }

    if (!validators.required(formData.loyer_mensuel)) {
      newErrors.loyer_mensuel = 'Loyer mensuel requis';
    } else if (!validators.loyer(formData.loyer_mensuel)) {
      newErrors.loyer_mensuel = 'Loyer invalide';
    }

    if (formData.surface && !validators.surface(formData.surface)) {
      newErrors.surface = 'Surface invalide (max 1000m²)';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });

      photos.forEach(photo => {
        formDataToSend.append('photos', photo);
      });

      if (appartement) {
        await updateMutation.mutateAsync({ id: appartement.id, data: formDataToSend });
      } else {
        await createMutation.mutateAsync(formDataToSend);
      }

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      if (error.response?.data) {
        setErrors(error.response.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="titre" className="form-label">
          Titre *
        </label>
        <input
          type="text"
          id="titre"
          name="titre"
          className={`form-control ${errors.titre ? 'error' : ''}`}
          value={formData.titre}
          onChange={handleChange}
          required
        />
        {errors.titre && <div className="form-error">{errors.titre}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="description" className="form-label">
          Description *
        </label>
        <textarea
          id="description"
          name="description"
          rows="5"
          className={`form-control ${errors.description ? 'error' : ''}`}
          value={formData.description}
          onChange={handleChange}
          required
        />
        {errors.description && <div className="form-error">{errors.description}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="adresse" className="form-label">
          Adresse *
        </label>
        <input
          type="text"
          id="adresse"
          name="adresse"
          className={`form-control ${errors.adresse ? 'error' : ''}`}
          value={formData.adresse}
          onChange={handleChange}
          required
        />
        {errors.adresse && <div className="form-error">{errors.adresse}</div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label htmlFor="ville" className="form-label">
            Ville *
          </label>
          <select
            id="ville"
            name="ville"
            className="form-control"
            value={formData.ville}
            onChange={handleChange}
            required
          >
            {VILLES.map(ville => (
              <option key={ville} value={ville}>{ville}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="code_postal" className="form-label">
            Code postal *
          </label>
          <input
            type="text"
            id="code_postal"
            name="code_postal"
            className={`form-control ${errors.code_postal ? 'error' : ''}`}
            value={formData.code_postal}
            onChange={handleChange}
            required
          />
          {errors.code_postal && <div className="form-error">{errors.code_postal}</div>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label htmlFor="loyer_mensuel" className="form-label">
            Loyer mensuel (CFA) *
          </label>
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
          <label htmlFor="caution" className="form-label">
            Caution (CFA)
          </label>
          <input
            type="number"
            id="caution"
            name="caution"
            step="0.01"
            min="0"
            className={`form-control ${errors.caution ? 'error' : ''}`}
            value={formData.caution}
            onChange={handleChange}
          />
          {errors.caution && <div className="form-error">{errors.caution}</div>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label htmlFor="surface" className="form-label">
            Surface (m²)
          </label>
          <input
            type="number"
            id="surface"
            name="surface"
            min="1"
            max="1000"
            className={`form-control ${errors.surface ? 'error' : ''}`}
            value={formData.surface}
            onChange={handleChange}
          />
          {errors.surface && <div className="form-error">{errors.surface}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="nb_pieces" className="form-label">
            Nombre de pièces *
          </label>
          <select
            id="nb_pieces"
            name="nb_pieces"
            className="form-control"
            value={formData.nb_pieces}
            onChange={handleChange}
            required
          >
            {NB_PIECES.map(nb => (
              <option key={nb} value={nb}>{nb}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group checkbox">
        <label>
          <input
            type="checkbox"
            name="disponible"
            checked={formData.disponible}
            onChange={handleChange}
          />
          Disponible à la location
        </label>
      </div>

      <div className="form-group">
        <label className="form-label">
          Photos
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotoChange}
          className="form-control"
        />
        <div className="form-hint">
          Vous pouvez sélectionner plusieurs photos
        </div>
      </div>

      {photos.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem',
          marginBottom: '1rem',
        }}>
          {photos.map((photo, index) => (
            <div key={index} style={{ position: 'relative' }}>
              <img
                src={URL.createObjectURL(photo)}
                alt={`Photo ${index + 1}`}
                style={{
                  width: '100%',
                  height: '100px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                }}
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading ? 'Enregistrement...' : (appartement ? 'Mettre à jour' : 'Créer')}
        </button>
        
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => navigate(-1)}
        >
          Annuler
        </button>
      </div>
    </form>
  );
};

export default AppartementForm;