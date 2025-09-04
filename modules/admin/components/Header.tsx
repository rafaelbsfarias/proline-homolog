'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Header.module.css';
import { useAuthService } from '../../common/services/AuthService';
import { useToast } from '@/modules/common/components/ToastProvider';
import SettingsButton from '@/modules/common/components/SettingsButton';
import ChangePasswordModal from '@/modules/common/components/ChangePasswordModal/ChangePasswordModal';
import { LuLogOut } from 'react-icons/lu';

const Header: React.FC = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const authService = useAuthService();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    const result = await authService.logout();
    setIsLoggingOut(false);
    if (result.success) {
      router.push('/');
    } else {
      showToast('error', 'Erro ao fazer logout. Tente novamente.');
    }
  };

  const handleConfirmChangePassword = async (newPassword: string) => {
    // The onConfirm prop in ChangePasswordModal is expected to throw on error
    const result = await authService.updatePassword(newPassword);
    if (!result.success) {
      throw new Error(result.error || 'Erro ao alterar senha.');
    }
  };

  const handleLogoClick = () => {
    router.push('/dashboard');
  };

  return (
    <>
      <header className={styles.adminHeader}>
        <div className={styles.headerLeft}>
          <img
            src="/assets/images/logo-proline.png"
            alt="ProLine"
            className={styles.logoImg}
            onClick={handleLogoClick}
          />
        </div>
        <div className={styles.headerRight}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SettingsButton onOpenChangePasswordModal={() => setShowChangePasswordModal(true)} />
            <a
              href="#"
              onClick={handleLogout}
              className={`${styles.logoutLink} ${styles.desktopOnly}`}
            >
              Sair
              <LuLogOut />
            </a>
          </div>
        </div>
      </header>
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        onConfirm={handleConfirmChangePassword}
      />
    </>
  );
};

export default Header;
