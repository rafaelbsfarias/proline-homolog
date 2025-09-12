import { useState, useEffect, useCallback } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import type { Method, AddressItem, Vehicle } from '@/modules/client/types';

interface BulkCollectionInfo {
  addresses: AddressItem[];
  statusCounts: Record<string, number>;
  vehicles: Vehicle[];
}

interface UseBulkCollectionProps {
  onSuccess?: () => void;
}

export const useBulkCollection = ({ onSuccess }: UseBulkCollectionProps) => {
  const { get, post } = useAuthenticatedFetch();
  const [data, setData] = useState<BulkCollectionInfo>({
    addresses: [],
    statusCounts: {},
    vehicles: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [method, setMethod] = useState<Method>('collect_point');
  const [addressId, setAddressId] = useState('');
  const [eta, setEta] = useState('');
  const [modalOpen, setModalOpen] = useState<Method | null>(null);

  const refetch = useCallback(() => {
    const fetchInfo = async () => {
      setLoading(true);
      try {
        const response = await get<BulkCollectionInfo>('/api/client/bulk-collection-info');
        if (response.ok && response.data) {
          setData(response.data);
        } else {
          setError(response.error || 'Erro ao buscar informações para coleta em lote.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro de rede.');
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, [get]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleApply = useCallback(
    async (payload: {
      method: Method;
      vehicleIds: string[];
      addressId?: string;
      estimated_arrival_date?: string;
    }) => {
      const resp = await post('/api/client/set-vehicles-collection', payload);
      if (!resp.ok) throw new Error(resp.error || 'Erro ao aplicar alterações em lote.');
      if (onSuccess) {
        onSuccess();
      }
      refetch(); // Refetch data after applying changes
    },
    [post, onSuccess, refetch]
  );

  return {
    loading,
    error,
    addresses: data.addresses,
    statusCounts: data.statusCounts,
    allVehicles: data.vehicles,
    method,
    setMethod,
    addressId,
    setAddressId,
    eta,
    setEta,
    modalOpen,
    openModal: setModalOpen,
    closeModal: () => setModalOpen(null),
    handleApply,
  };
};
