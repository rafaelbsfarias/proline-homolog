import React from 'react';
import { formatQuoteStatus } from '@/modules/common/utils/format';

type Props = {
  status: string;
  className?: string;
};

// Exibe o status de orçamento em PT-BR, com formatação consistente
export const StatusLabel: React.FC<Props> = ({ status, className }) => {
  const label = formatQuoteStatus(status);
  return <span className={className}>{label}</span>;
};

export default StatusLabel;
