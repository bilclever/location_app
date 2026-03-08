import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext as useAuth } from '../context/AuthContext';
import AppartementForm from '../components/appartements/AppartementForm';

const AppartementCreatePage = () => {
  const { user } = useAuth();
  const hasPhoneNumber = Boolean(user?.telephone?.trim());

  if (!hasPhoneNumber) {
    return (
      <div className="container">
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div className="card">
            <div className="card-header">
              <h2>Téléphone requis</h2>
            </div>
            <div className="card-body">
              <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
                Avant de publier une annonce, veuillez d'abord renseigner votre numéro de téléphone dans votre profil.
              </div>
              <Link to="/profile" className="btn btn-primary btn-block">
                Aller au profil
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div className="card">
          <div className="card-header">
            <h2>Ajouter un appartement</h2>
          </div>
          <div className="card-body">
            <AppartementForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppartementCreatePage;
