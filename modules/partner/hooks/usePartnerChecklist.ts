'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/modules/common/services/supabaseClient';
import { getLogger } from '@/modules/logger';

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
  color?: string;
}

interface Inspection {
  id: string;
  vehicle_id: string;
  inspection_date: string;
  odometer: number;
  fuel_level: string;
  observations?: string;
  finalized: boolean;
  created_at: string;
}

interface PartnerChecklistForm {
  date: string;
  odometer: string;
  fuelLevel: string;
  observations: string;
}

const logger = getLogger('partner:usePartnerChecklist');

export const usePartnerChecklist = () => {
  const searchParams = useSearchParams();
  const quoteId = searchParams.get('quoteId');
  const vehicleId = searchParams.get('vehicleId');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<PartnerChecklistForm>({
    date: new Date().toISOString().split('T')[0],
    odometer: '',
    fuelLevel: 'half',
    observations: '',
  });

  const setField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const loadData = async () => {
    // Aceitar tanto quoteId quanto vehicleId
    let finalVehicleId = vehicleId;

    if (!vehicleId && quoteId) {
      // Se só temos quoteId, buscar vehicleId através do service_order
      try {
        const { data: quoteData } = await supabase
          .from('quotes')
          .select('service_order_id')
          .eq('id', quoteId)
          .single();

        if (quoteData?.service_order_id) {
          const { data: serviceOrderData } = await supabase
            .from('service_orders')
            .select('vehicle_id')
            .eq('id', quoteData.service_order_id)
            .single();

          finalVehicleId = serviceOrderData?.vehicle_id;
        }
      } catch (error) {
        logger.error('Erro ao buscar vehicle_id através da quote', { quoteId, error });
      }
    }

    if (!finalVehicleId) {
      setError('ID do veículo não fornecido');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      logger.info('Carregando dados do checklist', { finalVehicleId });

      // Buscar dados do veículo
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', finalVehicleId)
        .single();

      if (vehicleError) {
        logger.error('Erro ao buscar veículo', { finalVehicleId, error: vehicleError });
        setError('Erro ao carregar dados do veículo');
        return;
      }

      if (!vehicleData) {
        setError('Veículo não encontrado');
        return;
      }

      setVehicle(vehicleData);

      // Buscar inspeção existente para este veículo e parceiro
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setError('Usuário não autenticado');
        return;
      }

      const { data: inspectionData, error: inspectionError } = await supabase
        .from('inspections')
        .select('*')
        .eq('vehicle_id', finalVehicleId)
        .eq('partner_id', userData.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (inspectionError) {
        logger.error('Erro ao buscar inspeção', {
          finalVehicleId,
          partnerId: userData.user.id,
          error: inspectionError,
        });
        // Não é erro fatal - pode não ter inspeção ainda
      }

      if (inspectionData) {
        logger.info('Inspeção existente encontrada', { inspectionId: inspectionData.id });
        setInspection(inspectionData);
        // Preencher formulário com dados da inspeção existente
        setForm({
          date: inspectionData.inspection_date,
          odometer: inspectionData.odometer.toString(),
          fuelLevel: inspectionData.fuel_level,
          observations: inspectionData.observations || '',
        });
      } else {
        logger.info('Nenhuma inspeção encontrada - modo criação', { finalVehicleId });
      }
    } catch (err) {
      logger.error('Erro inesperado ao carregar dados', { error: err });
      setError('Erro inesperado ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const saveChecklist = async () => {
    if (!vehicle) {
      setError('Dados do veículo não disponíveis');
      return;
    }

    if (inspection) {
      setSuccess('Esta inspeção já foi salva e não pode ser modificada.');
      return;
    }

    if (!form.date || !form.odometer) {
      setError('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error('Usuário não autenticado');
      }

      logger.info('Salvando checklist', { vehicleId: vehicle.id, partnerId: userData.user.id });

      const inspectionData = {
        vehicle_id: vehicle.id,
        partner_id: userData.user.id,
        inspection_date: form.date,
        odometer: parseInt(form.odometer),
        fuel_level: form.fuelLevel,
        observations: form.observations.trim() || null,
        finalized: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error: insertError } = await supabase
        .from('inspections')
        .insert([inspectionData])
        .select()
        .single();

      if (insertError) {
        logger.error('Erro ao salvar inspeção', { error: insertError });
        throw new Error(`Erro ao salvar inspeção: ${insertError.message}`);
      }

      logger.info('Checklist salvo com sucesso', { inspectionId: data.id });
      setInspection(data);
      setSuccess('Checklist salvo com sucesso!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar checklist';
      logger.error('Erro ao salvar checklist', { error: err });
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [vehicleId, quoteId]);

  return {
    form,
    vehicle,
    inspection,
    loading,
    saving,
    error,
    success,
    setField,
    saveChecklist,
  };
};
