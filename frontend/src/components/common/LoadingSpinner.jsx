import React from 'react';

const LoadingSpinner = ({ size = 'md', fullPage = false }) => {
  const spinnerClass = `spinner ${size === 'sm' ? 'spinner-sm' : ''} ${size === 'lg' ? 'spinner-lg' : ''}`;

  if (fullPage) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        width: '100%',
      }}>
        <div className={spinnerClass} />
      </div>
    );
  }

  return <div className={spinnerClass} />;
};

export default LoadingSpinner;