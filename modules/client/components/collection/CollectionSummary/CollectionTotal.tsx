import React from 'react';
import { CollectionTotalProps } from '../types';

const CollectionTotal: React.FC<CollectionTotalProps> = ({ total, count }) => {
  return (
    <div style={{ marginTop: 8, fontWeight: 600 }}>
      {`Total a pagar (${count} veículo(s)): ${total.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      })}`}
    </div>
  );
};

export default CollectionTotal;
