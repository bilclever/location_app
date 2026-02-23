import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <h3 className="footer-title">Residance</h3>
            <p>
              La plateforme de référence pour la location d'appartements
              entre particuliers en toute confiance.
            </p>
          </div>

          <div className="footer-column">
            <h4 className="footer-title">Navigation</h4>
            <Link to="/" className="footer-link">Accueil</Link>
            <Link to="/appartements" className="footer-link">Appartements</Link>
            <Link to="/contact" className="footer-link">Contact</Link>
            <Link to="/faq" className="footer-link">FAQ</Link>
          </div>

          <div className="footer-column">
            <h4 className="footer-title">Légal</h4>
            <Link to="/mentions-legales" className="footer-link">Mentions légales</Link>
            <Link to="/confidentialite" className="footer-link">Politique de confidentialité</Link>
            <Link to="/cgv" className="footer-link">CGV</Link>
          </div>

          <div className="footer-column">
            <h4 className="footer-title">Contact</h4>
            <p className="footer-link">contact@residance.fr</p>
            <p className="footer-link">01 23 45 67 89</p>
            <p className="footer-link">
              123 rue de l'Exemple<br />
              75001 Paris
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} Residance. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;