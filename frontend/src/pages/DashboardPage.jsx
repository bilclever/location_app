import React from 'react';
import { useAuth } from '../hooks/useAuth';
import ProprietaireDashboard from '../components/dashboard/ProprietaireDashboard';
import LocataireDashboard from '../components/dashboard/LocataireDashboard';

const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <div className="container">
      {user?.role === 'PROPRIETAIRE' && <ProprietaireDashboard />}
      {user?.role === 'LOCATAIRE' && <LocataireDashboard />}
    </div>
  );
};

export default DashboardPage;