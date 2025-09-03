'use client';
import React, { useEffect, useState } from 'react';
import Header from '@/modules/admin/components/Header';
import { supabase } from '@/modules/common/services/supabaseClient';
import ProfilePageBase from '@/modules/common/components/ProfilePageBase';
import AddressesList from '@/modules/common/components/AddressesList/AddressesList';
import AddressModalBase from '@/modules/common/components/AddressModalBase/AddressModalBase';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { Loading } from '@/modules/common/components/Loading/Loading';
import { AddressFormValues } from '@/modules/common/hooks/Address/useAddressForm';
import Checkbox from '@/modules/common/components/Checkbox/Checkbox';

type Role = 'client' | 'partner' | 'specialist' | 'admin';

export default function MeuPerfilPage() {
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('client');
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { post } = useAuthenticatedFetch();
  const [isCollectPoint, setIsCollectPoint] = useState(false);
  const [isMainAddress, setIsMainAddress] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setEmail(user.email || '');
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, role')
            .eq('id', user.id)
            .single();
          if (profile) {
            setFullName(profile.full_name || '');
            setRole((profile.role as Role) || 'client');
          }
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header />
      {loading ? (
        <Loading />
      ) : (
        <ProfilePageBase
          fullName={fullName}
          email={email}
          role={role}
          showAddresses={role === 'client' || role === 'partner'}
          addressesNode={<AddressesList key={refreshKey} />}
          addressesActionsNode={
            role === 'client' || role === 'partner' ? (
              <button
                onClick={() => setShowAddAddress(true)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: '#002e4c',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Adicionar Endereço
              </button>
            ) : null
          }
        />
      )}

      <AddressModalBase
        isOpen={showAddAddress}
        onClose={() => {
          setShowAddAddress(false);
          setIsCollectPoint(false);
          setIsMainAddress(false);
        }}
        title="Adicionar Endereço"
        onSubmit={async (values: AddressFormValues) => {
          const res = await post<{ success: boolean; message?: string }>(
            '/api/client/create-address',
            {
              ...values,
              is_collect_point: role === 'client' ? isCollectPoint : false,
              is_main_address: role === 'client' ? isMainAddress : false,
            }
          );
          if (res.ok && res.data?.success) {
            setRefreshKey(k => k + 1);
            setIsCollectPoint(false);
            setIsMainAddress(false);
            return { success: true, message: 'Endereço criado com sucesso!' };
          }
          return { success: false, message: res.error || 'Erro ao criar endereço' };
        }}
        renderExtraFields={({ loading }) =>
          role === 'client' ? (
            <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
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
