import React from 'react';
import { Link } from 'react-router-dom';
import { useAppartements } from '../hooks/useAppartements';
import AppartementCard from '../components/appartements/AppartementCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

const HomePage = () => {
  const { data, isLoading, error } = useAppartements({ 
    disponible: true,
    ordering: '-date_creation',
    page_size: 6,
  });

  return (
    <div className="page home">
      <section className="hero">
        <div className="container hero-content">
          <div className="hero-copy">
            <p className="kicker">Residance</p>
            <h1>La location urbaine qui va droit au but.</h1>
            <p className="lead">
              Appartements verifies, profils fiables et recherche ultra fluide pour
              trouver un lieu qui vous ressemble.
            </p>
            <div className="hero-actions">
              <Link to="/appartements" className="btn btn-lg">
                Explorer les annonces
              </Link>
              <Link to="/register" className="btn btn-outline btn-lg">
                Publier une annonce
              </Link>
            </div>
            <div className="hero-metrics">
              <div className="hero-metric">
                <div className="metric-value">+2 300</div>
                <div className="metric-label">annonces actives</div>
              </div>
              <div className="hero-metric">
                <div className="metric-value">48h</div>
                <div className="metric-label">temps moyen de location</div>
              </div>
              <div className="hero-metric">
                <div className="metric-value">4.8/5</div>
                <div className="metric-label">satisfaction locataires</div>
              </div>
            </div>
          </div>
          <div className="hero-panel">
            <h3>Une experience pro, sans bruit</h3>
            <ul>
              <li><span className="hero-dot" />Visites filtrees et ciblage intelligent</li>
              <li><span className="hero-dot" />Gestion simple pour proprietaires</li>
              <li><span className="hero-dot" />Disponibilite et prix en temps reel</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section section-surface">
        <div className="container">
          <div className="section-title">
            <h2>Derniers appartements disponibles</h2>
            <Link to="/appartements" className="btn btn-outline">
              Voir tous les appartements
            </Link>
          </div>

          {isLoading && <LoadingSpinner fullPage />}

          {error && (
            <div className="alert alert-error">
              Une erreur est survenue lors du chargement des appartements.
            </div>
          )}

          {data && (
            <div className="grid grid-3 reveal-list">
              {data.results.map(appartement => (
                <AppartementCard key={appartement.id} appartement={appartement} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="promo-banner">
            <h2>Vous etes proprietaire ?</h2>
            <p>
              Publiez vos annonces gratuitement et suivez vos locations dans un tableau
              de bord clair et rapide.
            </p>
            <Link to="/register" className="btn btn-primary btn-lg">
              Commencer maintenant
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;