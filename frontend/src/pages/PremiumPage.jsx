import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext as useAuth } from '../context/AuthContext';
import PremiumWorkspace from '../components/premium/PremiumWorkspace';

const PremiumPage = () => {
  const { user } = useAuth();
  const isPremium = user?.plan === 'premium';

  if (!isPremium) {
    return (
      <div className="container" style={{ marginTop: '2rem' }}>
        <div className="alert alert-warning">
          Cette fonctionnalite est reservee au plan premium.
        </div>
        <Link to="/profile" className="btn btn-primary">
          Voir mon profil et mon plan
        </Link>
      </div>
    );
  }

  return (
    <div className="container">
      <PremiumWorkspace />
    </div>
  );
};

export default PremiumPage;
