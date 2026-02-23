import React from 'react';
import { Link } from 'react-router-dom';
import RegisterForm from '../components/auth/RegisterForm';

const RegisterPage = () => {
  return (
    <div className="container">
      <div style={{
        maxWidth: '500px',
        margin: '2rem auto',
      }}>
        <div className="card">
          <div className="card-header">
            <h2 style={{ textAlign: 'center' }}>Inscription</h2>
          </div>
          <div className="card-body">
            <RegisterForm />
            <p style={{ 
              textAlign: 'center', 
              marginTop: '1.5rem',
              color: '#666',
            }}>
              Déjà un compte ?{' '}
              <Link to="/login">Se connecter</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;