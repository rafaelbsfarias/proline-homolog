'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './RowCollectionModal.css';

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
  // etaBr armazena a data visível no input no formato dd/mm/aaaa
  const [etaBr, setEtaBr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hiddenDateRef = useRef<HTMLInputElement | null>(null);

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
    setEtaBr('');
    setError(null);
    setSubmitting(false);
  }, [isOpen, vehicle]);

  const canSubmit = useMemo(() => {
    if (method === 'collect_point') return !!addressId;
    if (method === 'bring_to_yard') return !!etaIso;
    return false;
  }, [method, addressId, etaIso]);

  // Helpers de data
  const onlyDigits = (s: string) => s.replace(/\D+/g, '');
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const toISO = (d: number, m: number, y: number) => `${y}-${pad2(m)}-${pad2(d)}`;
  const isValidDateParts = (d: number, m: number, y: number) => {
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
  };
  const parseBRToISO = (input: string): string | '' => {
    const digits = onlyDigits(input).slice(0, 8);
    if (digits.length < 8) return '';
    const d = parseInt(digits.slice(0, 2), 10);
    const m = parseInt(digits.slice(2, 4), 10);
    const y = parseInt(digits.slice(4, 8), 10);
    if (!isValidDateParts(d, m, y)) return '';
    return toISO(d, m, y);
  };
  const formatDigitsToBR = (digits: string): string => {
    const v = digits.slice(0, 8);
    const p1 = v.slice(0, 2);
    const p2 = v.slice(2, 4);
    const p3 = v.slice(4, 8);
    if (v.length <= 2) return p1;
    if (v.length <= 4) return `${p1}/${p2}`;
    return `${p1}/${p2}/${p3}`;
  };
  const compareISO = (a: string, b: string) => {
    // comparação lexicográfica funciona para YYYY-MM-DD
    return a.localeCompare(b);
  };

  const isoToBR = (iso: string): string => {
    // iso YYYY-MM-DD -> DD/MM/YYYY
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    if (!y || !m || !d) return '';
    return `${d}/${m}/${y}`;
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
            <select className="rcm-select" value={addressId} onChange={e => setAddressId(e.target.value)}>
              <option value="">Selecione um ponto de coleta</option>
              {addresses.filter(a => a.is_collect_point).map(a => (
                <option key={a.id} value={a.id}>
                  {a.street} {a.number ? `, ${a.number}` : ''} {a.city ? `- ${a.city}` : ''}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="rcm-form-group">
            <label className="rcm-label">Data prevista de chegada ao pátio</label>
            <div className="rcm-date-field">
              {/* input visível com dd/mm/aaaa */}
              <input
                className="rcm-date-input"
                type="text"
                inputMode="numeric"
                placeholder="dd/mm/aaaa"
                value={etaBr}
                onChange={e => {
                  const only = onlyDigits(e.target.value);
                  const formatted = formatDigitsToBR(only);
                  setEtaBr(formatted);
                  const iso = parseBRToISO(formatted);
                  setEtaIso(iso);
                  if (iso && minDate && compareISO(iso, minDate) < 0) {
                    setError(`A data não pode ser anterior a ${minDate.split('-').reverse().join('/')}`);
                  } else {
                    setError(null);
                  }
                }}
                maxLength={10}
              />
              <button
                type="button"
                className="rcm-calendar-btn"
                aria-label="Abrir calendário"
                onClick={() => {
                  const el = hiddenDateRef.current;
                  if (!el) return;
                  // @ts-ignore
                  if (typeof el.showPicker === 'function') el.showPicker();
                  else {
                    el.focus();
                    el.click();
                  }
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M7 10h5v5H7z"></path>
                  <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"></path>
                </svg>
              </button>
              {/* input real (nativo) para calendário e restrições */}
              <input
                ref={hiddenDateRef}
                className="rcm-hidden-date"
                type="date"
                value={etaIso}
                onChange={e => {
                  const iso = e.target.value;
                  setEtaIso(iso);
                  setEtaBr(isoToBR(iso));
                  if (iso && minDate && compareISO(iso, minDate) < 0) {
                    setError(`A data não pode ser anterior a ${minDate.split('-').reverse().join('/')}`);
                  } else {
                    setError(null);
                  }
                }}
                min={minDate}
                aria-hidden
                tabIndex={-1}
              />
            </div>
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
