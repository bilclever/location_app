import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppartements } from '../hooks/useAppartements';
import AppartementCard from '../components/appartements/AppartementCard';
import AppartementFilters from '../components/appartements/AppartementFilters';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AppartementPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(Object.fromEntries(searchParams));

  const { data, isLoading, error } = useAppartements({
    ...filters,
    page: searchParams.get('page') || 1,
  });

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setSearchParams({ ...newFilters, page: 1 });
  };

  const handlePageChange = (page) => {
    setSearchParams({ ...filters, page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="page listing">
      <section className="section section-surface">
        <div className="container">
          

          <AppartementFilters filters={filters} onFilterChange={handleFilterChange} />

          {isLoading && <LoadingSpinner fullPage />}

          {error && (
            <div className="alert alert-error">
              Une erreur est survenue lors du chargement des appartements.
            </div>
          )}

          {data && data.results.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <p>Aucun appartement ne correspond a vos criteres.</p>
              <button
                className="btn btn-primary"
                onClick={() => handleFilterChange({})}
              >
                Voir tous les appartements
              </button>
            </div>
          )}

          {data && data.results.length > 0 && (
            <>
              <div className="grid grid-3 reveal-list">
                {data.results.map(appartement => (
                  <AppartementCard key={appartement.id} appartement={appartement} />
                ))}
              </div>

              <Pagination
                currentPage={data.current_page}
                totalPages={data.total_pages}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default AppartementPage;