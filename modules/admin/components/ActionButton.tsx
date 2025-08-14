import React from 'react';
import './ActionButton.css';

interface ActionButtonProps {
  color?: string;
  icon?: React.ComponentType<{ className?: string }>;
  text?: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  title?: string;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  id?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  color = '',
  icon: Icon,
  text,
  onClick,
  title = '',
  className = '',
  disabled = false,
  type = 'button',
  id,
}) => {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
    if (!disabled && onClick) {
      onClick(event);
    }
  };

  const getAriaLabel = (): string => {
    if (title) return title;
    if (typeof text === 'string') return text;
    return 'Ação';
  };

  return (
    <button
      id={id}
      type={type}
      className={`action-button ${color} ${className}`.trim()}
      onClick={handleClick}
      title={title}
      disabled={disabled}
      aria-label={getAriaLabel()}
    >
      {Icon && <Icon className="button-icon" />}
      {text && <div className="button-text">{text}</div>}
    </button>
  );
};

export default ActionButton;
