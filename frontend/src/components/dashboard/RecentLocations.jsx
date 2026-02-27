import React from 'react';
import { Link } from 'react-router-dom';
import { formatters } from '../../utils/formatters';
import { STATUT_COLORS, STATUT_LABELS } from '../../utils/constants';

const RecentLocations = ({ locations }) => {
  if (!locations || locations.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Aucune réservation récente.</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Appartement</th>
            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Locataire</th>
            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Dates</th>
            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Montant</th>
            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Statut</th>
            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {locations.map(location => (
            <tr key={location.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '0.75rem' }}>
                <Link to={`/appartements/${location.appartementSlug}`}>
                  {location.appartementTitre}
                </Link>
              </td>
              <td style={{ padding: '0.75rem' }}>
                <div>{location.nomLocataire}</div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>
                  {location.emailLocataire}
                </div>
              </td>
              <td style={{ padding: '0.75rem' }}>
                <div>du {formatters.date(location.dateDebut)}</div>
                <div>au {formatters.date(location.dateFin)}</div>
              </td>
              <td style={{ padding: '0.75rem', fontWeight: '500' }}>
                {formatters.price(location.montantTotal)}
              </td>
              <td style={{ padding: '0.75rem' }}>
                <span className={`badge badge-${STATUT_COLORS[location.statut]}`}>
                  {STATUT_LABELS[location.statut]}
                </span>
              </td>
              <td style={{ padding: '0.75rem' }}>
                <Link
                  to={`/mes-reservations`}
                  className="btn btn-outline btn-sm"
                >
                  Voir
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecentLocations;