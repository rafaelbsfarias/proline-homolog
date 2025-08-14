'use client';

import React, { useState, useRef, useEffect } from 'react';
import { IoSettingsOutline } from 'react-icons/io5';
import './SettingsButton.css';

interface SettingsButtonProps {
  onOpenChangePasswordModal: () => void;
}

const SettingsButton: React.FC<SettingsButtonProps> = ({ onOpenChangePasswordModal }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggleDropdown = () => {
    setShowDropdown(prev => !prev);
  };

  const handleProfileClick = () => {
    window.location.href = '/meu-perfil';
    setShowDropdown(false);
  };

  const handleChangePasswordClick = () => {
    onOpenChangePasswordModal();
    setShowDropdown(false); // Close dropdown after clicking option
  };

  return (
    <div className="settings-button-container" ref={dropdownRef}>
      <button
        ref={buttonRef}
        className="settings-button"
        onClick={handleToggleDropdown}
        aria-label="Configurações"
      >
        <IoSettingsOutline className="settings-icon" />
      </button>

      {showDropdown && (
        <div className="settings-dropdown">
          <button className="dropdown-item" onClick={handleProfileClick}>
            Meu perfil
          </button>
          <button className="dropdown-item" onClick={handleChangePasswordClick}>
            Mudar minha senha
          </button>
        </div>
      )}
    </div>
  );
};

export default SettingsButton;
