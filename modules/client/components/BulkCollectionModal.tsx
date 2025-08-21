'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './BulkCollectionModal.css';

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
  const [etaBr, setEtaBr] = useState(''); // dd/mm/aaaa
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
    if (method === 'bring_to_yard' && initialEtaIso) {
      setEta(initialEtaIso);
      const [y, m, d] = (initialEtaIso || '').split('-');
      setEtaBr(initialEtaIso ? `${d}/${m}/${y}` : '');
    }
  }, [isOpen, method, initialAddressId, initialEtaIso]);

  if (!isOpen) return null;

  const node = (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 10000, paddingTop: 40 }}>
      <div style={{ background: '#fff', color: '#222', borderRadius: 10, width: 'min(760px, 96vw)', padding: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem' }}>
            {method === 'collect_point' ? 'Definir ponto de coleta em lote' : 'Levar ao pátio ProLine em lote'}
          </h3>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 22, cursor: 'pointer', lineHeight: 1 }} aria-label="Fechar">×</button>
        </div>

        {/* Seletor de parâmetros conforme método */}
        {method === 'collect_point' ? (
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 6 }}>Ponto de coleta</label>
            <select value={addressId} onChange={e => setAddressId(e.target.value)} style={{ width: '100%', padding: '8px 10px' }}>
              <option value="">Selecione um ponto de coleta</option>
              {addresses.filter(a => a.is_collect_point).map(a => (
                <option key={a.id} value={a.id}>
                  {a.street} {a.number ? `, ${a.number}` : ''} {a.city ? `- ${a.city}` : ''}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 6 }}>Data prevista de chegada ao pátio</label>
            <div className="bcm-date-field">
              <input
                className="bcm-date-input"
                type="text"
                inputMode="numeric"
                placeholder="dd/mm/aaaa"
                value={etaBr}
                onChange={e => {
                  const only = e.target.value.replace(/\D+/g, '').slice(0, 8);
                  const p1 = only.slice(0, 2);
                  const p2 = only.slice(2, 4);
                  const p3 = only.slice(4, 8);
                  const formatted = only.length <= 2 ? p1 : only.length <= 4 ? `${p1}/${p2}` : `${p1}/${p2}/${p3}`;
                  setEtaBr(formatted);
                  if (only.length === 8) {
                    const d = parseInt(only.slice(0, 2), 10);
                    const m = parseInt(only.slice(2, 4), 10);
                    const y = parseInt(only.slice(4, 8), 10);
                    const dt = new Date(y, m - 1, d);
                    if (dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d) {
                      const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                      setEta(iso);
                    } else {
                      setEta('');
                    }
                  } else {
                    setEta('');
                  }
                }}
                maxLength={10}
              />
              <button
                type="button"
                className="bcm-calendar-btn"
                aria-label="Abrir calendário"
                onClick={() => {
                  const el = hiddenDateRef.current;
                  if (!el) return;
                  // @ts-ignore
                  if (typeof el.showPicker === 'function') el.showPicker(); else { el.focus(); el.click(); }
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M7 10h5v5H7z"></path>
                  <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"></path>
                </svg>
              </button>
              <input
                ref={hiddenDateRef}
                className="bcm-hidden-date"
                type="date"
                value={eta}
                min={minDate}
                onChange={e => {
                  const iso = e.target.value;
                  setEta(iso);
                  const [y, m, d] = (iso || '').split('-');
                  setEtaBr(iso ? `${d}/${m}/${y}` : '');
                }}
                aria-hidden
                tabIndex={-1}
              />
            </div>
          </div>
        )}

        {/* Checkboxes de seleção por status */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={selectDefinicao} onChange={e => setSelectDefinicao(e.target.checked)} disabled={counts.definicao === 0} />
            <span>Aguardando definição de coleta</span>
            <span style={{ marginLeft: 'auto', opacity: 0.7 }}>({counts.definicao})</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={selectChegada} onChange={e => setSelectChegada(e.target.checked)} disabled={counts.chegada === 0} />
            <span>Aguardando chegada do veículo</span>
            <span style={{ marginLeft: 'auto', opacity: 0.7 }}>({counts.chegada})</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={selectColeta} onChange={e => setSelectColeta(e.target.checked)} disabled={counts.coleta === 0} />
            <span>Aguardando coleta</span>
            <span style={{ marginLeft: 'auto', opacity: 0.7 }}>({counts.coleta})</span>
          </label>
        </div>

        <div style={{ marginTop: 12, fontSize: 14, color: '#444' }}>
          Veículos afetados: <b>{selectedIds.length}</b>
        </div>

        {error && (
          <div style={{ color: 'red', marginTop: 8 }}>{error}</div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', background: '#fafafa' }}>Cancelar</button>
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
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #1b5e20', background: '#2e7d32', color: '#fff' }}
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
