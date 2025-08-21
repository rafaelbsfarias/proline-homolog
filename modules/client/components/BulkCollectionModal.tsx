'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './BulkCollectionModal.css';
import DatePickerBR from './DatePickerBR';
import CollectPointSelect from './CollectPointSelect';

type Method = 'collect_point' | 'bring_to_yard';

export interface VehicleItem {
  id: string;
  status?: string | null;
}

interface AddressItem {
  id: string;
  street: string | null;
  number: string | null;
  city: string | null;
  is_collect_point: boolean;
}

interface BulkCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  method: Method;
  vehicles: VehicleItem[];
  addresses?: AddressItem[]; // required when method === 'collect_point'
  minDate?: string; // required when method === 'bring_to_yard'
  initialAddressId?: string; // optional preselected address
  initialEtaIso?: string; // optional preselected date in YYYY-MM-DD
  onApply: (payload: { method: Method; vehicleIds: string[]; addressId?: string; estimated_arrival_date?: string }) => Promise<void>;
}

const normalize = (v?: string | null) => String(v || '').toUpperCase().trim();

const BulkCollectionModal: React.FC<BulkCollectionModalProps> = ({
  isOpen,
  onClose,
  method,
  vehicles,
  addresses = [],
  minDate,
  onApply,
  initialAddressId,
  initialEtaIso,
}) => {
  const [selectDefinicao, setSelectDefinicao] = useState(true);
  const [selectChegada, setSelectChegada] = useState(true);
  const [selectColeta, setSelectColeta] = useState(true);
  const [addressId, setAddressId] = useState('');
  const [eta, setEta] = useState(''); // ISO YYYY-MM-DD
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hiddenDateRef = useRef<HTMLInputElement | null>(null);

  const counts = useMemo(() => {
    let definicao = 0;
    let chegada = 0;
    let coleta = 0;
    vehicles.forEach(v => {
      const s = normalize(v.status);
      if (s === 'AGUARDANDO DEFINIÇÃO DE COLETA') definicao += 1;
      else if (s === 'AGUARDANDO CHEGADA DO CLIENTE' || s === 'AGUARDANDO CHEGADA DO VEÍCULO') chegada += 1;
      else if (s === 'AGUARDANDO COLETA') coleta += 1;
    });
    return { definicao, chegada, coleta };
  }, [vehicles]);

  const selectedIds = useMemo(() => {
    const selected: string[] = [];
    vehicles.forEach(v => {
      const s = normalize(v.status);
      if (selectDefinicao && s === 'AGUARDANDO DEFINIÇÃO DE COLETA') selected.push(v.id);
      else if (selectChegada && (s === 'AGUARDANDO CHEGADA DO CLIENTE' || s === 'AGUARDANDO CHEGADA DO VEÍCULO')) selected.push(v.id);
      else if (selectColeta && s === 'AGUARDANDO COLETA') selected.push(v.id);
    });
    return selected;
  }, [vehicles, selectDefinicao, selectChegada, selectColeta]);

  const canSubmit = useMemo(() => {
    if (!selectedIds.length) return false;
    if (method === 'collect_point') return !!addressId;
    if (method === 'bring_to_yard') return !!eta;
    return false;
  }, [selectedIds.length, method, addressId, eta]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  // Prefill values when opening
  useEffect(() => {
    if (!isOpen) return;
    if (method === 'collect_point' && initialAddressId) setAddressId(initialAddressId);
    if (method === 'bring_to_yard' && initialEtaIso) setEta(initialEtaIso);
  }, [isOpen, method, initialAddressId, initialEtaIso]);

  if (!isOpen) return null;

  const node = (
    <div className="bcm-overlay" role="dialog" aria-modal="true">
      <div className="bcm-modal">
        <div className="bcm-header">
          <h3 className="bcm-title">
            {method === 'collect_point' ? 'Definir ponto de coleta em lote' : 'Levar ao pátio ProLine em lote'}
          </h3>
          <button type="button" onClick={onClose} className="bcm-close" aria-label="Fechar">×</button>
        </div>

        {/* Seletor de parâmetros conforme método */}
        {method === 'collect_point' ? (
          <div className="bcm-form-group">
            <label className="bcm-label">Ponto de coleta</label>
            <CollectPointSelect className="bcm-select" addresses={addresses as any} value={addressId} onChange={setAddressId} />
          </div>
        ) : (
          <div className="bcm-form-group">
            <label className="bcm-label">Data prevista de chegada ao pátio</label>
            <DatePickerBR
              valueIso={eta}
              minIso={minDate}
              onChangeIso={setEta}
              ariaLabel="Data prevista de chegada ao pátio (dd/mm/aaaa)"
              containerClass="bcm-date-field"
              inputClass="bcm-date-input"
              buttonClass="bcm-calendar-btn"
              hiddenInputClass="bcm-hidden-date"
            />
          </div>
        )}

        {/* Checkboxes de seleção por status */}
        <div className="bcm-grid">
          <label className="bcm-checkbox-row">
            <input type="checkbox" checked={selectDefinicao} onChange={e => setSelectDefinicao(e.target.checked)} disabled={counts.definicao === 0} />
            <span>Aguardando definição de coleta</span>
            <span className="bcm-count">({counts.definicao})</span>
          </label>
          <label className="bcm-checkbox-row">
            <input type="checkbox" checked={selectChegada} onChange={e => setSelectChegada(e.target.checked)} disabled={counts.chegada === 0} />
            <span>Aguardando chegada do veículo</span>
            <span className="bcm-count">({counts.chegada})</span>
          </label>
          <label className="bcm-checkbox-row">
            <input type="checkbox" checked={selectColeta} onChange={e => setSelectColeta(e.target.checked)} disabled={counts.coleta === 0} />
            <span>Aguardando coleta</span>
            <span className="bcm-count">({counts.coleta})</span>
          </label>
        </div>

        <div className="bcm-affected">
          Veículos afetados: <b>{selectedIds.length}</b>
        </div>

        {error && (
          <div className="bcm-error">{error}</div>
        )}

        <div className="bcm-actions">
          <button type="button" onClick={onClose} className="bcm-btn bcm-btn-secondary">Cancelar</button>
          <button
            type="button"
            disabled={!canSubmit || submitting}
            onClick={async () => {
              try {
                setSubmitting(true);
                setError(null);
                const payload: { method: Method; vehicleIds: string[]; addressId?: string; estimated_arrival_date?: string } = {
                  method,
                  vehicleIds: selectedIds,
                };
                if (method === 'collect_point') payload.addressId = addressId;
                if (method === 'bring_to_yard') payload.estimated_arrival_date = eta;
                await onApply(payload);
                onClose();
              } catch (e: any) {
                setError(e?.message || 'Erro ao aplicar alterações');
              } finally {
                setSubmitting(false);
              }
            }}
            className="bcm-btn bcm-btn-primary"
          >
            {method === 'collect_point' ? 'Aplicar ponto de coleta' : 'Aplicar data de entrega ao pátio'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
};

export default BulkCollectionModal;
