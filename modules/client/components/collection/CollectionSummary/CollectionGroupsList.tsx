import React from 'react';
import { CollectionGroupsListProps } from '../types';
import CollectionGroupItem from './CollectionGroupItem';

const CollectionGroupsList: React.FC<CollectionGroupsListProps> = ({
  groups,
  onRescheduleClick,
}) => {
  if (groups.length === 0) {
    return <> no momento não há sugestões pendentes.</>;
  }

  return (
    <>
      {groups.map(group => (
        <CollectionGroupItem
          key={group.addressId}
          group={group}
          onRescheduleClick={onRescheduleClick}
        />
      ))}
    </>
  );
};

export default CollectionGroupsList;
