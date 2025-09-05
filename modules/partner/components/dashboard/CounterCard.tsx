import React from 'react';

interface CounterCardProps {
  title: string;
  count: number;
}

const CounterCard: React.FC<CounterCardProps> = ({ title, count }) => {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
        padding: '20px 22px',
        textAlign: 'center',
        flex: 1,
        margin: '0 10px',
      }}
    >
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#333' }}>{count}</h2>
      <p style={{ color: '#666' }}>{title}</p>
    </div>
  );
};

export default CounterCard;
