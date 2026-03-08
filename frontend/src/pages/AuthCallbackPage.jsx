import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuthContext as useAuth } from '../context/AuthContext';

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { completeOAuthLogin } = useAuth();
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    if (hasProcessedRef.current) {
      return;
    }
    hasProcessedRef.current = true;

    const processCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const oauthError = params.get('error_description') || params.get('error');

      if (oauthError) {
        toast.error(decodeURIComponent(oauthError));
        navigate('/login', { replace: true });
        return;
      }

      try {
        await completeOAuthLogin();
        const postLoginRedirect = sessionStorage.getItem('post_login_redirect');
        sessionStorage.removeItem('post_login_redirect');

        toast.success('Connexion Google réussie');
        navigate(postLoginRedirect && postLoginRedirect.startsWith('/') ? postLoginRedirect : '/', { replace: true });
      } catch (callbackError) {
        sessionStorage.removeItem('post_login_redirect');
        navigate('/', { replace: true });
      }
    };

    processCallback();
  }, [completeOAuthLogin, navigate]);

  return (
    <div className="container">
      <div style={{ maxWidth: '400px', margin: '2rem auto' }}>
        <div className="card">
          <div className="card-header">
            <h2 style={{ textAlign: 'center' }}>Connexion Google</h2>
          </div>
          <div className="card-body" style={{ textAlign: 'center' }}>
            <LoadingSpinner size="lg" />
            <p style={{ marginTop: '1rem', color: '#666' }}>
              Finalisation de votre session...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
