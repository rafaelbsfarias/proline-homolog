import { useState, useEffect, useCallback } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { AddressItem } from '@/modules/client/types';

interface UseAddressManagerResult {
  addresses: AddressItem[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createAddress: (
    addressData: Omit<AddressItem, 'id' | 'created_at'>
  ) => Promise<{ success: boolean; error?: string }>;
  updateAddress: (
    addressId: string,
    addressData: Partial<AddressItem>
  ) => Promise<{ success: boolean; error?: string }>;
  deleteAddress: (addressId: string) => Promise<{ success: boolean; error?: string }>;
}

export const useAddressManager = (): UseAddressManagerResult => {
  const { get, post, put, delete: del } = useAuthenticatedFetch();
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [triggerRefetch, setTriggerRefetch] = useState(0);

  const refetch = useCallback(() => {
    setTriggerRefetch(prev => prev + 1);
  }, []);

  useEffect(() => {
    const fetchAddresses = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await get<{ success: boolean; addresses: AddressItem[]; error?: string }>(
          '/api/client/addresses'
        );

        if (response.ok && response.data?.success) {
          setAddresses(response.data.addresses || []);
        } else {
          setError(response.data?.error || response.error || 'Erro ao buscar endereços');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro de rede ao buscar endereços');
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, [get, triggerRefetch]);

  const createAddress = async (addressData: Omit<AddressItem, 'id' | 'created_at'>) => {
    try {
      const response = await post<{ success: boolean; address?: AddressItem; error?: string }>(
        '/api/client/create-address',
        addressData
      );

      if (response.ok && response.data?.success) {
        refetch();
        return { success: true };
      } else {
        return {
          success: false,
          error: response.data?.error || response.error || 'Erro ao criar endereço',
        };
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro de rede ao criar endereço',
      };
    }
  };

  const updateAddress = async (addressId: string, addressData: Partial<AddressItem>) => {
    try {
      const response = await put<{ success: boolean; address?: AddressItem; error?: string }>(
        `/api/client/update-address/${addressId}`,
        addressData
      );

      if (response.ok && response.data?.success) {
        refetch();
        return { success: true };
      } else {
        return {
          success: false,
          error: response.data?.error || response.error || 'Erro ao atualizar endereço',
        };
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro de rede ao atualizar endereço',
      };
    }
  };

  const deleteAddress = async (addressId: string) => {
    try {
      const response = await del<{ success: boolean; error?: string }>(
        `/api/client/delete-address/${addressId}`
      );

      if (response.ok && response.data?.success) {
        refetch();
        return { success: true };
      } else {
        return {
          success: false,
          error: response.data?.error || response.error || 'Erro ao deletar endereço',
        };
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erro de rede ao deletar endereço',
      };
    }
  };

  return {
    addresses,
    loading,
    error,
    refetch,
    createAddress,
    updateAddress,
    deleteAddress,
  };
};
