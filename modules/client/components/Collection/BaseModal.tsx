'use client';

import React from 'react';

interface BaseModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: number;
}

const BaseModal: React.FC<BaseModalProps> = ({
  open,
  onClose, // Provided for consistency, but closing is handled by child components
  title,
  children,
  maxWidth = 480,
}) => {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <div
        style={{
          background: '#fff',
          padding: 16,
          borderRadius: 8,
          width: '100%',
          maxWidth: maxWidth,
        }}
      >
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
};

export default BaseModal;
