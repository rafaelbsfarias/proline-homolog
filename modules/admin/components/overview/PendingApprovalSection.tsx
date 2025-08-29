import React from 'react';
import { PendingApprovalGroup } from '@/modules/admin/hooks/useClientOverview';
import AddressGroupsTableSection from './AddressGroupsTableSection';

interface Props {
  groups: PendingApprovalGroup[];
  total?: number;
}

const PendingApprovalSection: React.FC<Props> = ({ groups, total = 0 }) => {
  return (
    <AddressGroupsTableSection
      title="Resumo da coleta (aguardando aprovação)"
      groups={groups}
      total={total}
      totalLabel="Total geral da coleta"
    />
  );
};

export default PendingApprovalSection;
