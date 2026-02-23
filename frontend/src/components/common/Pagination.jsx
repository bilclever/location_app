import React from 'react';

const Pagination = ({ currentPage = 1, totalPages = 1, onPageChange }) => {
  // Vérifier les valeurs
  const page = Math.max(1, parseInt(currentPage) || 1);
  const total = Math.max(1, parseInt(totalPages) || 1);
  
  if (total <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (total <= maxVisible) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(total);
      } else if (page >= total - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = total - 3; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(page - 1);
        pages.push(page);
        pages.push(page + 1);
        pages.push('...');
        pages.push(total);
      }
    }
    
    return pages;
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      gap: '0.5rem',
      marginTop: '2rem',
    }}>
      <button
        className="btn btn-outline btn-sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
      >
        Précédent
      </button>

      {getPageNumbers().map((pageNum, index) => {
        // Créer une clé unique
        const key = pageNum === '...' ? `dots-${index}` : `page-${pageNum}`;
        
        if (pageNum === '...') {
          return (
            <span key={key} style={{ padding: '0.5rem' }}>
              ...
            </span>
          );
        }
        
        return (
          <button
            key={key}
            className={`btn btn-sm ${pageNum === page ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => onPageChange(pageNum)}
          >
            {pageNum}
          </button>
        );
      })}

      <button
        className="btn btn-outline btn-sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page === total}
      >
        Suivant
      </button>
    </div>
  );
};

export default Pagination;