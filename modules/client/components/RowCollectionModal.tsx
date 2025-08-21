'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './RowCollectionModal.css';
import DatePickerBR from './DatePickerBR';
import CollectPointSelect from './CollectPointSelect';

type Method = 'collect_point' | 'bring_to_yard';

export interface VehicleItem {
  id: string;
  pickup_address_id?: string | null;
}

interface AddressItem {
  id: string;
  street: string | null;
  number: string | null;
  city: string | null;
  is_collect_point: boolean;
}

interface RowCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: VehicleItem;
  addresses: AddressItem[];
  minDate: string;
  onApply: (payload: { method: Method; vehicleIds: string[]; addressId?: string; estimated_arrival_date?: string }) => Promise<void>;
}

const RowCollectionModal: React.FC<RowCollectionModalProps> = ({ isOpen, onClose, vehicle, addresses, minDate, onApply }) => {
  const [method, setMethod] = useState<Method>('collect_point');
  const [addressId, setAddressId] = useState('');
  // etaIso armazena a data em formato ISO (YYYY-MM-DD) para envio
  const [etaIso, setEtaIso] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    // default address to current vehicle's pickup when opening
    setAddressId(vehicle.pickup_address_id || '');
    setMethod('collect_point');
    setEtaIso('');
    
    setError(null);
    setSubmitting(false);
  }, [isOpen, vehicle]);

  const canSubmit = useMemo(() => {
    if (method === 'collect_point') return !!addressId;
    if (method === 'bring_to_yard') return !!etaIso;
    return false;
  }, [method, addressId, etaIso]);

  const compareISO = (a: string, b: string) => {
    // comparação lexicográfica funciona para YYYY-MM-DD
    return a.localeCompare(b);
  };

  if (!isOpen) return null;

  const node = (
    <div className="rcm-overlay" role="dialog" aria-modal="true" aria-labelledby="rcm-title">
      <div className="rcm-modal">
        <div className="rcm-header">
          <h3 id="rcm-title" className="rcm-title">Editar ponto de coleta</h3>
          <button type="button" onClick={onClose} className="rcm-close" aria-label="Fechar">×</button>
        </div>

        <div className="rcm-method-row">
          <label><input type="radio" name="method" checked={method === 'collect_point'} onChange={() => setMethod('collect_point')} /> Ponto de Coleta</label>
          <label><input type="radio" name="method" checked={method === 'bring_to_yard'} onChange={() => setMethod('bring_to_yard')} /> Vou levar ao pátio</label>
        </div>

        {method === 'collect_point' ? (
          <div className="rcm-form-group">
            <label className="rcm-label">Ponto de coleta</label>
            <CollectPointSelect className="rcm-select" addresses={addresses as any} value={addressId} onChange={setAddressId} />
          </div>
        ) : (
          <div className="rcm-form-group">
            <label className="rcm-label">Data prevista de chegada ao pátio</label>
            <DatePickerBR
              valueIso={etaIso}
              minIso={minDate}
              onChangeIso={(iso) => {
                setEtaIso(iso);
                if (iso && minDate && compareISO(iso, minDate) < 0) {
                  setError(`A data não pode ser anterior a ${minDate.split('-').reverse().join('/')}`);
                } else {
                  setError(null);
                }
              }}
              ariaLabel="Data prevista de chegada ao pátio (dd/mm/aaaa)"
              containerClass="rcm-date-field"
              inputClass="rcm-date-input"
              buttonClass="rcm-calendar-btn"
              hiddenInputClass="rcm-hidden-date"
            />
          </div>
        )}

        {error && <div className="rcm-error">{error}</div>}

        <div className="rcm-actions">
          <button type="button" onClick={onClose} className="rcm-btn rcm-btn-secondary">Cancelar</button>
          <button
            type="button"
            disabled={!canSubmit || submitting}
            onClick={async () => {
              try {
                setSubmitting(true);
                setError(null);
                const payload: { method: Method; vehicleIds: string[]; addressId?: string; estimated_arrival_date?: string } = { method, vehicleIds: [vehicle.id] };
                if (method === 'collect_point') payload.addressId = addressId;
                if (method === 'bring_to_yard') {
                  if (!etaIso) throw new Error('Informe uma data válida no formato dd/mm/aaaa');
                  if (minDate && compareISO(etaIso, minDate) < 0) {
                    throw new Error(`A data não pode ser anterior a ${minDate.split('-').reverse().join('/')}`);
                  }
                  payload.estimated_arrival_date = etaIso;
                }
                await onApply(payload);
                onClose();
              } catch (e: any) {
                setError(e?.message || 'Erro ao aplicar');
              } finally {
                setSubmitting(false);
              }
            }}
            className="rcm-btn rcm-btn-primary"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
};

export default RowCollectionModal;
