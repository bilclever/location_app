import React from 'react';
import { Link } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';

const LoginPage = () => {
  return (
    <div className="container">
      <div style={{
        maxWidth: '400px',
        margin: '2rem auto',
      }}>
        <div className="card">
          <div className="card-header">
            <h2 style={{ textAlign: 'center' }}>Connexion</h2>
          </div>
          <div className="card-body">
            <LoginForm />
            <p style={{ 
              textAlign: 'center', 
              marginTop: '1.5rem',
              color: '#666',
            }}>
              Pas encore de compte ?{' '}
              <Link to="/register">S'inscrire</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;