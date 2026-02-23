import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { validators } from '../../utils/validators';

const ProfileForm = ({ user }) => {
  const { updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    telephone: user?.telephone || '',
    adresse: user?.adresse || '',
    date_naissance: user?.date_naissance || '',
    notifications_email: user?.notifications_email || true,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(user?.photo_profil || '/images/default-avatar.png');

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
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (formData.telephone && !validators.phone(formData.telephone)) {
      newErrors.telephone = 'Format de téléphone invalide';
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
      
      if (photo) {
        formDataToSend.append('photo_profil', photo);
      }

      await updateProfile(formDataToSend);
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
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          overflow: 'hidden',
          margin: '0 auto 1rem',
          border: '3px solid #2563eb',
        }}>
          <img
            src={photoPreview}
            alt="Profile"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        
        <label htmlFor="photo" className="btn btn-outline btn-sm">
          Changer la photo
        </label>
        <input
          type="file"
          id="photo"
          accept="image/*"
          onChange={handlePhotoChange}
          style={{ display: 'none' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label htmlFor="first_name" className="form-label">
            Prénom
          </label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            className={`form-control ${errors.first_name ? 'error' : ''}`}
            value={formData.first_name}
            onChange={handleChange}
          />
          {errors.first_name && (
            <div className="form-error">{errors.first_name}</div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="last_name" className="form-label">
            Nom
          </label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            className={`form-control ${errors.last_name ? 'error' : ''}`}
            value={formData.last_name}
            onChange={handleChange}
          />
          {errors.last_name && (
            <div className="form-error">{errors.last_name}</div>
          )}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="email" className="form-label">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={user?.email || ''}
          className="form-control"
          disabled
        />
        <div className="form-hint">L'email ne peut pas être modifié</div>
      </div>

      <div className="form-group">
        <label htmlFor="username" className="form-label">
          Nom d'utilisateur
        </label>
        <input
          type="text"
          id="username"
          value={user?.username || ''}
          className="form-control"
          disabled
        />
      </div>

      <div className="form-group">
        <label htmlFor="telephone" className="form-label">
          Téléphone
        </label>
        <input
          type="tel"
          id="telephone"
          name="telephone"
          className={`form-control ${errors.telephone ? 'error' : ''}`}
          value={formData.telephone}
          onChange={handleChange}
          placeholder="01 23 45 67 89"
        />
        {errors.telephone && (
          <div className="form-error">{errors.telephone}</div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="adresse" className="form-label">
          Adresse
        </label>
        <textarea
          id="adresse"
          name="adresse"
          className={`form-control ${errors.adresse ? 'error' : ''}`}
          value={formData.adresse}
          onChange={handleChange}
          rows="3"
        />
        {errors.adresse && (
          <div className="form-error">{errors.adresse}</div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="date_naissance" className="form-label">
          Date de naissance
        </label>
        <input
          type="date"
          id="date_naissance"
          name="date_naissance"
          className={`form-control ${errors.date_naissance ? 'error' : ''}`}
          value={formData.date_naissance}
          onChange={handleChange}
        />
        {errors.date_naissance && (
          <div className="form-error">{errors.date_naissance}</div>
        )}
      </div>

      <div className="form-group checkbox">
        <label>
          <input
            type="checkbox"
            name="notifications_email"
            checked={formData.notifications_email}
            onChange={handleChange}
          />
          Recevoir les notifications par email
        </label>
      </div>

      <button
        type="submit"
        className="btn btn-primary btn-block"
        disabled={isLoading}
      >
        {isLoading ? 'Mise à jour...' : 'Mettre à jour'}
      </button>
    </form>
  );
};

export default ProfileForm;