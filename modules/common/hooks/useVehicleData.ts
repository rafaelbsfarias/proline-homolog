'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthenticatedFetch } from './useAuthenticatedFetch';
import type { VehicleInfo, InspectionInfo } from '../types/checklist';

interface UseVehicleDataResult {
  vehicle: VehicleInfo | null;
  inspection: InspectionInfo | null;
  loading: boolean;
  error: string | null;
}

export function useVehicleData(): UseVehicleDataResult {
  const { get } = useAuthenticatedFetch();
  const searchParams = useSearchParams();

  const [vehicle, setVehicle] = useState<VehicleInfo | null>(null);
  const [inspection, setInspection] = useState<InspectionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVehicleData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Obter parâmetros da URL
        const quoteId = searchParams.get('quoteId');
        const vehicleId = searchParams.get('vehicleId');
        const inspectionId = searchParams.get('inspectionId');

        // Determinar qual parâmetro usar
        const targetId = inspectionId || vehicleId || quoteId;
        const isVehicleId = !!vehicleId;

        if (!targetId) {
          throw new Error('Nenhum ID válido fornecido na URL');
        }

        // Construir URL da API
        let apiUrl = '/api/partner/get-vehicle-from-inspection';
        if (isVehicleId) {
          apiUrl += `?vehicleId=${targetId}`;
        } else if (inspectionId) {
          apiUrl += `?inspectionId=${targetId}`;
        } else {
          // Para quoteId
          apiUrl += `?quoteId=${targetId}`;
        }

        const response = await get<{
          vehicle: VehicleInfo;
          inspection?: InspectionInfo;
          vehicleId?: string;
          inspectionId?: string;
          source?: string;
        }>(apiUrl);

        if (!response.ok || !response.data) {
          throw new Error('Erro ao buscar dados do veículo');
        }

        const { vehicle: vehicleData, inspection: inspectionData } = response.data;

        if (!vehicleData) {
          throw new Error('Veículo não encontrado');
        }

        setVehicle(vehicleData);

        if (inspectionData) {
          setInspection(inspectionData);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao carregar dados do veículo';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleData();
  }, [searchParams, get]);

  return {
    vehicle,
    inspection,
    loading,
    error,
  };
}
