import React from 'react';

interface ActionButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, children, disabled = false }) => {
  return (
    <button
      style={{
        background: '#002e4c',
        color: '#fff',
        fontWeight: 600,
        fontSize: '1rem',
        border: 0,
        borderRadius: 6,
        padding: '8px 16px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.7 : 1,
      }}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default ActionButton;
