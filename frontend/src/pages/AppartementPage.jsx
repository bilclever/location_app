import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppartements } from '../hooks/useAppartements';
import AppartementCarousel from '../components/appartements/AppartementCarousel';
import AppartementFilters from '../components/appartements/AppartementFilters';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AppartementPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = Object.fromEntries(searchParams);
  const { page: _page, ...activeFilters } = filters;

  const { data, isLoading, error } = useAppartements({
    ...activeFilters,
    page: searchParams.get('page') || 1,
  });

  const handleFilterChange = (newFilters) => {
    setSearchParams({ ...newFilters, page: 1 });
  };

  const handlePageChange = (page) => {
    setSearchParams({ ...activeFilters, page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="page listing">
      <section className="section section-surface">
        <div className="container">
          <AppartementFilters filters={activeFilters} onFilterChange={handleFilterChange} />

          {data && data.results.length === 0 && !isLoading && (
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

          {isLoading && <LoadingSpinner fullPage />}

          {error && (
            <div className="alert alert-error">
              Une erreur est survenue lors du chargement des appartements.
            </div>
          )}

          {data && data.results.length > 0 && (
            <div className="carousel-overflow-wide">
              <AppartementCarousel appartements={data.results} />
            </div>
          )}

          {data && data.results.length > 0 && (
            <Pagination
              currentPage={data.current_page}
              totalPages={data.total_pages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </section>
    </div>
  );
};

export default AppartementPage;