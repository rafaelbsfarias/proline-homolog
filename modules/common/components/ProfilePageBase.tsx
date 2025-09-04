'use client';
import React, { useState } from 'react';
import styles from './ProfilePageBase.module.css';
import ChangePasswordModal from '@/modules/common/components/ChangePasswordModal/ChangePasswordModal';

type Role = 'client' | 'partner' | 'specialist' | 'admin';

interface Props {
  fullName: string;
  email: string;
  role: Role;
  showAddresses?: boolean;
  addressesNode?: React.ReactNode;
  addressesActionsNode?: React.ReactNode;
}

export default function ProfilePageBase({
  fullName,
  email,
  role,
  showAddresses,
  addressesNode,
  addressesActionsNode,
}: Props) {
  const [openChangePassword, setOpenChangePassword] = useState(false);

  const handleConfirmPassword = async (newPassword: string) => {
    // The onConfirm prop in ChangePasswordModal is expected to throw on error
    const { supabase } = await import('@/modules/common/services/supabaseClient');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      throw new Error(error.message || 'Erro ao alterar senha');
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Meu Perfil</h1>
          <button onClick={() => setOpenChangePassword(true)} className={styles.changeBtn}>
            Alterar Senha
          </button>
        </div>
        <div className={styles.infoGrid}>
          <div>
            <div className={styles.label}>Nome completo</div>
            <div className={styles.value}>{fullName || '-'}</div>
          </div>
          <div>
            <div className={styles.label}>E-mail</div>
            <div className={styles.value}>{email || '-'}</div>
          </div>
          {/* Papel oculto para todas as roles */}
        </div>
      </div>

      {showAddresses && (
        <div className={styles.addressesSection}>
          <div className={styles.addressesHeader}>
            <h2 className={styles.addressesTitle}>Endereços</h2>
            <div>{addressesActionsNode}</div>
          </div>
          {addressesNode}
        </div>
      )}

      <ChangePasswordModal
        isOpen={openChangePassword}
        onClose={() => setOpenChangePassword(false)}
        onConfirm={handleConfirmPassword}
      />
    </main>
  );
}
