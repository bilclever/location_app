import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import logo from '../../assets/images/logo1.png';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  return (
    <header className="header">
      <div className="container header-content">
        <Link to="/" className="header-logo" onClick={() => setIsMenuOpen(false)}>
          <img src={logo} alt="Résidence Location" className="logo-image" />
        </Link>

        <button
          type="button"
          className="header-toggle"
          onClick={() => setIsMenuOpen(prev => !prev)}
          aria-expanded={isMenuOpen}
          aria-controls="header-nav"
        >
          <span className="hamburger">
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </span>
        </button>

        {isMenuOpen && (
          <div
            className="menu-overlay"
            onClick={() => setIsMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        <nav id="header-nav" className={`header-nav ${isMenuOpen ? 'is-open' : ''}`}>
          <NavLink to="/" className="header-link" end onClick={() => setIsMenuOpen(false)}>
            Accueil
          </NavLink>
          
          <NavLink to="/appartements" className="header-link" onClick={() => setIsMenuOpen(false)}>
            Appartements
          </NavLink>

          {isAuthenticated ? (
            <>
              {user?.role === 'LOCATAIRE' && (
                <>
                  <NavLink to="/favoris" className="header-link" onClick={() => setIsMenuOpen(false)}>
                    Favoris
                  </NavLink>
                  <NavLink to="/mes-reservations" className="header-link" onClick={() => setIsMenuOpen(false)}>
                    Mes réservations
                  </NavLink>
                </>
              )}
              
              {user?.role === 'PROPRIETAIRE' && (
                <NavLink to="/dashboard" className="header-link" onClick={() => setIsMenuOpen(false)}>
                  Tableau de bord
                </NavLink>
              )}
              
              {user?.role === 'ADMIN' && (
                <NavLink to="/admin" className="header-link" onClick={() => setIsMenuOpen(false)}>
                  Administration
                </NavLink>
              )}
              
              <NavLink to="/profile" className="header-link" onClick={() => setIsMenuOpen(false)}>
                {user?.first_name || 'Profil'}
              </NavLink>
              
              <button onClick={handleLogout} className="btn btn-outline btn-sm">
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="header-link" onClick={() => setIsMenuOpen(false)}>
                Connexion
              </NavLink>
              <NavLink to="/register" className="btn btn-primary btn-sm" onClick={() => setIsMenuOpen(false)}>
                Inscription
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;