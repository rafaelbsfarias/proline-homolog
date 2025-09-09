import { SupabaseClient } from '@supabase/supabase-js';
import { getLogger } from '@/modules/logger';
import { STATUS } from '@/modules/common/constants/status';
import { formatAddressLabel } from '@/modules/common/utils/address';

const logger = getLogger('services:collection-proposal');

export interface VehicleData {
  id: string;
  status: string;
  estimated_arrival_date?: string;
}

export interface AddressData {
  street: string;
  number: string;
  city: string;
}

export interface CollectionProposalParams {
  userId: string;
  addressId: string;
  adminClient: SupabaseClient;
}

export interface CollectionProposalResult {
  success: boolean;
  error?: string;
  vehicles?: VehicleData[];
  address?: AddressData;
}

export class CollectionProposalService {
  private static instance: CollectionProposalService;

  static getInstance(): CollectionProposalService {
    if (!CollectionProposalService.instance) {
      CollectionProposalService.instance = new CollectionProposalService();
    }
    return CollectionProposalService.instance;
  }

  /**
   * Busca veículos aguardando aprovação para um endereço específico
   */
  async findVehiclesAwaitingApproval({
    userId,
    addressId,
    adminClient,
  }: CollectionProposalParams): Promise<CollectionProposalResult> {
    try {
      const { data: vehicles, error: vehErr } = await adminClient
        .from('vehicles')
        .select('id, status, estimated_arrival_date')
        .eq('client_id', userId)
        .eq('pickup_address_id', addressId)
        .in('status', [STATUS.AGUARDANDO_APROVACAO, STATUS.SOLICITACAO_MUDANCA_DATA]);

      if (vehErr) {
        logger.error('find-vehicles-error', { error: vehErr.message });
        return { success: false, error: 'Erro ao buscar veículos' };
      }

      if (!vehicles || vehicles.length === 0) {
        return { success: false, error: 'Nenhum veículo encontrado para este endereço' };
      }

      return { success: true, vehicles };
    } catch (error) {
      logger.error('find-vehicles-unhandled', { error: (error as Error).message });
      return { success: false, error: 'Erro interno ao buscar veículos' };
    }
  }

  /**
   * Busca informações do endereço
   */
  async findAddress({
    addressId,
    adminClient,
  }: Pick<
    CollectionProposalParams,
    'addressId' | 'adminClient'
  >): Promise<CollectionProposalResult> {
    try {
      const { data: address } = await adminClient
        .from('addresses')
        .select('street, number, city')
        .eq('id', addressId)
        .maybeSingle();

      return { success: true, address: address || undefined };
    } catch (error) {
      logger.error('find-address-unhandled', { error: (error as Error).message });
      return { success: false, error: 'Erro interno ao buscar endereço' };
    }
  }

  /**
   * Atualiza status dos veículos para aguardando coleta (aceitação)
   */
  async acceptProposal({
    userId,
    addressId,
    adminClient,
  }: CollectionProposalParams): Promise<CollectionProposalResult> {
    try {
      // 1) Se foi uma proposta do ADMIN (veículos em SOLICITACAO_MUDANCA_DATA),
      // a aceitação do cliente move para AGUARDANDO_APROVACAO (fluxo de aprovação geral).
      const { error: updAdminProposalErr } = await adminClient
        .from('vehicles')
        .update({ status: STATUS.AGUARDANDO_APROVACAO })
        .eq('client_id', userId)
        .eq('pickup_address_id', addressId)
        .eq('status', STATUS.SOLICITACAO_MUDANCA_DATA);
      if (updAdminProposalErr) {
        logger.error('accept-from-admin-proposal-update-error', {
          error: updAdminProposalErr.message,
        });
        return { success: false, error: 'Erro ao atualizar status (proposta do admin)' };
      }

      // 2) Se já estávamos em AGUARDANDO_APROVACAO (fluxo final), avançar para AGUARDANDO_COLETA
      const { error: updFinalApprovalErr } = await adminClient
        .from('vehicles')
        .update({ status: STATUS.AGUARDANDO_COLETA })
        .eq('client_id', userId)
        .eq('pickup_address_id', addressId)
        .eq('status', STATUS.AGUARDANDO_APROVACAO);
      if (updFinalApprovalErr) {
        logger.error('accept-final-approval-update-error', {
          error: updFinalApprovalErr.message,
        });
        return { success: false, error: 'Erro ao atualizar status (aprovação final)' };
      }

      return { success: true };
    } catch (error) {
      logger.error('accept-proposal-unhandled', { error: (error as Error).message });
      return { success: false, error: 'Erro interno ao aceitar proposta' };
    }
  }

  /**
   * Reverte status dos veículos para solicitação de mudança (rejeição)
   */
  async rejectProposal({
    userId,
    addressId,
    adminClient,
  }: CollectionProposalParams): Promise<CollectionProposalResult> {
    try {
      // Primeiro buscar os veículos para obter a data original
      const vehiclesResult = await this.findVehiclesAwaitingApproval({
        userId,
        addressId,
        adminClient,
      });

      if (!vehiclesResult.success || !vehiclesResult.vehicles) {
        return vehiclesResult;
      }

      const originalDate = vehiclesResult.vehicles[0]?.estimated_arrival_date;

      const { error: updateErr } = await adminClient
        .from('vehicles')
        .update({
          status: STATUS.SOLICITACAO_MUDANCA_DATA,
          estimated_arrival_date: originalDate,
        })
        .eq('client_id', userId)
        .eq('pickup_address_id', addressId)
        .eq('status', STATUS.AGUARDANDO_APROVACAO);

      if (updateErr) {
        logger.error('reject-vehicles-update-error', { error: updateErr.message });
        return { success: false, error: 'Erro ao atualizar status dos veículos' };
      }

      return { success: true };
    } catch (error) {
      logger.error('reject-proposal-unhandled', { error: (error as Error).message });
      return { success: false, error: 'Erro interno ao rejeitar proposta' };
    }
  }

  /**
   * Atualiza o status da coleta ou remove a coleta
   */
  async updateCollectionStatus({
    userId,
    address,
    adminClient,
    newStatus,
  }: CollectionProposalParams & { address?: AddressData; newStatus: string }): Promise<void> {
    if (!address) return;

    try {
      const addressLabel = formatAddressLabel(address);

      if (newStatus === 'delete') {
        // Remover a coleta
        const { error: collectionErr } = await adminClient
          .from('vehicle_collections')
          .delete()
          .eq('client_id', userId)
          .eq('collection_address', addressLabel)
          .eq('status', STATUS.REQUESTED);

        if (collectionErr) {
          logger.warn('collection-delete-error', { error: collectionErr.message });
        }
      } else {
        // Atualizar status da coleta
        const { error: collectionErr } = await adminClient
          .from('vehicle_collections')
          .update({ status: newStatus })
          .eq('client_id', userId)
          .eq('collection_address', addressLabel)
          .eq('status', STATUS.REQUESTED);

        if (collectionErr) {
          logger.warn('collection-update-error', { error: collectionErr.message });
        }
      }
    } catch (error) {
      logger.error('update-collection-status-unhandled', { error: (error as Error).message });
    }
  }
}
