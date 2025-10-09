'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/modules/admin/components/Header';
import { Loading } from '@/modules/common/components/Loading/Loading';
import { supabase } from '@/modules/common/services/supabaseClient';
import { FaCamera, FaTrash, FaCheck, FaSave } from 'react-icons/fa';

type QuoteItem = {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
};

type Evidence = {
  id?: string;
  quote_item_id: string;
  image_url: string;
  description: string;
  uploaded_at?: string;
};

type ServiceWithEvidences = QuoteItem & {
  evidences: Evidence[];
};

function ExecutionEvidenceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quoteId = searchParams.get('quoteId');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<ServiceWithEvidences[]>([]);
  const [vehicleInfo, setVehicleInfo] = useState<{ plate: string; brand: string; model: string }>({
    plate: '',
    brand: '',
    model: '',
  });

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ show: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  useEffect(() => {
    if (!quoteId) {
      showToast('ID do orçamento não fornecido', 'error');
      router.push('/dashboard');
      return;
    }

    loadQuoteData();
  }, [quoteId]);

  const loadQuoteData = async () => {
    try {
      setLoading(true);

      // Buscar informações do veículo
      const { data: quoteData } = await supabase
        .from('quotes')
        .select(
          `
          service_orders (
            vehicles (
              license_plate,
              brand,
              model
            )
          )
        `
        )
        .eq('id', quoteId)
        .single();

      if (quoteData?.service_orders) {
        const serviceOrder = quoteData.service_orders as {
          vehicles: { license_plate: string; brand: string; model: string };
        };
        const vehicle = serviceOrder.vehicles;
        setVehicleInfo({
          plate: vehicle?.license_plate || '',
          brand: vehicle?.brand || '',
          model: vehicle?.model || '',
        });
      }

      // Buscar itens do orçamento
      const { data: items, error: itemsError } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', quoteId)
        .order('created_at', { ascending: true });

      if (itemsError) throw itemsError;

      // Buscar evidências existentes
      const { data: existingEvidences, error: evidencesError } = await supabase
        .from('execution_evidences')
        .select('*')
        .in('quote_item_id', items?.map(i => i.id) || []);

      if (evidencesError) throw evidencesError;

      // Mapear evidências por item
      const evidencesByItem = new Map<string, Evidence[]>();
      existingEvidences?.forEach(ev => {
        if (!evidencesByItem.has(ev.quote_item_id)) {
          evidencesByItem.set(ev.quote_item_id, []);
        }
        evidencesByItem.get(ev.quote_item_id)!.push({
          id: ev.id,
          quote_item_id: ev.quote_item_id,
          image_url: ev.image_url,
          description: ev.description || '',
          uploaded_at: ev.uploaded_at,
        });
      });

      // Combinar dados
      const servicesWithEvidences: ServiceWithEvidences[] =
        items?.map(item => ({
          id: item.id,
          description: item.description || '',
          quantity: item.quantity || 0,
          unit_price: item.unit_price || 0,
          total_price: item.total_price || 0,
          evidences: evidencesByItem.get(item.id) || [],
        })) || [];

      setServices(servicesWithEvidences);

      // Log para debug
      if (servicesWithEvidences.length === 0) {
        showToast('Nenhum serviço encontrado neste orçamento', 'info');
      }
    } catch {
      showToast('Erro ao carregar dados do orçamento', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (serviceId: string, file: File) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        showToast('Usuário não autenticado', 'error');
        return;
      }

      // Upload da imagem para o Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${quoteId}/${serviceId}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('execution-evidences')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from('execution-evidences').getPublicUrl(fileName);

      // Adicionar evidência temporariamente ao estado
      setServices(prev =>
        prev.map(service =>
          service.id === serviceId
            ? {
                ...service,
                evidences: [
                  ...service.evidences,
                  {
                    quote_item_id: serviceId,
                    image_url: publicUrl,
                    description: '',
                  },
                ],
              }
            : service
        )
      );

      showToast('Imagem carregada com sucesso', 'success');
    } catch {
      showToast('Erro ao fazer upload da imagem', 'error');
    }
  };

  const handleRemoveEvidence = (serviceId: string, evidenceIndex: number) => {
    setServices(prev =>
      prev.map(service =>
        service.id === serviceId
          ? {
              ...service,
              evidences: service.evidences.filter((_, idx) => idx !== evidenceIndex),
            }
          : service
      )
    );
  };

  const handleEvidenceDescriptionChange = (
    serviceId: string,
    evidenceIndex: number,
    description: string
  ) => {
    setServices(prev =>
      prev.map(service =>
        service.id === serviceId
          ? {
              ...service,
              evidences: service.evidences.map((ev, idx) =>
                idx === evidenceIndex ? { ...ev, description } : ev
              ),
            }
          : service
      )
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Coletar todas as evidências
      const allEvidences = services.flatMap(service =>
        service.evidences.map(ev => ({
          quote_item_id: service.id,
          image_url: ev.image_url,
          description: ev.description || null,
          quote_id: quoteId,
        }))
      );

      // Deletar evidências antigas
      const { error: deleteError } = await supabase
        .from('execution_evidences')
        .delete()
        .in(
          'quote_item_id',
          services.map(s => s.id)
        );

      if (deleteError) throw deleteError;

      // Inserir novas evidências
      if (allEvidences.length > 0) {
        const { error: insertError } = await supabase
          .from('execution_evidences')
          .insert(allEvidences);

        if (insertError) throw insertError;
      }

      showToast('Evidências salvas com sucesso', 'success');
    } catch {
      showToast('Erro ao salvar evidências', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    try {
      setSaving(true);

      // Salvar primeiro
      await handleSave();

      // Marcar como finalizado
      const { error } = await supabase.from('execution_checklists').upsert({
        quote_id: quoteId,
        status: 'completed',
        completed_at: new Date().toISOString(),
      });

      if (error) throw error;

      showToast('Checklist de execução finalizado com sucesso!', 'success');
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch {
      showToast('Erro ao finalizar checklist', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <Header />
        <Loading />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px' }}>
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#072e4c',
              cursor: 'pointer',
              fontSize: '1rem',
              padding: 0,
            }}
          >
            ← Voltar ao Dashboard
          </button>
        </div>

        <div
          style={{
            background: '#fff',
            borderRadius: 10,
            padding: 24,
            marginBottom: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
          }}
        >
          <h1 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: 8, color: '#333' }}>
            Evidências de Execução
          </h1>
          <p style={{ color: '#666', fontSize: '1rem', marginBottom: 16 }}>
            Veículo: {vehicleInfo.plate} - {vehicleInfo.brand} {vehicleInfo.model}
          </p>
        </div>

        {services.length === 0 && !loading ? (
          <div
            style={{
              background: '#fff',
              borderRadius: 10,
              padding: 48,
              marginBottom: 24,
              boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
              textAlign: 'center',
            }}
          >
            <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: 16 }}>
              📋 Nenhum serviço encontrado neste orçamento
            </p>
            <p style={{ color: '#999', fontSize: '0.95rem' }}>
              Este orçamento não possui serviços cadastrados ou ainda não foi completamente
              processado.
            </p>
          </div>
        ) : null}

        {services.map((service, serviceIndex) => (
          <div
            key={service.id}
            style={{
              background: '#fff',
              borderRadius: 10,
              padding: 24,
              marginBottom: 24,
              boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 16, color: '#333' }}>
              {serviceIndex + 1}. {service.description}
            </h3>

            <div style={{ marginBottom: 16 }}>
              <label
                htmlFor={`upload-${service.id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 16px',
                  background: '#3b82f6',
                  color: 'white',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                <FaCamera size={16} />
                Adicionar Foto
              </label>
              <input
                id={`upload-${service.id}`}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImageUpload(service.id, file);
                  }
                }}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: 16,
              }}
            >
              {service.evidences.map((evidence, evidenceIndex) => (
                <div
                  key={evidenceIndex}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={evidence.image_url}
                    alt={`Evidência ${evidenceIndex + 1}`}
                    style={{
                      width: '100%',
                      height: 200,
                      objectFit: 'cover',
                    }}
                  />
                  <div style={{ padding: 12 }}>
                    <textarea
                      placeholder="Descrição da evidência (opcional)"
                      value={evidence.description}
                      onChange={e =>
                        handleEvidenceDescriptionChange(service.id, evidenceIndex, e.target.value)
                      }
                      style={{
                        width: '100%',
                        minHeight: 60,
                        padding: 8,
                        border: '1px solid #e5e7eb',
                        borderRadius: 4,
                        fontSize: '14px',
                        resize: 'vertical',
                        marginBottom: 8,
                      }}
                    />
                    <button
                      onClick={() => handleRemoveEvidence(service.id, evidenceIndex)}
                      style={{
                        width: '100%',
                        padding: '6px 12px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <FaTrash size={12} />
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {service.evidences.length === 0 && (
              <p style={{ color: '#999', fontStyle: 'italic', marginTop: 16 }}>
                Nenhuma evidência adicionada ainda
              </p>
            )}
          </div>
        ))}

        <div
          style={{
            display: 'flex',
            gap: 16,
            justifyContent: 'flex-end',
            marginTop: 32,
          }}
        >
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '12px 24px',
              background: saving ? '#ccc' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <FaSave size={16} />
            {saving ? 'Salvando...' : 'Salvar Progresso'}
          </button>
          <button
            onClick={handleFinalize}
            disabled={saving}
            style={{
              padding: '12px 24px',
              background: saving ? '#ccc' : '#072e4c',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <FaCheck size={16} />
            {saving ? 'Finalizando...' : 'Finalizar Execução'}
          </button>
        </div>
      </main>

      {/* Toast Component */}
      {toast.show && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            background:
              toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : '#3b82f6',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            maxWidth: '400px',
            fontSize: '14px',
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default function ExecutionEvidencePage() {
  return (
    <Suspense fallback={<Loading />}>
      <ExecutionEvidenceContent />
    </Suspense>
  );
}
