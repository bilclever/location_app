import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const LoginForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      await login(formData);
      navigate('/');
    } catch (error) {
      if (error.response?.data) {
        setErrors(error.response.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <div className="form-group">
        <label htmlFor="username" className="form-label">
          Nom d'utilisateur ou email
        </label>
        <input
          type="text"
          id="username"
          name="username"
          className={`form-control ${errors.username || errors.error ? 'error' : ''}`}
          value={formData.username}
          onChange={handleChange}
          required
        />
        {errors.username && (
          <div className="form-error">{errors.username}</div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="password" className="form-label">
          Mot de passe
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

      {errors.error && (
        <div className="alert alert-error">{errors.error}</div>
      )}

      <button
        type="submit"
        className="btn btn-primary btn-block"
        disabled={isLoading}
      >
        {isLoading ? 'Connexion...' : 'Se connecter'}
      </button>
    </form>
  );
};

export default LoginForm;