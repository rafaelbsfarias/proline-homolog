import { useState, useCallback } from 'react';
import { supabase } from '@/modules/common/services/supabaseClient';

interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  color: string;
  year: number;
  fipe_value?: number;
  estimated_arrival_date?: string;
  status: string;
  created_at: string;
  client: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface Client {
  id: string;
  full_name: string;
  email: string;
}

export const useVehicleManagement = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Busca o access_token da sessão Supabase
  const getAuthToken = useCallback(async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error || !session?.access_token) return null;
    return session.access_token;
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getAuthToken();
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const response = await fetch('/api/admin/get-clients', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar clientes');
      }

      const data = await response.json();
      setClients(data.clients || []);
      return data.clients;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      setClients([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [getAuthToken]);

  const createVehicle = useCallback(
    async (vehicleData: {
      clientId: string;
      licensePlate: string;
      brand: string;
      model: string;
      color: string;
      year: number;
      fipeValue?: number;
      estimatedArrivalDate?: string;
    }) => {
      try {
        setLoading(true);
        setError(null);

        const token = await getAuthToken();
        if (!token) {
          throw new Error('Token de autenticação não encontrado');
        }

        const response = await fetch('/api/admin/create-vehicle', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(vehicleData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao cadastrar veículo');
        }

        const data = await response.json();
        const newVehicle = data.vehicle;

        // Adicionar o novo veículo à lista local
        setVehicles(prev => [newVehicle, ...prev]);

        return newVehicle;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getAuthToken]
  );

  const fetchVehicles = useCallback(
    async (filters?: { clientId?: string; status?: string; page?: number; limit?: number }) => {
      try {
        setLoading(true);
        setError(null);

        const token = await getAuthToken();
        if (!token) {
          throw new Error('Token de autenticação não encontrado');
        }

        const searchParams = new URLSearchParams();
        if (filters?.clientId) searchParams.append('clientId', filters.clientId);
        if (filters?.status) searchParams.append('status', filters.status);
        if (filters?.page) searchParams.append('page', filters.page.toString());
        if (filters?.limit) searchParams.append('limit', filters.limit.toString());

        const url = `/api/admin/get-vehicles${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Erro ao buscar veículos');
        }

        const data = await response.json();
        setVehicles(data.vehicles || []);
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage);
        setVehicles([]);
        return { vehicles: [], total: 0 };
      } finally {
        setLoading(false);
      }
    },
    [getAuthToken]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    vehicles,
    clients,
    loading,
    error,
    fetchClients,
    createVehicle,
    fetchVehicles,
    clearError,
  };
};
