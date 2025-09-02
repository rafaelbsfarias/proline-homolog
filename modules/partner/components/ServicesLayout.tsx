'use client';

import React from 'react';
import Header from '@/modules/admin/components/Header';

interface ServicesLayoutProps {
  children: React.ReactNode;
}

const ServicesLayout: React.FC<ServicesLayoutProps> = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header />
      <div style={{ display: 'flex' }}>
        {/* Placeholder para o Menu Lateral */}
        <aside
          style={{
            width: '240px',
            background: '#fff',
            borderRight: '1px solid #e0e0e0',
            padding: '24px',
          }}
        >
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#333' }}>Menu</h2>
          {/* Links do menu virão aqui */}
        </aside>

        {/* Conteúdo Principal */}
        <main style={{ flex: 1, padding: '48px' }}>{children}</main>
      </div>
    </div>
  );
};

export default ServicesLayout;
