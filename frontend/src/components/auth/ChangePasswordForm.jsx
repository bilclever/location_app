import React, { useState } from 'react';
import { authService } from '../../services/auth';
import { validators } from '../../utils/validators';
import toast from 'react-hot-toast';

const ChangePasswordForm = () => {
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    new_password2: '',
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

    if (!formData.old_password) {
      newErrors.old_password = 'Mot de passe requis';
    }

    if (!validators.password(formData.new_password)) {
      newErrors.new_password = 'Le mot de passe doit contenir au moins 8 caractères';
    }

    if (!validators.passwordMatch(formData.new_password, formData.new_password2)) {
      newErrors.new_password2 = 'Les mots de passe ne correspondent pas';
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
      await authService.changePassword(formData);
      toast.success('Mot de passe changé avec succès');
      setFormData({
        old_password: '',
        new_password: '',
        new_password2: '',
      });
    } catch (error) {
      if (error.response?.data) {
        setErrors(error.response.data);
      } else {
        toast.error('Erreur lors du changement de mot de passe');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="old_password" className="form-label">
          Ancien mot de passe
        </label>
        <input
          type="password"
          id="old_password"
          name="old_password"
          className={`form-control ${errors.old_password ? 'error' : ''}`}
          value={formData.old_password}
          onChange={handleChange}
          required
        />
        {errors.old_password && (
          <div className="form-error">{errors.old_password}</div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="new_password" className="form-label">
          Nouveau mot de passe
        </label>
        <input
          type="password"
          id="new_password"
          name="new_password"
          className={`form-control ${errors.new_password ? 'error' : ''}`}
          value={formData.new_password}
          onChange={handleChange}
          required
        />
        {errors.new_password && (
          <div className="form-error">{errors.new_password}</div>
        )}
        <div className="form-hint">Minimum 8 caractères</div>
      </div>

      <div className="form-group">
        <label htmlFor="new_password2" className="form-label">
          Confirmer le nouveau mot de passe
        </label>
        <input
          type="password"
          id="new_password2"
          name="new_password2"
          className={`form-control ${errors.new_password2 ? 'error' : ''}`}
          value={formData.new_password2}
          onChange={handleChange}
          required
        />
        {errors.new_password2 && (
          <div className="form-error">{errors.new_password2}</div>
        )}
      </div>

      {errors.non_field_errors && (
        <div className="alert alert-error">{errors.non_field_errors}</div>
      )}

      <button
        type="submit"
        className="btn btn-primary btn-block"
        disabled={isLoading}
      >
        {isLoading ? 'Changement...' : 'Changer le mot de passe'}
      </button>
    </form>
  );
};

export default ChangePasswordForm;