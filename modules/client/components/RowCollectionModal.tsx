'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

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
  const [eta, setEta] = useState('');
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
    setEta('');
    setError(null);
    setSubmitting(false);
  }, [isOpen, vehicle]);

  const canSubmit = useMemo(() => {
    if (method === 'collect_point') return !!addressId;
    if (method === 'bring_to_yard') return !!eta;
    return false;
  }, [method, addressId, eta]);

  if (!isOpen) return null;

  const node = (
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 10000, paddingTop: 40 }}>
      <div style={{ background: '#fff', color: '#222', borderRadius: 10, width: 'min(560px, 96vw)', padding: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.35)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Editar ponto de coleta</h3>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 22, cursor: 'pointer', lineHeight: 1 }} aria-label="Fechar">×</button>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          <label><input type="radio" name="method" checked={method === 'collect_point'} onChange={() => setMethod('collect_point')} /> Ponto de Coleta</label>
          <label><input type="radio" name="method" checked={method === 'bring_to_yard'} onChange={() => setMethod('bring_to_yard')} /> Vou levar ao pátio</label>
        </div>

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
            <input type="date" value={eta} onChange={e => setEta(e.target.value)} min={minDate} style={{ padding: '8px 10px' }} />
          </div>
        )}

        {error && <div style={{ color: 'red', marginTop: 6 }}>{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', background: '#fafafa' }}>Cancelar</button>
          <button
            type="button"
            disabled={!canSubmit || submitting}
            onClick={async () => {
              try {
                setSubmitting(true);
                setError(null);
                const payload: { method: Method; vehicleIds: string[]; addressId?: string; estimated_arrival_date?: string } = { method, vehicleIds: [vehicle.id] };
                if (method === 'collect_point') payload.addressId = addressId;
                if (method === 'bring_to_yard') payload.estimated_arrival_date = eta;
                await onApply(payload);
                onClose();
              } catch (e: any) {
                setError(e?.message || 'Erro ao aplicar');
              } finally {
                setSubmitting(false);
              }
            }}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #1b5e20', background: '#2e7d32', color: '#fff' }}
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
