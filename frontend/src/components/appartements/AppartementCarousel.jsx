import React, { useRef, useState, useEffect } from 'react';
import AppartementCard from './AppartementCard';

const AppartementCarousel = ({ appartements }) => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [appartements]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.querySelector('.appartement-card')?.offsetWidth || 300;
      const gap = 24; // gap entre les cartes
      const scrollAmount = (cardWidth + gap) * 2; // défiler de 2 cartes à la fois
      
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      
      setTimeout(checkScroll, 300);
    }
  };

  if (!appartements || appartements.length === 0) {
    return null;
  }

  return (
    <div className="carousel-container">
      {canScrollLeft && (
        <button 
          className="carousel-arrow carousel-arrow-left"
          onClick={() => scroll('left')}
          aria-label="Précédent"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
      
      <div 
        className="carousel-wrapper" 
        ref={scrollRef}
        onScroll={checkScroll}
      >
        <div className="carousel-track">
          {appartements.map(appartement => (
            <div key={appartement.id} className="carousel-item">
              <AppartementCard appartement={appartement} />
            </div>
          ))}
        </div>
      </div>

      {canScrollRight && (
        <button 
          className="carousel-arrow carousel-arrow-right"
          onClick={() => scroll('right')}
          aria-label="Suivant"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
    </div>
  );
};

export default AppartementCarousel;
