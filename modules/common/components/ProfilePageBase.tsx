"use client";
import React from 'react';
import styles from './ProfilePageBase.module.css';
import ChangePasswordModal from '@/modules/common/components/ChangePasswordModal';

type Role = 'client' | 'partner' | 'specialist' | 'admin';

interface Props {
  fullName: string;
  email: string;
  role: Role;
  showAddresses?: boolean;
  addressesNode?: React.ReactNode;
  addressesActionsNode?: React.ReactNode;
}

export default function ProfilePageBase({ fullName, email, role, showAddresses, addressesNode, addressesActionsNode }: Props) {
  const [openChange, setOpenChange] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleConfirmPassword = async (newPassword: string) => {
    try {
      setLoading(true);
      setError(null);
      const { supabase } = await import('@/modules/common/services/supabaseClient');
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Meu Perfil</h1>
        <div className={styles.infoGrid}>
          <div>
            <div className={styles.label}>Nome completo</div>
            <div className={styles.value}>{fullName || '-'}</div>
          </div>
          <div>
            <div className={styles.label}>E-mail</div>
            <div className={styles.value}>{email || '-'}</div>
          </div>
          <div>
            <div className={styles.label}>Papel</div>
            <div className={styles.value}>{role}</div>
          </div>
          <div className={styles.actionsRight}>
            <button onClick={() => setOpenChange(true)} className={styles.changeBtn}>
              Alterar Senha
            </button>
          </div>
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
        isOpen={openChange}
        onClose={() => setOpenChange(false)}
        onConfirm={handleConfirmPassword}
        loading={loading}
        error={error}
      />
    </main>
  );
}
