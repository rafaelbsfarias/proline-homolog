import React from 'react';
import styles from './Pagination.module.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  currentItemsCount: number; // quantidade de itens na página atual
}

const ITEMS_PER_PAGE = 10;

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  currentItemsCount,
}) => {
  if (totalPages <= 1) {
    return null; // Oculta paginacao se só uma página
  }

  const disableNavigation = currentItemsCount < ITEMS_PER_PAGE;

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
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages || disableNavigation}
        className={styles.button}
      >
        Próxima
      </button>
    </div>
  );
};

export default Pagination;
