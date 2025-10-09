'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/modules/common/components/Modal/Modal';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { translateServiceCategory } from '@/app/constants/messages';
import { SolidButton } from '@/modules/common/components/SolidButton/SolidButton';
import { OutlineButton } from '@/modules/common/components/OutlineButton/OutlineButton';
import { getLogger } from '@/modules/logger';
import styles from './DelegateServicesModal.module.css';
import Input from '@/modules/common/components/Input/Input';
import Select from '@/modules/common/components/Select/Select';
import Checkbox from '@/modules/common/components/Checkbox/Checkbox';
import Spinner from '@/modules/common/components/Spinner/Spinner';
import MessageModal from '@/modules/common/components/MessageModal/MessageModal';

const logger = getLogger('DelegateServicesModal');

// Interfaces
interface DelegateServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspectionId: string | null;
  inspectionServices: string[];
  onSuccess?: () => void;
}

interface Partner {
  id: string;
  company_name: string;
}

interface ServiceCategory {
  id: string;
  key: string;
  name: string;
}

interface ServiceDelegationForm {
  serviceCategoryKey: string;
  serviceCategoryId: string;
  partnerId: string | null;
  priority: number;
  is_parallel: boolean;
}

interface SubmissionResult {
  status: 'success' | 'error';
  message: string;
}

const DelegateServicesModal: React.FC<DelegateServicesModalProps> = ({
  isOpen,
  onClose,
  inspectionId,
  inspectionServices,
  onSuccess,
}) => {
  const { get, post } = useAuthenticatedFetch();
  const [partnersByCategory, setPartnersByCategory] = useState<Record<string, Partner[]>>({});
  const [delegationForms, setDelegationForms] = useState<ServiceDelegationForm[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPartnersByCategory({});
      setDelegationForms([]);
      setError(null);
      setSubmissionResult(null);
      setLoadingPartners(false);
      setSubmitting(false);
      return;
    }

    const fetchAllData = async () => {
      setLoadingPartners(true);
      setError(null);
      try {
        const response = await get<{ success: boolean; categories: ServiceCategory[] }>(
          '/api/admin/service-categories'
        );
        const categoriesData: ServiceCategory[] = response.data?.categories || [];
        if (!response.ok || !response.data?.success || categoriesData.length === 0) {
          throw new Error('Erro ao carregar categorias de serviço.');
        }

        const initialForms: ServiceDelegationForm[] = inspectionServices.map(serviceKey => {
          const category = categoriesData.find(sc => sc.key === serviceKey);
          return {
            serviceCategoryKey: serviceKey,
            serviceCategoryId: category?.id || '',
            partnerId: null,
            priority: 0,
            is_parallel: false,
          };
        });
        setDelegationForms(initialForms);

        const newPartnersByCategory: Record<string, Partner[]> = {};
        for (const form of initialForms) {
          const partnerResponse = await get(
            `/api/admin/partners-by-service-category?category=${form.serviceCategoryKey}`
          );
          newPartnersByCategory[form.serviceCategoryKey] = Array.isArray(partnerResponse.data)
            ? partnerResponse.data
            : [];
        }
        setPartnersByCategory(newPartnersByCategory);
      } catch (e) {
        logger.error('Erro ao buscar dados de delegação:', e);
        setError(`Erro ao carregar dados: ${(e as Error).message}`);
      } finally {
        setLoadingPartners(false);
      }
    };

    fetchAllData();
  }, [isOpen, inspectionServices, get]);

  const handleFormChange = (index: number, field: keyof ServiceDelegationForm, value: any) => {
    const updatedForms = [...delegationForms];
    updatedForms[index] = { ...updatedForms[index], [field]: value };
    setDelegationForms(updatedForms);
  };

  const handleSubmit = async () => {
    if (!inspectionId) return;
    setSubmitting(true);
    setError(null);

    try {
      // 1. Validações
      for (const form of delegationForms) {
        if (!form.partnerId) {
          throw new Error(
            `Selecione um parceiro para ${translateServiceCategory(form.serviceCategoryKey)}.`
          );
        }
        if (!form.serviceCategoryId) {
          throw new Error(
            `ID da categoria não encontrado para ${translateServiceCategory(form.serviceCategoryKey)}.`
          );
        }
      }

      const sequentialServices = delegationForms.filter(f => !f.is_parallel);
      const priorities = sequentialServices.map(f => f.priority);
      if (new Set(priorities).size < priorities.length) {
        throw new Error('Serviços sequenciais não podem ter a mesma prioridade.');
      }

      // 2. Monta payload
      const payload = delegationForms.map(f => ({
        inspection_id: inspectionId,
        service_category_id: f.serviceCategoryId,
        partner_id: f.partnerId,
        is_parallel: f.is_parallel,
        priority: f.priority,
      }));

      // 3. Faz POST com tipagem correta
      interface DelegateServiceResult {
        success: boolean;
        inspection_id: string;
        service_order_id?: string;
        partner_id?: string;
        quoteStatus?: 'submitted' | 'queued';
        message?: string;
      }

      interface DelegateServiceResponse {
        results: DelegateServiceResult[];
      }

      const response = await post<DelegateServiceResponse>('/api/admin/delegate-service', payload);

      const results = response.data?.results;
      if (!results || results.length === 0) {
        throw new Error('Nenhuma delegação foi processada.');
      }

      // 4. Verifica falhas
      const failed = results.filter(r => !r.success);
      if (failed.length > 0) {
        const messages = failed.map(r => r.message).join('; ');
        setSubmissionResult({ status: 'error', message: messages });
      } else {
        setSubmissionResult({ status: 'success', message: 'Serviços delegados com sucesso!' });
      }
    } catch (e: any) {
      setSubmissionResult({
        status: 'error',
        message: e.message || 'Erro desconhecido ao delegar.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseResultModal = () => {
    const isSuccess = submissionResult?.status === 'success';
    setSubmissionResult(null);
    if (isSuccess) {
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Delegar Serviços" size="lg">
        {loadingPartners ? (
          <div className={styles.loadingContainer}>
            <Spinner />
          </div>
        ) : error ? (
          <div className={styles.errorText}>{error}</div>
        ) : (
          <div className={styles.formSection}>
            {delegationForms.map((form, index) => (
              <div key={form.serviceCategoryKey} className={styles.serviceCard}>
                <h3 className={styles.serviceTitle}>
                  {translateServiceCategory(form.serviceCategoryKey)}
                </h3>
                <div className={styles.formGrid}>
                  <div>
                    <label htmlFor={`partner-${index}`} className={styles.label}>
                      Parceiro
                    </label>
                    <Select
                      id={`partner-${index}`}
                      name={`partner-${index}`}
                      className={styles.select}
                      value={form.partnerId || ''}
                      onChange={e => handleFormChange(index, 'partnerId', e.target.value || null)}
                      options={[
                        { value: '', label: 'Selecione um parceiro' },
                        ...(partnersByCategory[form.serviceCategoryKey]?.map(p => ({
                          value: p.id,
                          label: p.company_name,
                        })) || []),
                      ]}
                    />
                  </div>
                  <div>
                    <label htmlFor={`priority-${index}`} className={styles.label}>
                      Prioridade
                    </label>
                    <Input
                      type="number"
                      name="priority"
                      id={`priority-${index}`}
                      className={styles.input}
                      value={form.priority.toString()}
                      onChange={e =>
                        handleFormChange(index, 'priority', parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <Checkbox
                    id={`isParallel-${index}`}
                    name={`isParallel-${index}`}
                    label="Execução Paralela"
                    checked={form.is_parallel}
                    onChange={checked => handleFormChange(index, 'is_parallel', checked)}
                  />
                </div>
              </div>
            ))}
            <div className={styles.buttonGroup}>
              <OutlineButton onClick={onClose}>Cancelar</OutlineButton>
              <SolidButton onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Delegando...' : 'Delegar'}
              </SolidButton>
            </div>
          </div>
        )}
      </Modal>
      {submissionResult && (
        <MessageModal
          variant={submissionResult.status}
          message={submissionResult.message}
          onClose={handleCloseResultModal}
        />
      )}
    </>
  );
};

export default DelegateServicesModal;
