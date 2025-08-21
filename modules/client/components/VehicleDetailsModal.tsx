'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './VehicleDetailsModal.css';
import { supabase } from '@/modules/common/services/supabaseClient';
import type { VehicleItem } from '@/modules/client/types';
import { getLogger } from '@/modules/logger';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

export type VehicleDetails = {
  plate: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  status: string;
  created_at: string;

  // nomes usados no modal
  fipe_value?: number;
  client_name?: string;
  analyst?: string;
  arrival_forecast?: string;
  current_km?: number;
  params?: string;
  notes?: string;
  retirada_na_proline?: boolean;

  // aliases vindos do DB/endpoint
  estimated_arrival_date?: string | null;
  current_odometer?: number | null;
  fuel_level?: string | null;
};

interface VehicleDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: VehicleDetails | VehicleItem | null;
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
  const logger = getLogger('client:VehicleDetailsModal');
  const { get } = useAuthenticatedFetch();
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!mounted) return;
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [isOpen, mounted]);

  // Quando o modal abre, buscar o(s) especialista(s) via API server-side (evita RLS no cliente)
  useEffect(() => {
    let active = true;
    async function fetchSpecialistsForClient() {
      try {
        setLoadingSpecialist(true);
        logger.debug('Fetching specialists via API (modal open).');
        const resp = await get<{ success: boolean; names?: string; specialists?: any[]; error?: string }>(
          '/api/client/my-specialists'
        );
        if (!resp.ok || !resp.data?.success) {
          logger.warn('API error fetching specialists', resp.error || resp.data?.error);
          if (active) setSpecialistNames('');
          return;
        }
        const names = resp.data.names || '';
        logger.info('Specialist names resolved', { count: resp.data.specialists?.length || 0, names });
        if (active) setSpecialistNames(names);
      } catch (e: any) {
        logger.error('Unhandled error while fetching specialists', e?.message || e);
      } finally {
        if (active) setLoadingSpecialist(false);
      }
    }
    if (isOpen) fetchSpecialistsForClient();
    return () => { active = false; };
  }, [isOpen, get]);

  if (!mounted || !isOpen || !vehicle) return null;

  // 💡 Fallbacks para nomes do banco
  const statusClass = sanitizeStatus((vehicle as any).status);
  const vAny = vehicle as any;
  const km = (vAny.current_km ?? vAny.current_odometer) ?? undefined;               // 0 aparece corretamente
  const arrival = (vAny.arrival_forecast ?? vAny.estimated_arrival_date) ?? null;

  const content = (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="vehicle-modal-title">
      <div className="modal-content" role="document">
        <button className="modal-close" onClick={onClose} aria-label="Fechar">×</button>

        <h2 id="vehicle-modal-title" className="modal-title">
          Detalhes do Veículo: <span className="mono">{vehicle.plate}</span>
        </h2>
        <p className="modal-subtitle">
          {vehicle.brand} {vehicle.model} ({vehicle.year})
        </p>

        <div className="details-grid">
          <div className="detail">
            <span className="label">Placa</span>
            <span className="value mono">{vehicle.plate}</span>
          </div>
          <div className="detail">
            <span className="label">Marca</span>
            <span className="value">{vehicle.brand}</span>
          </div>
          <div className="detail">
            <span className="label">Modelo</span>
            <span className="value">{vehicle.model} ({vehicle.year})</span>
          </div>
          <div className="detail">
            <span className="label">Cor</span>
            <span className="value">{vehicle.color || 'N/A'}</span>
          </div>
          <div className="detail">
            <span className="label">KM Atual</span>
            <span className="value">{km ?? 'N/A'}</span>
          </div>
          <div className="detail">
            <span className="label">Valor FIPE</span>
            <span className="value">{fmtBRL(vehicle.fipe_value)}</span>
          </div>
          
          <div className="detail">
            <span className="label">Status</span>
            <span className={`vehicle-status-badge ${statusClass}`}>
              {statusLabels[sanitizeStatus((vehicle as any).status)] || (vehicle as any).status}
            </span>
          </div>
          <div className="detail">
            <span className="label">Previsão de Chegada</span>
            <span className="value">{fmtDate(arrival)}</span>
          </div>
          <div className="detail">
            <span className="label">Especialista Responsável</span>
            <span className="value">{specialistNames || (vAny.analyst) || 'N/A'}</span>
          </div>
          
          <div className="detail">
            <span className="label">Cadastrado em</span>
            <span className="value">{fmtDate(vehicle.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default VehicleDetailsModal;
