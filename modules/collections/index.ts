// Barrel for collections domain: reexports current services without moving files
export { CollectionOrchestrator } from '@/modules/common/services/CollectionOrchestrator';
export { CollectionHistoryService } from '@/modules/common/services/CollectionHistoryService';
export { CollectionProposalService } from '@collections/client/services/CollectionProposalService';

// Note: admin group builders and helpers remain in their original paths for now.
// Upcoming PR-B will relocate them under modules/collections/{client,admin}/ with compat reexports.
