import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { validators } from '../../utils/validators';

const RegisterForm = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    telephone: '',
    role: 'LOCATAIRE',
    password: '',
    password2: '',
    date_naissance: '',
    adresse: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!validators.required(formData.username)) {
      newErrors.username = "Nom d'utilisateur requis";
    }

    if (!validators.email(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    if (!validators.required(formData.first_name)) {
      newErrors.first_name = 'Prénom requis';
    }

    if (!validators.required(formData.last_name)) {
      newErrors.last_name = 'Nom requis';
    }

    if (formData.telephone && !validators.phone(formData.telephone)) {
      newErrors.telephone = 'Téléphone invalide';
    }

    if (!validators.password(formData.password)) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    }

    if (!validators.passwordMatch(formData.password, formData.password2)) {
      newErrors.password2 = 'Les mots de passe ne correspondent pas';
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
      // Préparer les données pour l'envoi - garder tous les champs du backend
      const dataToSubmit = {
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        password: formData.password,
        password2: formData.password2,
        role: formData.role,
      };
      
      // Ajouter les champs optionnels seulement s'ils ne sont pas vides
      if (formData.telephone) {
        dataToSubmit.telephone = formData.telephone;
      }
      if (formData.date_naissance) {
        dataToSubmit.date_naissance = formData.date_naissance;
      }
      if (formData.adresse) {
        dataToSubmit.adresse = formData.adresse;
      }
      
      await register(dataToSubmit);
      navigate('/');
    } catch (error) {
      if (error.response?.data) {
        // Gérer les erreurs détaillées du backend
        const backendErrors = error.response.data;
        if (typeof backendErrors === 'object') {
          setErrors(backendErrors);
        } else {
          setErrors({ non_field_errors: backendErrors.error || 'Erreur lors de l\'inscription' });
        }
      } else {
        setErrors({ non_field_errors: 'Erreur de connexion au serveur' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <div className="form-group">
        <label htmlFor="username" className="form-label">
          Nom d'utilisateur *
        </label>
        <input
          type="text"
          id="username"
          name="username"
          className={`form-control ${errors.username ? 'error' : ''}`}
          value={formData.username}
          onChange={handleChange}
          required
        />
        {errors.username && (
          <div className="form-error">{errors.username}</div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="email" className="form-label">
          Email *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          className={`form-control ${errors.email ? 'error' : ''}`}
          value={formData.email}
          onChange={handleChange}
          required
        />
        {errors.email && (
          <div className="form-error">{errors.email}</div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label htmlFor="first_name" className="form-label">
            Prénom *
          </label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            className={`form-control ${errors.first_name ? 'error' : ''}`}
            value={formData.first_name}
            onChange={handleChange}
            required
          />
          {errors.first_name && (
            <div className="form-error">{errors.first_name}</div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="last_name" className="form-label">
            Nom *
          </label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            className={`form-control ${errors.last_name ? 'error' : ''}`}
            value={formData.last_name}
            onChange={handleChange}
            required
          />
          {errors.last_name && (
            <div className="form-error">{errors.last_name}</div>
          )}
        </div>
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
        <div className="form-hint">Format: 01 23 45 67 89</div>
      </div>

      <div className="form-group">
        <label htmlFor="role" className="form-label">
          Je suis *
        </label>
        <select
          id="role"
          name="role"
          className="form-control"
          value={formData.role}
          onChange={handleChange}
          required
        >
          <option value="LOCATAIRE">Locataire (je cherche à louer)</option>
          <option value="PROPRIETAIRE">Propriétaire (je loue mes biens)</option>
        </select>
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

      <div className="form-group">
        <label htmlFor="adresse" className="form-label">
          Adresse
        </label>
        <input
          type="text"
          id="adresse"
          name="adresse"
          className={`form-control ${errors.adresse ? 'error' : ''}`}
          value={formData.adresse}
          onChange={handleChange}
          placeholder="123 Rue de l'Exemple, 75000 Paris"
        />
        {errors.adresse && (
          <div className="form-error">{errors.adresse}</div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label htmlFor="password" className="form-label">
            Mot de passe *
          </label>
          <input
            type="password"
            id="password"
            name="password"
            className={`form-control ${errors.password ? 'error' : ''}`}
            value={formData.password}
            onChange={handleChange}
            required
          />
          {errors.password && (
            <div className="form-error">{errors.password}</div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="password2" className="form-label">
            Confirmation *
          </label>
          <input
            type="password"
            id="password2"
            name="password2"
            className={`form-control ${errors.password2 ? 'error' : ''}`}
            value={formData.password2}
            onChange={handleChange}
            required
          />
          {errors.password2 && (
            <div className="form-error">{errors.password2}</div>
          )}
        </div>
      </div>

      {errors.non_field_errors && (
        <div className="alert alert-error">{errors.non_field_errors}</div>
      )}

      <button
        type="submit"
        className="btn btn-primary btn-block"
        disabled={isLoading}
      >
        {isLoading ? 'Inscription...' : "S'inscrire"}
      </button>
    </form>
  );
};

export default RegisterForm;