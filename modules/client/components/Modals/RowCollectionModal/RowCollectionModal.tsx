'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './RowCollectionModal.css';
import DatePickerBR from '@/modules/common/components/DatePickerBR/DatePickerBR';
import CollectPointSelect from '../../CollectPointSelect';
import Modal from '@/modules/common/components/Modal/Modal';
import Radio from '@/modules/common/components/Radio/Radio';
import Select from '@/modules/common/components/Select/Select';
import { OutlineButton } from '@/modules/common/components/OutlineButton/OutlineButton';
import { SolidButton } from '@/modules/common/components/SolidButton/SolidButton';

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
  onApply: (payload: {
    method: Method;
    vehicleIds: string[];
    addressId?: string;
    estimated_arrival_date?: string;
  }) => Promise<void>;
}

const RowCollectionModal: React.FC<RowCollectionModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  addresses,
  minDate,
  onApply,
}) => {
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
    return () => {
      document.body.style.overflow = prev;
    };
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
    if (method === 'collect_point') return !!addressId && !!etaIso;
    if (method === 'bring_to_yard') return !!etaIso;
    return false;
  }, [method, addressId, etaIso]);

  const compareISO = (a: string, b: string) => {
    // comparação lexicográfica funciona para YYYY-MM-DD
    return a.localeCompare(b);
  };

  const addressOptions = addresses.map(addr => ({
    value: addr.id,
    label: `${addr.street || '-'}${addr.number ? ', ' + addr.number : ''} - ${addr.city || '-'}`,
  }));

  if (!isOpen) return null;

  const node = (
    <div role="dialog" aria-modal="true" aria-labelledby="rcm-title">
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Editar ponto de coleta"
        size="md"
        showCloseButton
      >
        <div className="rcm-method-row">
          <Radio
            name="method"
            value="collect_point"
            checked={method === 'collect_point'}
            onChange={v => setMethod(v as Method)}
            label="Ponto de coleta"
          />
          <Radio
            name="method"
            value="bring_to_yard"
            checked={method === 'bring_to_yard'}
            onChange={v => setMethod(v as Method)}
            label="Vou levar ao pátio"
          />
        </div>

        {method === 'collect_point' ? (
          <>
            <div className="rcm-form-group">
              <label className="rcm-label">Ponto de coleta</label>
              <Select
                id="collect-point"
                name="collect-point"
                value={addressId}
                onChange={e => setAddressId(e.target.value)}
                options={addressOptions}
                placeholder="Selecione um ponto"
                className="rcm-select"
              />
            </div>
            <div className="rcm-form-group">
              <label className="rcm-label">Data preferencial de coleta</label>
              <DatePickerBR
                valueIso={etaIso}
                minIso={minDate}
                onChangeIso={iso => {
                  setEtaIso(iso);
                  if (iso && minDate && compareISO(iso, minDate) < 0) {
                    setError(
                      `A data não pode ser anterior a ${minDate.split('-').reverse().join('/')}`
                    );
                  } else {
                    setError(null);
                  }
                }}
                ariaLabel="Data preferencial de coleta (dd/mm/aaaa)"
              />
            </div>
          </>
        ) : (
          <div className="rcm-form-group">
            <label className="rcm-label">Data prevista de chegada ao pátio</label>
            <DatePickerBR
              valueIso={etaIso}
              minIso={minDate}
              onChangeIso={iso => {
                setEtaIso(iso);
                if (iso && minDate && compareISO(iso, minDate) < 0) {
                  setError(
                    `A data não pode ser anterior a ${minDate.split('-').reverse().join('/')}`
                  );
                } else {
                  setError(null);
                }
              }}
              ariaLabel="Data prevista de chegada ao pátio (dd/mm/aaaa)"
            />
          </div>
        )}

        {error && <div className="rcm-error">{error}</div>}

        <div className="rcm-actions">
          <OutlineButton onClick={onClose}>Cancelar</OutlineButton>
          <SolidButton
            onClick={async () => {
              try {
                setSubmitting(true);
                setError(null);
                const payload: {
                  method: Method;
                  vehicleIds: string[];
                  addressId?: string;
                  estimated_arrival_date?: string;
                } = { method, vehicleIds: [vehicle.id] };

                if (method === 'collect_point') {
                  if (!addressId) throw new Error('Selecione um ponto de coleta');
                  if (!etaIso) throw new Error('Informe a data preferencial de coleta');
                  if (minDate && compareISO(etaIso, minDate) < 0) {
                    throw new Error(
                      `A data não pode ser anterior a ${minDate.split('-').reverse().join('/')}`
                    );
                  }
                  payload.addressId = addressId;
                  payload.estimated_arrival_date = etaIso;
                }
                if (method === 'bring_to_yard') {
                  if (!etaIso) throw new Error('Informe uma data válida no formato dd/mm/aaaa');
                  if (minDate && compareISO(etaIso, minDate) < 0) {
                    throw new Error(
                      `A data não pode ser anterior a ${minDate.split('-').reverse().join('/')}`
                    );
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
            disabled={!canSubmit || submitting}
          >
            Salvar
          </SolidButton>
        </div>
      </Modal>
    </div>
  );

  return createPortal(node, document.body);
};

export default RowCollectionModal;
