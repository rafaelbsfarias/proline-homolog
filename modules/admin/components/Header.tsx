'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Header.module.css';
import { useAuthService } from '../../common/services/AuthService';
import { useToast } from '@/modules/common/components/ToastProvider';
import SettingsButton from '@/modules/common/components/SettingsButton';
import ChangePasswordModal from '@/modules/common/components/ChangePasswordModal';

const Header: React.FC = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const authService = useAuthService();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);

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

  const handleChangePassword = () => {
    setShowChangePasswordModal(true);
  };

  const handleConfirmChangePassword = async (newPassword: string) => {
    setChangePasswordLoading(true);
    setChangePasswordError(null);
    try {
      const result = await authService.updatePassword(newPassword);
      if (result.success) {
        showToast('success', 'Senha alterada com sucesso!');
        setShowChangePasswordModal(false);
      } else {
        setChangePasswordError(result.error || 'Erro ao alterar senha.');
      }
    } catch (err) {
      setChangePasswordError(
        err instanceof Error ? err.message : 'Erro inesperado ao alterar senha.'
      );
    } finally {
      setChangePasswordLoading(false);
    }
  };

  return (
    <>
      <header className={styles.adminHeader}>
        <div className={styles.headerLeft}>
          <img src="/assets/images/logo-proline.png" alt="ProLine" className={styles.logoImg} />
        </div>
        <div className={styles.headerRight}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SettingsButton onOpenChangePasswordModal={handleChangePassword} />
            <a
              href="#"
              onClick={handleLogout}
              className={`${styles.logoutLink} ${styles.desktopOnly}`}
            >
              Sair
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="#002e4c"
                className="bi bi-box-arrow-right"
                viewBox="0 0 16 16"
              >
                <path
                  fillRule="evenodd"
                  d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z"
                />
                <path
                  fillRule="evenodd"
                  d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"
                />
              </svg>
            </a>
          </div>
        </div>
      </header>
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        onConfirm={handleConfirmChangePassword}
        loading={changePasswordLoading}
        error={changePasswordError}
      />
    </>
  );
};

export default Header;
