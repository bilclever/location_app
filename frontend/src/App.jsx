import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import ErrorBoundary from './components/common/ErrorBoundary';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import AppartementPage from './pages/AppartementPage';
import AppartementDetailPage from './pages/AppartementDetailPage';
import ReservationPage from './pages/ReservationPage';
import MesReservationsPage from './pages/MesReservationsPage';
import FavorisPage from './pages/FavorisPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import './assets/styles/main.scss';

function App() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <AuthProvider>
          <Header />
          <main className={`page ${isHomePage ? 'home' : ''}`}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/appartements" element={<AppartementPage />} />
              <Route path="/appartements/:slug" element={<AppartementDetailPage />} />
              
              <Route path="/profile" element={
                <PrivateRoute>
                  <ProfilePage />
                </PrivateRoute>
              } />
              
              <Route path="/reservations/:slug" element={
                <PrivateRoute>
                  <ReservationPage />
                </PrivateRoute>
              } />
              
              <Route path="/mes-reservations" element={
                <PrivateRoute>
                  <MesReservationsPage />
                </PrivateRoute>
              } />
              
              <Route path="/favoris" element={
                <PrivateRoute roles={['LOCATAIRE']}>
                  <FavorisPage />
                </PrivateRoute>
              } />
              
              <Route path="/dashboard" element={
                <PrivateRoute roles={['PROPRIETAIRE', 'LOCATAIRE']}>
                  <DashboardPage />
                </PrivateRoute>
              } />
              
              <Route path="/admin" element={
                <PrivateRoute roles={['ADMIN']}>
                  <AdminPage />
                </PrivateRoute>
              } />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </AuthProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
