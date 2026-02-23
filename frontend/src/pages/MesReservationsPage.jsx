import React, { useState } from 'react';
import { useLocations } from '../hooks/useLocations';
import LocationList from '../components/locations/LocationList';
import Pagination from '../components/common/Pagination';

const MesReservationsPage = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});

  const { data, isLoading, error, refetch } = useLocations({
    ...filters,
    page,
    page_size: 10,
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  };

  return (
    <div className="container">
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div className="page-header">
          <h1>Mes réservations</h1>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <select
            name="statut"
            value={filters.statut || ''}
            onChange={handleFilterChange}
            className="form-control"
            style={{ width: '200px' }}
          >
            <option value="">Tous les statuts</option>
            <option value="PENDING">En attente de confirmation</option>
            <option value="RESERVE">Réservé</option>
            <option value="CONFIRME">Confirmé</option>
            <option value="PAYE">Payé</option>
            <option value="TERMINE">Terminé</option>
            <option value="ANNULE">Annulé</option>
          </select>
        </div>

        <LocationList
          locations={data?.results}
          isLoading={isLoading}
          error={error}
          onUpdate={refetch}
        />

        {data && data.total_pages > 1 && (
          <Pagination
            currentPage={data.current_page}
            totalPages={data.total_pages}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
};

export default MesReservationsPage;