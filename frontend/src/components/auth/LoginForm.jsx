import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthContext as useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../services/supabaseClient';

const LoginForm = () => {
  const {
    loginWithGoogle,
    loginAsync,
    verifyEmailOtpAsync,
    isVerifyingEmailOtp,
  } = useAuth();
  const [searchParams] = useSearchParams();
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [otpCode, setOtpCode] = useState('');
  const [otpStepActive, setOtpStepActive] = useState(false);
  const [otpDestination, setOtpDestination] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailLoginLoading, setIsEmailLoginLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setCredentials((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleEmailLogin = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    if (!credentials.email.trim() || !credentials.password) {
      setErrorMessage('Veuillez renseigner votre email et votre mot de passe.');
      return;
    }

    setIsEmailLoginLoading(true);
    try {
      const response = await loginAsync({
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
      });

      if (response?.requires_otp) {
        setOtpStepActive(true);
        setOtpDestination(response.email || credentials.email.trim().toLowerCase());
        setOtpCode('');
      }
    } catch (error) {
      const detail = error?.response?.data;
      if (typeof detail === 'string') {
        setErrorMessage(detail);
      } else if (detail?.detail) {
        setErrorMessage(detail.detail);
      } else if (detail?.non_field_errors?.[0]) {
        setErrorMessage(detail.non_field_errors[0]);
      } else {
        setErrorMessage('Connexion impossible. Verifiez vos identifiants.');
      }
    } finally {
      setIsEmailLoginLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setErrorMessage('Veuillez saisir un code OTP a 6 chiffres.');
      return;
    }

    try {
      await verifyEmailOtpAsync({
        email: otpDestination || credentials.email.trim().toLowerCase(),
        otp_code: otpCode.trim(),
      });
    } catch (error) {
      const detail = error?.response?.data;
      if (typeof detail === 'string') {
        setErrorMessage(detail);
      } else if (detail?.detail) {
        setErrorMessage(detail.detail);
      } else if (detail?.otp_code?.[0]) {
        setErrorMessage(detail.otp_code[0]);
      } else {
        setErrorMessage('Code OTP invalide.');
      }
    }
  };

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
      <form onSubmit={otpStepActive ? handleVerifyOtp : handleEmailLogin}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            name="email"
            className="form-control"
            value={credentials.email}
            onChange={handleChange}
            disabled={otpStepActive}
            required
            autoComplete="email"
            placeholder="exemple@email.com"
          />
        </div>

        {!otpStepActive && (
          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              name="password"
              className="form-control"
              value={credentials.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              placeholder="Votre mot de passe"
            />
          </div>
        )}

        {otpStepActive && (
          <div className="form-group">
            <label htmlFor="otp_code">Code OTP</label>
            <input
              id="otp_code"
              type="text"
              name="otp_code"
              className="form-control"
              value={otpCode}
              onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              autoComplete="one-time-code"
              placeholder="Code a 6 chiffres"
            />
            <small style={{ color: '#666' }}>
              Un code OTP a ete envoye a {otpDestination || credentials.email}.
            </small>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={isEmailLoginLoading || isVerifyingEmailOtp}
        >
          {!otpStepActive && isEmailLoginLoading
            ? 'Envoi du code OTP...'
            : otpStepActive && isVerifyingEmailOtp
              ? 'Verification...'
              : otpStepActive
                ? 'Verifier le code OTP'
                : 'Se connecter avec email'}
        </button>

        {otpStepActive && (
          <button
            type="button"
            className="btn btn-primary btn-block"
            style={{ marginTop: '0.75rem', background: '#666' }}
            disabled={isEmailLoginLoading}
            onClick={handleEmailLogin}
          >
            {isEmailLoginLoading ? 'Renvoi...' : 'Renvoyer le code OTP'}
          </button>
        )}
      </form>

      <div style={{ textAlign: 'center', margin: '1rem 0', color: '#666' }}>
        ou
      </div>

      <button
        type="button"
        className="btn btn-primary btn-block"
        onClick={handleGoogleLogin}
        disabled={isLoading || !isSupabaseConfigured}
      >
        {isLoading ? 'Redirection vers Google...' : 'Continuer avec Google'}
      </button>

      <div style={{ textAlign: 'center', marginTop: '1rem', color: '#666' }}>
        Connexion par email ou via Google
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