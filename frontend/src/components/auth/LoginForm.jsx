import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthContext as useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../services/supabaseClient';

const LoginForm = () => {
  const { loginWithGoogle } = useAuth();
  const [searchParams] = useSearchParams();
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const nextPath = searchParams.get('next');
      if (nextPath && nextPath.startsWith('/')) {
        sessionStorage.setItem('post_login_redirect', nextPath);
      }
      await loginWithGoogle();
    } catch (error) {
      setErrorMessage(error?.message || 'Impossible de lancer la connexion Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <button
        type="button"
        className="btn btn-primary btn-block"
        onClick={handleGoogleLogin}
        disabled={isLoading || !isSupabaseConfigured}
      >
        {isLoading ? 'Redirection vers Google...' : 'Continuer avec Google'}
      </button>

      <div style={{ textAlign: 'center', marginTop: '1rem', color: '#666' }}>
        Connexion sécurisée via Google (Supabase)
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

export default LoginForm;