import React, { useState } from 'react';
import { useAuthContext as useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../services/supabaseClient';

const RegisterForm = () => {
  const { loginWithGoogle } = useAuth();
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleRegister = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      await loginWithGoogle();
    } catch (error) {
      setErrorMessage(error?.message || 'Impossible de lancer l’inscription Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <button
        type="button"
        className="btn btn-primary btn-block"
        onClick={handleGoogleRegister}
        disabled={isLoading || !isSupabaseConfigured}
      >
        {isLoading ? 'Redirection vers Google...' : 'S’inscrire avec Google'}
      </button>

      <div style={{ textAlign: 'center', marginTop: '1rem', color: '#666' }}>
        Un compte unique pour publier et réserver
      </div>

      {errorMessage && (
        <div className="alert alert-error" style={{ marginTop: '1rem' }}>
          {errorMessage}
        </div>
      )}

      {!isSupabaseConfigured && (
        <div className="alert alert-error" style={{ marginTop: '1rem' }}>
          Configuration manquante: ajoutez REACT_APP_SUPABASE_ANON_KEY dans .env puis redémarrez.
        </div>
      )}
    </div>
  );
};

export default RegisterForm;