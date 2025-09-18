'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { getLogger } from '@/modules/logger';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import DetailTable, { DetailItem } from '@/modules/common/components/DetailTable/DetailTable';
import Modal from '@/modules/common/components/Modal/Modal';
import { SolidButton } from '@/modules/common/components/SolidButton/SolidButton';
import './VehicleDetailsModal.css';
import Spinner from '@/modules/common/components/Spinner/Spinner';

export type VehicleDetails = {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  status: string;
  created_at: string;
  fipe_value?: number;
  client_name?: string;
  analyst?: string;
  arrival_forecast?: string;
  current_km?: number;
  notes?: string;
  estimated_arrival_date?: string | null;
  current_odometer?: number | null;
  fuel_level?: string | null;
};

interface VehicleDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: VehicleDetails | null;
}

const statusLabels: Record<string, string> = {
  aguardando_chegada: 'Aguardando Chegada',
  active: 'Ativo',
  ativo: 'Ativo',
  inativo: 'Inativo',
};

function sanitizeStatus(status?: string) {
  return (status ?? '').toString().trim().toLowerCase().replace(/\s+/g, '_');
}

function fmtDate(d?: string | null) {
  if (!d) return 'N/A';
  const onlyDate = /^\d{4}-\d{2}-\d{2}$/;
  if (onlyDate.test(d)) {
    const [y, m, dd] = d.split('-');
    return `${dd}/${m}/${y}`;
  }
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? 'N/A' : dt.toLocaleDateString('pt-BR');
}

function fmtBRL(n?: number | null) {
  if (n === undefined || n === null) return 'N/A';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

const VehicleDetailsModal: React.FC<VehicleDetailsModalProps> = ({ isOpen, onClose, vehicle }) => {
  const [mounted, setMounted] = useState(false);
  const [specialistNames, setSpecialistNames] = useState<string>('');
  const [loadingSpecialist, setLoadingSpecialist] = useState<boolean>(false);
  const logger = getLogger('vehicles:VehicleDetailsModal');
  const { get } = useAuthenticatedFetch();
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen, mounted]);

  useEffect(() => {
    let active = true;
    async function fetchSpecialistsForClient() {
      try {
        setLoadingSpecialist(true);

        const resp = await get<{
          success: boolean;
          names?: string;
        }>('/api/client/my-specialists');

        if (!resp.ok || !resp.data?.success) {
          if (active) setSpecialistNames('');
          return;
        }

        if (active) setSpecialistNames(resp.data.names || '');
      } catch {
        if (active) setSpecialistNames('');
      } finally {
        if (active) setLoadingSpecialist(false);
      }
    }

    if (isOpen) fetchSpecialistsForClient();

    return () => {
      active = false;
    };
  }, [isOpen, get]);

  if (!mounted || !isOpen || !vehicle) return null;

  const vAny = vehicle as any;
  const statusClass = sanitizeStatus(vAny.status);
  const km = vAny.current_km ?? vAny.current_odometer ?? undefined;
  const arrival = vAny.arrival_forecast ?? vAny.estimated_arrival_date ?? null;

  const handleNavigateToDetails = () => {
    if (vehicle && vehicle.id) {
      router.push(`/dashboard/client/vehicle/${vehicle.id}`);
    }
  };

  const vehicleItems: DetailItem[] = [
    { label: 'Placa', value: <span className="mono">{vehicle.plate}</span> },
    { label: 'Marca', value: vehicle.brand },
    { label: 'Modelo', value: `${vehicle.model} (${vehicle.year})` },
    { label: 'Cor', value: vehicle.color || 'N/A' },
    { label: 'KM Atual', value: km ?? 'N/A' },
    { label: 'Valor FIPE', value: fmtBRL(vehicle.fipe_value) },
    {
      label: 'Status',
      value: (
        <span className={`vehicle-status-badge ${statusClass}`}>
          {statusLabels[sanitizeStatus(vAny.status)] || vAny.status}
        </span>
      ),
    },
    { label: 'Previsão de Chegada', value: fmtDate(arrival) },
    { label: 'Especialista Responsável', value: specialistNames || vAny.analyst || 'N/A' },
    { label: 'Cadastrado em', value: fmtDate(vehicle.created_at) },
  ];

  const content = (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalhes do Veículo: ${vehicle.plate}`}
      size="md"
      showCloseButton
    >
      {loadingSpecialist ? (
        <div className="flex justify-center my-10">
          <Spinner size={60} />
        </div>
      ) : (
        <>
          <DetailTable items={vehicleItems} />
          <div className="modal-actions-button">
            <SolidButton onClick={handleNavigateToDetails}>Ver Detalhes Completos</SolidButton>
          </div>
        </>
      )}
    </Modal>
  );

  return createPortal(content, document.body);
};

export default VehicleDetailsModal;
