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

const logger = getLogger('DelegateServicesModal');

interface DelegateServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspectionId: string | null;
  inspectionServices: string[];
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
  serviceCategoryKey: string; // This is the key (e.g., 'mechanics')
  serviceCategoryId: string; // The UUID
  partnerId: string | null;
  priority: number;
  is_parallel: boolean;
}

const DelegateServicesModal: React.FC<DelegateServicesModalProps> = ({
  isOpen,
  onClose,
  inspectionId,
  inspectionServices, // These are service keys
}) => {
  const { get, post } = useAuthenticatedFetch();
  const [partnersByCategory, setPartnersByCategory] = useState<Record<string, Partner[]>>({});
  const [delegationForms, setDelegationForms] = useState<ServiceDelegationForm[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setPartnersByCategory({});
      setDelegationForms([]);
      setServiceCategories([]);
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
          logger.error('Nenhuma categoria de serviço encontrada ou falha na resposta da API.');
          setError('Erro ao carregar categorias de serviço.');
          setLoadingPartners(false);
          return;
        }

        setServiceCategories(categoriesData);

        const initialForms: ServiceDelegationForm[] = inspectionServices.map(serviceKey => {
          const category = categoriesData.find(sc => sc.key === serviceKey);
          if (!category) {
            logger.warn(`Service category key '${serviceKey}' não encontrada.`);
          }
          return {
            serviceCategoryKey: serviceKey,
            serviceCategoryId: category?.id || '',
            partnerId: null,
            priority: 0,
            is_parallel: false, // Initialize here
          };
        });
        setDelegationForms(initialForms);

        const newPartnersByCategory: Record<string, Partner[]> = {};

        for (const form of initialForms) {
          try {
            const partnerResponse = await get(
              `/api/admin/partners-by-service-category?category=${form.serviceCategoryKey}`
            );
            const partners: Partner[] = Array.isArray(partnerResponse.data)
              ? partnerResponse.data
              : [];
            newPartnersByCategory[form.serviceCategoryKey] = partners;
          } catch (e) {
            logger.error(`Erro ao buscar parceiros para ${form.serviceCategoryKey}:`, e);
            newPartnersByCategory[form.serviceCategoryKey] = [];
          }
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
      for (const form of delegationForms) {
        if (!form.partnerId) {
          setError(
            `Por favor, selecione um parceiro para o serviço ${translateServiceCategory(form.serviceCategoryKey)}.`
          );
          setSubmitting(false);
          return;
        }
        if (!form.serviceCategoryId) {
          setError(
            `ID da categoria de serviço não encontrado para ${translateServiceCategory(form.serviceCategoryKey)}.`
          );
          setSubmitting(false);
          return;
        }

        const payload = delegationForms.map(form => ({
          inspection_id: inspectionId,
          service_category_id: form.serviceCategoryId,
          partner_id: form.partnerId,
          is_parallel: form.is_parallel,
          priority: form.priority,
        }));

        logger.info('Payload completo:', payload);

        const response = await post('/api/admin/delegate-service', {
          body: JSON.stringify(payload),
        });

        if (response.error) {
          throw new Error(response.error);
        }
      }
      logger.info(`Delegation for inspection ${inspectionId} submitted successfully.`);
      onClose(); // Close modal on success
    } catch (e) {
      logger.error(`Error submitting delegation for inspection ${inspectionId}:`, e);
      setError(`Erro ao delegar serviços: ${(e as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
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
                    onChange={(e: any) =>
                      handleFormChange(index, 'partnerId', e.target.value || null)
                    }
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
  );
};

export default DelegateServicesModal;
