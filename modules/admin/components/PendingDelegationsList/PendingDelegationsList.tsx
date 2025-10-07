'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Import useRouter
import { LuArrowLeft } from 'react-icons/lu'; // Import LuArrowLeft icon
import styles from './PendingDelegationsList.module.css'; // Using new styles
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { translateServiceCategory } from '@/app/constants/messages'; // Import translation utility
import Header from '../Header'; // Import Header component
// import ActionButton from '../ActionButton'; // Removed ActionButton import
import { SolidButton } from '@/modules/common/components/SolidButton/SolidButton'; // Import SolidButton component

interface PendingChecklist {
  inspection_id: string;
  plate: string;
  services: string[]; // Array of categories
}

const PendingDelegationsList = () => {
  const [checklists, setChecklists] = useState<PendingChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { get } = useAuthenticatedFetch();
  const router = useRouter(); // Initialize useRouter

  useEffect(() => {
    const fetchPendingChecklists = async () => {
      try {
        setLoading(true);
        const response = await get<PendingChecklist[]>('/api/admin/pending-checklist-reviews');

        if (response.error) {
          throw new Error(`Erro ao buscar delegações: ${response.error}`);
        }

        setChecklists(response.data || []);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingChecklists();
  }, [get]);

  if (loading) {
    return (
      <>
        <Header />
        <div className={styles.loading}>Carregando...</div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className={styles.error}>{error}</div>
      </>
    );
  }

  return (
    <>
      <Header /> {/* Add Header component outside the container */}
      <div className={styles.container}>
        <div className="flex items-center mb-4">
          {' '}
          {/* Flex container for back button and title */}
          {/*  <SolidButton
            onClick={() => router.back()}
            title="Voltar"
            className="mr-4 flex items-center gap-1" // Add some margin to the right and flex for icon/text
          >
          </SolidButton> */}
          <h1 className="text-xl font-bold">Delegação de Serviços Pendentes</h1>{' '}
          {/* Adjusted title size */}
        </div>
        {checklists.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Nenhuma delegação de serviço pendente no momento.</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Placa</th>
                  <th>Serviços</th>
                  <th>ID da Inspeção</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {checklists.map(checklist => (
                  <tr key={checklist.inspection_id} className={styles.tableRow}>
                    <td>{checklist.plate}</td>
                    <td>{checklist.services.map(translateServiceCategory).join(', ')}</td>{' '}
                    {/* Translated services */}
                    <td>{checklist.inspection_id}</td>
                    <td>
                      <Link href={`/admin/delegate-services/${checklist.inspection_id}`}>
                        <button className={styles.approveButton}>Delegar Serviços</button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default PendingDelegationsList;
