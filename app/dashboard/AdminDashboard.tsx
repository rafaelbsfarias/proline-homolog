import {
  Header,
  Toolbar,
  PendingRegistrationsCounter,
  UsersCounter,
  DataPanel,
  VehiclesCounter,
} from '@/modules/admin/components';

import styles from './AdminDashboard.module.css';

interface UserData {
  name?: string;
}

const AdminDashboard: React.FC = () => {
  const user: UserData | null = null; // Placeholder temporário

  return (
    <div className={styles.adminDashboardLayout}>
      <Header />
      <div style={{ background: '#F0F2F5', width: '100%', padding: '32px 0 0 0', minHeight: 80 }}>
        <div className={styles.welcomeContainer}>
          <div style={{ fontSize: '1.2rem', fontWeight: 500, color: '#222', marginBottom: '4px' }}>
            Bem-vindo,{' '}
            <span style={{ color: '#072e4c', fontWeight: 600 }}>{(user as any)?.name || ''}</span>
          </div>
        </div>
      </div>
      <div
        style={{
          background: '#fff',
          width: '100%',
          margin: '0 auto',
          padding: '0 0 32px 0',
          marginBottom: 32,
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
          <Toolbar />
        </div>
      </div>
      <div
        style={{
          background: 'transparent',
          width: '100%',
          margin: '0 auto',
          padding: '0 0 32px 0',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
          <div className={styles.countersRow}>
            <PendingRegistrationsCounter />
            <UsersCounter />
            {<VehiclesCounter />}
          </div>
        </div>
      </div>
      <DataPanel />
    </div>
  );
};

export default AdminDashboard;
