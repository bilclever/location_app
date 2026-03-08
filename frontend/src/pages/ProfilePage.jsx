import React, { useState } from 'react';
import { useAuthContext as useAuth } from '../context/AuthContext';
import ProfileForm from '../components/auth/ProfileForm';
import ProprietaireDashboard from '../components/dashboard/ProprietaireDashboard';
import MesReservationsPage from './MesReservationsPage';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ProfilePage = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  if (isLoading) return <LoadingSpinner fullPage />;

  return (
    <div className="container">
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="tabs">
          <button
            className={`tabs-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Informations
          </button>
          <button
            className={`tabs-btn ${activeTab === 'reservations' ? 'active' : ''}`}
            onClick={() => setActiveTab('reservations')}
          >
            Mes réservations
          </button>
          <button
            className={`tabs-btn ${activeTab === 'annonces' ? 'active' : ''}`}
            onClick={() => setActiveTab('annonces')}
          >
            Mes annonces
          </button>
        </div>

        <div className="card">
          <div className="card-body">
            {activeTab === 'profile' && <ProfileForm user={user} />}
            
            {activeTab === 'reservations' && (
              <MesReservationsPage isEmbedded={true} />
            )}
            
            {activeTab === 'annonces' && (
              <ProprietaireDashboard isEmbedded={true} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;