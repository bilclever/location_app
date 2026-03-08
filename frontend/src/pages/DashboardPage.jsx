import React, { useState } from 'react';
import ProprietaireDashboard from '../components/dashboard/ProprietaireDashboard';
import LocataireDashboard from '../components/dashboard/LocataireDashboard';
import PremiumWorkspace from '../components/premium/PremiumWorkspace';
import { useAuthContext as useAuth } from '../context/AuthContext';

const DashboardPage = () => {
  const { user } = useAuth();
  const isPremium = user?.plan === 'premium';
  const [activeTab, setActiveTab] = useState('proprietaire');

  return (
    <div className="container">
      {/* Avec Supabase Auth unifié, un utilisateur peut être à la fois locataire et propriétaire */}
      <div style={{ marginBottom: '20px' }}>
        <div className="tabs">
          <button
            className={`tabs-btn ${activeTab === 'proprietaire' ? 'active' : ''}`}
            onClick={() => setActiveTab('proprietaire')}
          >
            Mes Annonces
          </button>
          <button
            className={`tabs-btn ${activeTab === 'locataire' ? 'active' : ''}`}
            onClick={() => setActiveTab('locataire')}
          >
            Mes Réservations
          </button>
          {isPremium && (
            <button
              className={`tabs-btn ${activeTab === 'premium' ? 'active' : ''}`}
              onClick={() => setActiveTab('premium')}
            >
              Premium
            </button>
          )}
        </div>
      </div>

      <div>
        {activeTab === 'proprietaire' && <ProprietaireDashboard />}
        {activeTab === 'locataire' && <LocataireDashboard />}
        {isPremium && activeTab === 'premium' && <PremiumWorkspace />}
      </div>
    </div>
  );
};

export default DashboardPage;