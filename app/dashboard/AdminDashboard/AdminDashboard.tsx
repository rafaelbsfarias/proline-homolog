import {
  Header,
  Toolbar,
  PendingRegistrationsCounter,
  PendingQuotesCounter,
  VehiclesPendingApprovalCounter,
  UsersCounter,
  DataPanel,
  VehiclesCounter,
  PartnersCard,
  PendingChecklistAnalysisCounter,
  RequestedPartsCounter, // Add the new component
  GeneralFinancialSummaryButton,
} from '@/modules/admin/components';

import styles from './AdminDashboard.module.css';
import { useEffect, useState } from 'react';
import { supabase } from '@/modules/common/services/supabaseClient';
import { Loading } from '@/modules/common/components/Loading/Loading';

interface UserData {
  name?: string;
}

const AdminDashboard: React.FC = () => {
  const [user, setUser] = useState<UserData | null>(null);

  // Loading states
  const [userLoading, setUserLoading] = useState(true);
  const [pendingRegLoading, setPendingRegLoading] = useState(true);
  const [requestedPartsLoading, setRequestedPartsLoading] = useState(true); // New loading state for requested parts
  const [usersCounterLoading, setUsersCounterLoading] = useState(true);
  const [vehiclesCounterLoading, setVehiclesCounterLoading] = useState(true);
  const [dataPanelLoading, setDataPanelLoading] = useState(true);
  const [partnersCardLoading, setPartnersCardLoading] = useState(false);

  const showOverallLoader =
    userLoading ||
    pendingRegLoading ||
    requestedPartsLoading || // Add requested parts to overall loader
    usersCounterLoading ||
    vehiclesCounterLoading ||
    dataPanelLoading ||
    partnersCardLoading;

  useEffect(() => {
    async function fetchUser() {
      // No need to set userLoading(true) here as it's the initial state
      const {
        data: { user: supabaseUser },
      } = await supabase.auth.getUser();

      if (supabaseUser) {
        setUser({
          name: supabaseUser.user_metadata?.full_name || '',
        });
      }
      setUserLoading(false);
    }

    fetchUser();
  }, []);

  return (
    <div className={styles.adminDashboardLayout}>
      <Header />

      {showOverallLoader && <Loading />}

      <div
        style={{
          visibility: showOverallLoader ? 'hidden' : 'visible',
          background: '#F0F2F5',
          width: '100%',
          padding: '32px 0 0 0',
          minHeight: 80,
        }}
      >
        <div className={styles.welcomeContainer}>
          <div style={{ fontSize: '1.2rem', fontWeight: 500, color: '#222', marginBottom: '4px' }}>
            Bem-vindo,{' '}
            <span style={{ color: '#072e4c', fontWeight: 600 }}>{(user as any)?.name || ''}</span>
          </div>
        </div>
      </div>
      <div
        style={{
          visibility: showOverallLoader ? 'hidden' : 'visible',
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
          visibility: showOverallLoader ? 'hidden' : 'visible',
          background: 'transparent',
          width: '100%',
          margin: '0 auto',
          padding: '0 0 32px 0',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
          <div className={styles.countersRow}>
            <GeneralFinancialSummaryButton />
            <PendingChecklistAnalysisCounter />
            <PendingRegistrationsCounter onLoadingChange={setPendingRegLoading} />
            <PendingQuotesCounter onLoadingChange={setPendingRegLoading} />
            <RequestedPartsCounter onLoadingChange={setRequestedPartsLoading} />
            <VehiclesPendingApprovalCounter onLoadingChange={setVehiclesCounterLoading} />
            <UsersCounter onLoadingChange={setUsersCounterLoading} />
            <VehiclesCounter onLoadingChange={setVehiclesCounterLoading} />
          </div>
        </div>
      </div>
      <div style={{ visibility: showOverallLoader ? 'hidden' : 'visible' }}>
        <DataPanel onLoadingChange={setDataPanelLoading} />
      </div>
      <div style={{ visibility: showOverallLoader ? 'hidden' : 'visible' }}>
        <PartnersCard onLoadingChange={setPartnersCardLoading} />
      </div>
    </div>
  );
};

export default AdminDashboard;
