import { useRouter } from 'next/navigation';
import { AnomalyEvidence } from '../types';

interface UseDynamicChecklistSaveProps {
  saveChecklist: () => Promise<void>;
  saveAnomalies: (anomalies: AnomalyEvidence[]) => Promise<void>;
}

export const useDynamicChecklistSave = ({
  saveChecklist,
  saveAnomalies,
}: UseDynamicChecklistSaveProps) => {
  const router = useRouter();

  const save = async (anomalies: AnomalyEvidence[]) => {
    try {
      // Persistir checklist técnico para habilitar edição de orçamento
      await saveChecklist();

      // Salvar anomalias
      await saveAnomalies(anomalies);

      // Voltar ao dashboard após salvar
      router.push('/dashboard');
    } catch (error) {
      // Erro já é tratado pelo hook
      throw error;
    }
  };

  return { save };
};
