'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/modules/common/services/supabaseClient';
import AddressModalBase from '@/modules/common/components/AddressModalBase/AddressModalBase';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { FiEdit } from 'react-icons/fi';
import { SYSTEM_MESSAGES } from '@/modules/common/constants/messages';
import styles from './AddressesList.module.css';
import Checkbox from '../Checkbox/Checkbox';
import { AddressFormValues } from '../../hooks/Address/useAddressForm';

type Address = {
  id: string;
  street: string | null;
  number: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  complement: string | null;
  is_collect_point: boolean;
  is_main_address: boolean;
  created_at?: string;
};

export default function AddressesList() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Address[]>([]);
  const [role, setRole] = useState<'client' | 'partner' | 'specialist' | 'admin'>('client');
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [isCollectPoint, setIsCollectPoint] = useState(false);
  const [isMainAddress, setIsMainAddress] = useState(false);
  const { put } = useAuthenticatedFetch();
  const editingInitialValues = useMemo<Partial<AddressFormValues> | undefined>(() => {
    if (!editing) return undefined;
    return {
      street: editing.street ?? '',
      number: editing.number ?? '',
      neighborhood: editing.neighborhood ?? '',
      city: editing.city ?? '',
      state: editing.state ?? '',
      zip_code: editing.zip_code ?? '',
      complement: editing.complement ?? '',
    } as Partial<AddressFormValues>;
  }, [editing]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const {
          data: { user },
          error: authErr,
        } = await supabase.auth.getUser();
        if (authErr || !user) {
          setError('Não autenticado');
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profile?.role) setRole(profile.role);

        const { data, error } = await supabase
          .from('addresses')
          .select(
            'id, street, number, neighborhood, city, state, zip_code, complement, is_collect_point, is_main_address, created_at'
          )
          .eq('profile_id', user.id)
          .order('is_main_address', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) {
          setError(error.message);
        } else {
          setItems((data as Address[]) || []);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar endereços');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className={styles.loading}>Carregando endereços...</div>;
  if (error) return <div className={styles.error}>Erro: {error}</div>;

  if (!items.length) return <div className={styles.empty}>Nenhum endereço cadastrado.</div>;

  return (
    <div className={styles.list}>
      {items.map(addr => (
        <div key={addr.id} className={styles.addressCard}>
          <div>
            <div className={styles.addressTitle}>
              {addr.street} {addr.number ? `, ${addr.number}` : ''}
            </div>
            <div className={styles.addressSubtitle}>
              {addr.neighborhood} • {addr.city} - {addr.state} • CEP {addr.zip_code}
            </div>
            {addr.complement && (
              <div className={styles.addressComplement}>Compl.: {addr.complement}</div>
            )}
          </div>
          <div className={styles.rightActions}>
            {addr.is_main_address && <span className={styles.badgeMain}>Principal</span>}
            {addr.is_collect_point && <span className={styles.badgeCollect}>Ponto de coleta</span>}
            <button
              aria-label="Editar endereço"
              title="Editar endereço"
              onClick={() => {
                setEditing(addr);
                setIsCollectPoint(!!addr.is_collect_point);
                setIsMainAddress(!!addr.is_main_address);
                setEditOpen(true);
              }}
              className={styles.editButton}
            >
              <FiEdit />
            </button>
          </div>
        </div>
      ))}

      <AddressModalBase
        isOpen={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditing(null);
        }}
        title="Editar Endereço"
        initialValues={editingInitialValues}
        onSubmit={async (values: AddressFormValues) => {
          if (!editing) return { success: false, message: 'Nenhum endereço selecionado' };
          const res = await put<{ success: boolean; message?: string }>(
            '/api/client/update-address',
            {
              id: editing.id,
              ...values,
              is_collect_point: role === 'client' ? isCollectPoint : editing.is_collect_point,
              is_main_address: role === 'client' ? isMainAddress : editing.is_main_address,
            }
          );
          if (res.ok && res.data?.success) {
            // reload addresses without unmounting the modal/success
            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (user) {
              const { data } = await supabase
                .from('addresses')
                .select(
                  'id, street, number, neighborhood, city, state, zip_code, complement, is_collect_point, is_main_address, created_at'
                )
                .eq('profile_id', user.id)
                .order('is_main_address', { ascending: false })
                .order('created_at', { ascending: false });
              setItems((data as Address[]) || []);
            }
            return { success: true, message: SYSTEM_MESSAGES.UPDATE_SUCCESS };
          }
          return { success: false, message: res.error || 'Erro ao atualizar endereço' };
        }}
        renderExtraFields={({ loading }) =>
          role === 'client' ? (
            <div className={styles.checkboxGroup}>
              <Checkbox
                id="isMainAddress"
                name="isMainAddress"
                label="Definir como endereço principal"
                checked={isMainAddress}
                onChange={checked => setIsMainAddress(checked)}
                disabled={loading}
              />
              <Checkbox
                id="isCollectPoint"
                name="isCollectPoint"
                label="É ponto de coleta"
                checked={isCollectPoint}
                onChange={checked => setIsCollectPoint(checked)}
                disabled={loading}
              />
            </div>
          ) : undefined
        }
      />
    </div>
  );
}
