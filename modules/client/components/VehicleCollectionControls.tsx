"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { supabase } from '@/modules/common/services/supabaseClient';

type Vehicle = { id: string; plate: string; status?: string };
type Address = { id: string; street: string | null; number: string | null; city: string | null; is_collect_point: boolean };

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
        const resp = await get<{ vehicles?: Vehicle[]; data?: any }>("/api/client/vehicles-count");
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
  if (error) return <div style={{ color: '#b91c1c' }}>{error}</div>;
  if (vehicles.length === 0) return null;

  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>Opção de Coleta/Entrega</h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="radio"
              name="bulkMethod"
              checked={bulkMethod === 'collect_point'}
              onChange={() => setBulkMethod('collect_point')}
            />
            Usar Ponto de Coleta
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              value={bulkAddressId}
              onChange={e => setBulkAddressId(e.target.value)}
            >
              <option value="">Selecione um ponto de coleta</option>
              {collectAddresses.map(a => (
                <option key={a.id} value={a.id}>
                  {a.street} {a.number ? `, ${a.number}` : ''} {a.city ? `- ${a.city}` : ''}
                </option>
              ))}
            </select>
            <button onClick={applyBulk} disabled={savingAll || !bulkAddressId}>
              Aplicar a todos
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="date"
              value={bulkEta}
              onChange={e => setBulkEta(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
            <button onClick={applyBulk} disabled={savingAll || !bulkEta}>
              Aplicar a todos
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {vehicles.map(v => (
          <div key={v.id} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr 120px', gap: 8, alignItems: 'center' }}>
            <div style={{ fontWeight: 600 }}>{v.plate}</div>
            <div>
              <select
                value={rowMethod[v.id] || 'collect_point'}
                onChange={e => setRowMethod(prev => ({ ...prev, [v.id]: e.target.value as Method }))}
              >
                <option value="collect_point">Ponto de Coleta</option>
                <option value="bring_to_yard">Vou levar ao pátio</option>
              </select>
            </div>
            {rowMethod[v.id] === 'bring_to_yard' ? (
              <input
                type="date"
                value={rowEta[v.id] || ''}
                onChange={e => setRowEta(prev => ({ ...prev, [v.id]: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
              />
            ) : (
              <select
                value={rowAddress[v.id] || ''}
                onChange={e => setRowAddress(prev => ({ ...prev, [v.id]: e.target.value }))}
              >
                <option value="">Selecione um ponto</option>
                {collectAddresses.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.street} {a.number ? `, ${a.number}` : ''} {a.city ? `- ${a.city}` : ''}
                  </option>
                ))}
              </select>
            )}
            <div>
              <button
                onClick={() => applyRow(v)}
                disabled={
                  savingRow[v.id] ||
                  (rowMethod[v.id] === 'collect_point' && !(rowAddress[v.id])) ||
                  (rowMethod[v.id] === 'bring_to_yard' && !(rowEta[v.id]))
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

