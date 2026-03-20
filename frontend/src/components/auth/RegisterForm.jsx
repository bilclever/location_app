import React, { useState } from 'react';
import { useAuthContext as useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../services/supabaseClient';

const RegisterForm = () => {
  const {
    loginWithGoogle,
    registerAsync,
    verifyRegisterOtpAsync,
    isVerifyingRegisterOtp,
  } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [otpCode, setOtpCode] = useState('');
  const [otpStepActive, setOtpStepActive] = useState(false);
  const [otpDestination, setOtpDestination] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailRegisterLoading, setIsEmailRegisterLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleEmailRegister = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    if (!formData.email.trim() || !formData.password) {
      setErrorMessage('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsEmailRegisterLoading(true);
    try {
      const response = await registerAsync({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      if (response?.requires_otp) {
        setOtpStepActive(true);
        setOtpDestination(response.email || formData.email.trim().toLowerCase());
        setOtpCode('');
      }
    } catch (error) {
      const detail = error?.response?.data;
      if (typeof detail === 'string') {
        setErrorMessage(detail);
      } else if (detail?.detail) {
        setErrorMessage(detail.detail);
      } else if (typeof detail === 'object' && detail !== null) {
        const firstFieldError = Object.values(detail).find((value) => Array.isArray(value) && value.length > 0);
        setErrorMessage(firstFieldError?.[0] || 'Inscription impossible.');
      } else {
        setErrorMessage('Inscription impossible.');
      }
    } finally {
      setIsEmailRegisterLoading(false);
    }
  };

  const handleVerifyRegisterOtp = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setErrorMessage('Veuillez saisir un code OTP a 6 chiffres.');
      return;
    }

    try {
      await verifyRegisterOtpAsync({
        email: otpDestination || formData.email.trim().toLowerCase(),
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
      } else if (detail?.email?.[0]) {
        setErrorMessage(detail.email[0]);
      } else {
        setErrorMessage('Verification OTP impossible.');
      }
    }
  };

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
      <form onSubmit={otpStepActive ? handleVerifyRegisterOtp : handleEmailRegister}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            name="email"
            className="form-control"
            value={formData.email}
            onChange={handleChange}
            disabled={otpStepActive}
            required
            autoComplete="email"
            placeholder="exemple@email.com"
          />
        </div>

        {!otpStepActive && (
          <>
            <div className="form-group">
              <label htmlFor="password">Mot de passe</label>
              <input
                id="password"
                type="password"
                name="password"
                className="form-control"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
                placeholder="Choisissez un mot de passe"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                className="form-control"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
                placeholder="Confirmez le mot de passe"
              />
            </div>
          </>
        )}

        {otpStepActive && (
          <div className="form-group">
            <label htmlFor="register_otp_code">Code OTP d'inscription</label>
            <input
              id="register_otp_code"
              type="text"
              name="register_otp_code"
              className="form-control"
              value={otpCode}
              onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              autoComplete="one-time-code"
              placeholder="Code a 6 chiffres"
            />
            <small style={{ color: '#666' }}>
              Un code OTP a ete envoye a {otpDestination || formData.email}.
            </small>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={isEmailRegisterLoading || isVerifyingRegisterOtp}
        >
          {!otpStepActive && isEmailRegisterLoading
            ? 'Envoi du code OTP...'
            : otpStepActive && isVerifyingRegisterOtp
              ? 'Verification...'
              : otpStepActive
                ? 'Verifier le code OTP'
                : 'S inscrire avec email'}
        </button>

        {otpStepActive && (
          <button
            type="button"
            className="btn btn-primary btn-block"
            style={{ marginTop: '0.75rem', background: '#666' }}
            disabled={isEmailRegisterLoading}
            onClick={handleEmailRegister}
          >
            {isEmailRegisterLoading ? 'Renvoi...' : 'Renvoyer le code OTP'}
          </button>
        )}
      </form>

      <div style={{ textAlign: 'center', margin: '1rem 0', color: '#666' }}>
        ou
      </div>

      <button
        type="button"
        className="btn btn-primary btn-block"
        onClick={handleGoogleRegister}
        disabled={isLoading || !isSupabaseConfigured}
      >
        {isLoading ? 'Redirection vers Google...' : 'S’inscrire avec Google'}
      </button>

      <div style={{ textAlign: 'center', marginTop: '1rem', color: '#666' }}>
        Inscription par email ou via Google
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