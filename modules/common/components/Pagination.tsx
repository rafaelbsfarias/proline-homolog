import React from 'react';
import styles from './Pagination.module.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) {
    return null; // Don't render pagination if there's only one page
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className={styles.paginationContainer}>
      <button onClick={handlePrevious} disabled={currentPage === 1} className={styles.button}>
        Anterior
      </button>
      <span className={styles.pageInfo}>
        Página {currentPage} de {totalPages}
      </span>
      <button onClick={handleNext} disabled={currentPage === totalPages} className={styles.button}>
        Próxima
      </button>
    </div>
  );
};

export default Pagination;
