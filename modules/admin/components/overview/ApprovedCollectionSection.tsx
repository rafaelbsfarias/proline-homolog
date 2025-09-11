import React from 'react';
import { ApprovedCollectionGroup } from '@/modules/admin/services/client-collections/types';
import AddressGroupsTableSection from './AddressGroupsTableSection';

interface Props {
  groups: ApprovedCollectionGroup[];
  total?: number;
}

const ApprovedCollectionSection: React.FC<Props> = ({ groups, total = 0 }) => {
  return (
    <AddressGroupsTableSection
      title="Coletas aprovadas"
      groups={groups}
      total={total}
      totalLabel="Total aprovado"
    />
  );
};

export default ApprovedCollectionSection;
