'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LuArrowLeft } from 'react-icons/lu';
import styles from './PendingDelegationsList.module.css';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { translateServiceCategory } from '@/app/constants/messages';
import Header from '../Header';
import { SolidButton } from '@/modules/common/components/SolidButton/SolidButton';
import { OutlineButton } from '@/modules/common/components/OutlineButton/OutlineButton';
import DelegateServicesModal from '../DelegateServicesModal/DelegateServicesModal';
import { Loading } from '@/modules/common/components/Loading/Loading';

interface PendingChecklist {
  inspection_id: string;
  plate: string;
  services: string[];
}

const PendingDelegationsList = () => {
  const [checklists, setChecklists] = useState<PendingChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { get } = useAuthenticatedFetch();
  const router = useRouter();

  const [isDelegateModalOpen, setIsDelegateModalOpen] = useState(false);
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null);
  const [selectedInspectionServices, setSelectedInspectionServices] = useState<string[]>([]);

  const fetchPendingChecklists = async () => {
    try {
      setLoading(true);
      const response = await get<PendingChecklist[]>('/api/admin/pending-checklist-reviews');
      if (response.error) throw new Error(`Erro ao buscar delegações: ${response.error}`);
      setChecklists(response.data || []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingChecklists();
  }, [get]);

  const handleOpenDelegateModal = (inspectionId: string, services: string[]) => {
    setSelectedInspectionId(inspectionId);
    setSelectedInspectionServices(services);
    setIsDelegateModalOpen(true);
  };

  const handleCloseDelegateModal = () => {
    setIsDelegateModalOpen(false);
    setSelectedInspectionId(null);
    setSelectedInspectionServices([]);
  };

  if (loading)
    return (
      <>
        <Header />
        <Loading />
      </>
    );
  if (error)
    return (
      <>
        <Header />
        <div className={styles.error}>{error}</div>
      </>
    );

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className="flex items-center mb-4">
          <OutlineButton
            onClick={() => router.back()}
            title="Voltar"
            className="mr-4 flex items-center gap-1"
          >
            <LuArrowLeft size={20} /> Voltar
          </OutlineButton>
          <h1 className="text-xl font-bold">Delegação de Serviços Pendentes</h1>
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
                    <td>{checklist.services.map(translateServiceCategory).join(', ')}</td>
                    <td>{checklist.inspection_id}</td>
                    <td>
                      <SolidButton
                        onClick={() =>
                          handleOpenDelegateModal(checklist.inspection_id, checklist.services)
                        }
                        className={styles.approveButton}
                      >
                        Delegar Serviços
                      </SolidButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedInspectionId && (
        <DelegateServicesModal
          isOpen={isDelegateModalOpen}
          onClose={handleCloseDelegateModal}
          inspectionId={selectedInspectionId}
          inspectionServices={selectedInspectionServices}
          onSuccess={fetchPendingChecklists}
        />
      )}
    </>
  );
};

export default PendingDelegationsList;
