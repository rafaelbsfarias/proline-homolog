import { ServiceWithEvidences } from '../types';

export const validateCanFinalize = (services: ServiceWithEvidences[]) => {
  const servicesWithoutEvidences = services.filter(s => s.evidences.length === 0);
  const servicesNotCompleted = services.filter(s => !s.completed_at);

  return {
    canFinalize: servicesWithoutEvidences.length === 0 && servicesNotCompleted.length === 0,
    servicesWithoutEvidences,
    servicesNotCompleted,
  };
};

export const getValidationMessage = (
  servicesWithoutEvidences: ServiceWithEvidences[],
  servicesNotCompleted: ServiceWithEvidences[]
): string => {
  if (servicesWithoutEvidences.length > 0) {
    const names = servicesWithoutEvidences.map(s => `"${s.description}"`).join(', ');
    return `❌ Não é possível finalizar: os seguintes serviços não possuem evidências: ${names}`;
  }

  if (servicesNotCompleted.length > 0) {
    const names = servicesNotCompleted.map(s => `"${s.description}"`).join(', ');
    return `❌ Não é possível finalizar: os seguintes serviços não foram marcados como concluídos: ${names}`;
  }

  return '';
};

export const getTooltipMessage = (
  servicesWithoutEvidences: ServiceWithEvidences[],
  servicesNotCompleted: ServiceWithEvidences[]
): string => {
  if (servicesWithoutEvidences.length > 0) {
    return `${servicesWithoutEvidences.length} serviço(s) sem evidências`;
  }
  if (servicesNotCompleted.length > 0) {
    return `${servicesNotCompleted.length} serviço(s) não concluído(s)`;
  }
  return '';
};
