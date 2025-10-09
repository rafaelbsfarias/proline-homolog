'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LuArrowLeft } from 'react-icons/lu';
import styles from './PendingDelegationsList.module.css';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { translateServiceCategory } from '@/app/constants/messages';
import Header from '../Header';
import { SolidButton } from '@/modules/common/components/SolidButton/SolidButton';
import { IconButton } from '@/modules/common/components/IconButton/IconButton';
import DelegateServicesModal from '../DelegateServicesModal/DelegateServicesModal';
import { Loading } from '@/modules/common/components/Loading/Loading';
import BaseTable from '@/modules/common/components/BaseTable/BaseTable';

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

  const columns = [
    {
      key: 'plate',
      label: 'Placa',
    },
    {
      key: 'services',
      label: 'Serviços',
      render: (services: string[]) => services.map(translateServiceCategory).join(', '),
    },
    {
      key: 'inspection_id',
      label: 'ID da Inspeção',
    },
    {
      key: 'actions',
      label: 'Ações',
      align: 'center' as const,
      render: (_: any, row: PendingChecklist) => (
        <SolidButton
          onClick={() => handleOpenDelegateModal(row.inspection_id, row.services)}
          className={styles.approveButton}
        >
          Delegar Serviços
        </SolidButton>
      ),
    },
  ];

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
        <div className="flex items-center mb-8">
          <IconButton
            onClick={() => router.back()}
            title="Voltar"
            icon={<LuArrowLeft size={20} />}
            className="mr-4"
          >
            Voltar
          </IconButton>
        </div>

        {checklists.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Nenhuma delegação de serviço pendente no momento.</p>
          </div>
        ) : (
          <div className={styles.cardContainer}>
            <h2 className={styles.cardTitle}>Lista de Delegações Pendentes</h2>
            <div className={styles.tableContainer}>
              <BaseTable data={checklists} columns={columns} getRowKey={row => row.inspection_id} />
            </div>
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
