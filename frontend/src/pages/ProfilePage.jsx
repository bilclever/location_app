import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import ProfileForm from '../components/auth/ProfileForm';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ProfilePage = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  if (loading) return <LoadingSpinner fullPage />;

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
            className={`tabs-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            Sécurité
          </button>
          <button
            className={`tabs-btn ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            Préférences
          </button>
        </div>

        <div className="card">
          <div className="card-body">
            {activeTab === 'profile' && <ProfileForm user={user} />}
            
            {activeTab === 'security' && (
              <div>
                <h3>Changer le mot de passe</h3>
                {/* Formulaire de changement de mot de passe */}
              </div>
            )}
            
            {activeTab === 'preferences' && (
              <div>
                <h3>Préférences</h3>
                {/* Formulaire de préférences */}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;