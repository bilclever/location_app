import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import logo from '../../assets/images/logo1.png';
import { VILLES, NB_PIECES, PRIX_MAX } from '../../utils/constants';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(Object.fromEntries(searchParams));

  // Fermer le menu quand la fenêtre est redimensionnée
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 769) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/appartements?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsMenuOpen(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    navigate(`/appartements?${new URLSearchParams(localFilters).toString()}`);
    setIsFiltersOpen(false);
  };

  const handleResetFilters = () => {
    setLocalFilters({});
    navigate('/appartements');
    setIsFiltersOpen(false);
  };

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

        <form onSubmit={handleSearch} className="header-search">
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </form>

        <button
          type="button"
          className="header-filters-toggle"
          onClick={() => setIsFiltersOpen(prev => !prev)}
          title="Filtres"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {/* Left vertical line with circle */}
            <line x1="6" y1="4" x2="6" y2="20"></line>
            <circle cx="6" cy="6" r="2.5"></circle>
            
            {/* Middle vertical line with circle */}
            <line x1="12" y1="4" x2="12" y2="20"></line>
            <circle cx="12" cy="12" r="2.5"></circle>
            
            {/* Right vertical line with circle */}
            <line x1="18" y1="4" x2="18" y2="20"></line>
            <circle cx="18" cy="14" r="2.5"></circle>
          </svg>
          <span>Filtre</span>
        </button>

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

        {isFiltersOpen && (
          <>
            <div className="filters-modal-overlay" onClick={() => setIsFiltersOpen(false)}></div>
            <div className="filters-modal">
              <div className="filters-modal-header">
                <h3>Filtres</h3>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsFiltersOpen(false)}
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleApplyFilters} className="filters-modal-body">
                <div className="form-group">
                  <label htmlFor="search" className="form-label">
                    Rechercher
                  </label>
                  <input
                    type="text"
                    id="search"
                    name="search"
                    className="form-control"
                    placeholder="Titre, description..."
                    value={localFilters.search || ''}
                    onChange={handleFilterChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="ville" className="form-label">
                    Ville
                  </label>
                  <select
                    id="ville"
                    name="ville"
                    className="form-control"
                    value={localFilters.ville || ''}
                    onChange={handleFilterChange}
                  >
                    <option value="">Toutes les villes</option>
                    {VILLES.map(ville => (
                      <option key={ville} value={ville}>{ville}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="disponible" className="form-label">
                    Disponibilité
                  </label>
                  <select
                    id="disponible"
                    name="disponible"
                    className="form-control"
                    value={localFilters.disponible || ''}
                    onChange={handleFilterChange}
                  >
                    <option value="">Tous</option>
                    <option value="true">Disponibles</option>
                    <option value="false">Indisponibles</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="nb_pieces" className="form-label">
                    Pièces minimum
                  </label>
                  <select
                    id="nb_pieces"
                    name="nb_pieces__gte"
                    className="form-control"
                    value={localFilters['nb_pieces__gte'] || ''}
                    onChange={handleFilterChange}
                  >
                    <option value="">Tous</option>
                    {NB_PIECES.map(nb => (
                      <option key={nb} value={nb}>{nb} pièce{nb > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="loyer_max" className="form-label">
                    Loyer max (CFA)
                  </label>
                  <select
                    id="loyer_max"
                    name="loyer_mensuel__lte"
                    className="form-control"
                    value={localFilters['loyer_mensuel__lte'] || ''}
                    onChange={handleFilterChange}
                  >
                    <option value="">Tous</option>
                    {PRIX_MAX.map(prix => (
                      <option key={prix} value={prix}>{prix} CFA</option>
                    ))}
                  </select>
                </div>

                <div className="filters-modal-actions">
                  <button type="submit" className="btn btn-primary btn-block">
                    Appliquer
                  </button>
                  <button type="button" className="btn btn-outline btn-block" onClick={handleResetFilters}>
                    Réinitialiser
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;