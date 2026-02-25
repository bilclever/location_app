import React, { useState } from 'react';
import { VILLES, NB_PIECES, PRIX_MAX } from '../../utils/constants';

const AppartementFilters = ({ filters, onFilterChange }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilterChange(localFilters);
  };

  const handleReset = () => {
    const resetFilters = {};
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className={`filters filters-desktop`}>
      <form onSubmit={handleSubmit}>
        <div className="filters-grid">
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
              onChange={handleChange}
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
              onChange={handleChange}
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
              onChange={handleChange}
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
              onChange={handleChange}
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
              onChange={handleChange}
            >
              <option value="">Tous</option>
              {PRIX_MAX.map(prix => (
                <option key={prix} value={prix}>{prix} CFA</option>
              ))}
            </select>
          </div>

          <div className="filters-actions">
            <button type="submit" className="btn btn-primary">
              Appliquer
            </button>
            <button type="button" className="btn btn-outline" onClick={handleReset}>
              Réinitialiser
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AppartementFilters;