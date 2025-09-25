'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { supabase } from '@/modules/common/services/supabaseClient';
import './VehicleCollectionControls.css';
import CollectPointSelect from './CollectPointSelect';
import DatePickerBR from '@/modules/common/components/DatePickerBR/DatePickerBR';

type Vehicle = { id: string; plate: string; status?: string };
type Address = {
  id: string;
  street: string | null;
  number: string | null;
  city: string | null;
  is_collect_point: boolean;
};

type Method = 'collect_point' | 'bring_to_yard';

export default function VehicleCollectionControls() {
  const { get, post } = useAuthenticatedFetch();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [bulkMethod, setBulkMethod] = useState<Method>('collect_point');
  const [bulkAddressId, setBulkAddressId] = useState<string>('');
  const [bulkEta, setBulkEta] = useState<string>('');
  const [savingAll, setSavingAll] = useState(false);

  const [rowMethod, setRowMethod] = useState<Record<string, Method>>({});
  const [rowAddress, setRowAddress] = useState<Record<string, string>>({});
  const [rowEta, setRowEta] = useState<Record<string, string>>({});
  const [savingRow, setSavingRow] = useState<Record<string, boolean>>({});

  const collectAddresses = useMemo(() => addresses.filter(a => a.is_collect_point), [addresses]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const resp = await get<{ vehicles?: Vehicle[]; data?: any }>('/api/client/vehicles-count');
        if (resp.ok) {
          const list = (resp.data?.vehicles || resp.data?.data?.vehicles || []) as Vehicle[];
          setVehicles(list);
        } else {
          setError(resp.error || 'Erro ao listar veículos');
        }

        const { data: auth } = await supabase.auth.getUser();
        const uid = auth.user?.id;
        if (uid) {
          const { data: addrs, error: addrErr } = await supabase
            .from('addresses')
            .select('id, street, number, city, is_collect_point')
            .eq('profile_id', uid)
            .order('created_at', { ascending: false });
          if (addrErr) setError(addrErr.message);
          else setAddresses((addrs as Address[]) || []);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [get]);

  const applyBulk = async () => {
    try {
      setSavingAll(true);
      const payload: any = { method: bulkMethod };
      if (bulkMethod === 'collect_point') payload.addressId = bulkAddressId;
      else payload.estimated_arrival_date = bulkEta;
      const resp = await post('/api/client/set-vehicles-collection', payload);
      if (!resp.ok) throw new Error(resp.error || 'Erro ao aplicar');
    } catch (e) {
      console.error(e);
    } finally {
      setSavingAll(false);
    }
  };

  const applyRow = async (v: Vehicle) => {
    try {
      setSavingRow(prev => ({ ...prev, [v.id]: true }));
      const method = rowMethod[v.id] || 'collect_point';
      const payload: any = { method, vehicleIds: [v.id] };
      if (method === 'collect_point') payload.addressId = rowAddress[v.id];
      else payload.estimated_arrival_date = rowEta[v.id];
      const resp = await post('/api/client/set-vehicles-collection', payload);
      if (!resp.ok) throw new Error(resp.error || 'Erro ao aplicar');
    } catch (e) {
      console.error(e);
    } finally {
      setSavingRow(prev => ({ ...prev, [v.id]: false }));
    }
  };

  if (loading) return <div>Carregando opções de coleta...</div>;
  if (error) return <div className="vcc-error">{error}</div>;
  if (vehicles.length === 0) return null;

  return (
    <div className="vcc">
      <h3 className="vcc-title">Opção de Coleta/Entrega</h3>

      <div className="vcc-grid">
        <div className="vcc-flex">
          <label className="vcc-inline">
            <input
              type="radio"
              name="bulkMethod"
              checked={bulkMethod === 'collect_point'}
              onChange={() => setBulkMethod('collect_point')}
            />
            Usar Ponto de Coleta
          </label>
          <label className="vcc-inline">
            <input
              type="radio"
              name="bulkMethod"
              checked={bulkMethod === 'bring_to_yard'}
              onChange={() => setBulkMethod('bring_to_yard')}
            />
            Vou levar a um pátio ProLine
          </label>
        </div>

        {bulkMethod === 'collect_point' ? (
          <div className="vcc-inline">
            <CollectPointSelect
              addresses={collectAddresses as any}
              value={bulkAddressId}
              onChange={setBulkAddressId}
              className="vcc-select"
            />
            <button className="vcc-btn" onClick={applyBulk} disabled={savingAll || !bulkAddressId}>
              Aplicar a todos
            </button>
          </div>
        ) : (
          <div className="vcc-inline">
            <DatePickerBR
              valueIso={bulkEta}
              minIso={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`}
              onChangeIso={setBulkEta}
              inputClass="vcc-input"
              buttonClass="vcc-btn"
            />
            <button className="vcc-btn" onClick={applyBulk} disabled={savingAll || !bulkEta}>
              Aplicar a todos
            </button>
          </div>
        )}
      </div>

      <div className="vcc-rows">
        {vehicles.map(v => (
          <div key={v.id} className="vcc-row">
            <div className="vcc-plate">{v.plate}</div>
            <div>
              <select
                className="vcc-select"
                value={rowMethod[v.id] || 'collect_point'}
                onChange={e =>
                  setRowMethod(prev => ({ ...prev, [v.id]: e.target.value as Method }))
                }
              >
                <option value="collect_point">Ponto de Coleta</option>
                <option value="bring_to_yard">Vou levar ao pátio</option>
              </select>
            </div>
            {rowMethod[v.id] === 'bring_to_yard' ? (
              <DatePickerBR
                valueIso={rowEta[v.id] || ''}
                minIso={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`}
                onChangeIso={iso => setRowEta(prev => ({ ...prev, [v.id]: iso }))}
                inputClass="vcc-input"
                buttonClass="vcc-btn"
              />
            ) : (
              <CollectPointSelect
                addresses={collectAddresses as any}
                value={rowAddress[v.id] || ''}
                onChange={val => setRowAddress(prev => ({ ...prev, [v.id]: val }))}
                className="vcc-select"
                placeholder="Selecione um ponto"
              />
            )}
            <div>
              <button
                className="vcc-btn"
                onClick={() => applyRow(v)}
                disabled={
                  !!savingRow[v.id] ||
                  (rowMethod[v.id] === 'collect_point' && !rowAddress[v.id]) ||
                  (rowMethod[v.id] === 'bring_to_yard' && !rowEta[v.id])
                }
              >
                Salvar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
