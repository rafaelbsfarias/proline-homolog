'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/modules/admin/components/Header';
import { Loading } from '@/modules/common/components/Loading/Loading';
import { supabase } from '@/modules/common/services/supabaseClient';
import { FaCamera, FaTrash, FaCheck, FaSave } from 'react-icons/fa';
import { getLogger } from '@/modules/logger';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

type QuoteItem = {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  completed_at?: string | null;
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
  const logger = getLogger('partner:execution-evidence');
  const { get, post } = useAuthenticatedFetch();

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
      logger.warn('missing_quote_id');
      showToast('ID do orçamento não fornecido', 'error');
      router.push('/dashboard');
      return;
    }

    loadQuoteData();
  }, [quoteId]);

  const loadQuoteData = async () => {
    try {
      setLoading(true);

      // Buscar dados consolidados usando API interna (usa Admin client e valida aprovação)
      logger.info('load_service_order_start', { quoteId });
      const resp = await get<{ ok: boolean; serviceOrder?: unknown; error?: string }>(
        `/api/partner/service-order/${quoteId}`,
        { requireAuth: true }
      );
      if (!resp.ok) {
        logger.error('load_service_order_failed', {
          status: resp.status,
          error: resp.error,
          quoteId,
        });
        showToast(resp.error || 'Falha ao carregar ordem de serviço', 'error');
        setServices([]);
        return;
      }
      const json = resp.data || {};
      logger.debug('load_service_order_response', {
        keys: Object.keys((json as Record<string, unknown>) || {}),
      });
      const serviceOrder = (json as Record<string, unknown>)?.serviceOrder as
        | {
            vehicle: { plate: string; brand: string; model: string };
            items: {
              id: string;
              description: string;
              quantity: number;
              completed_at?: string | null;
            }[];
            evidences?: Array<{
              id: string;
              quote_item_id: string;
              image_url: string;
              description: string | null;
              uploaded_at: string;
            }>;
          }
        | undefined;

      if (!serviceOrder) {
        logger.info('no_items_in_service_order');
        setServices([]);
        showToast('Nenhum serviço encontrado neste orçamento', 'info');
        return;
      }

      // Veículo
      setVehicleInfo({
        plate: serviceOrder.vehicle?.plate || '',
        brand: serviceOrder.vehicle?.brand || '',
        model: serviceOrder.vehicle?.model || '',
      });

      // Itens do orçamento
      const items = serviceOrder.items || [];
      logger.info('items_loaded', { count: items.length });

      // Evidências existentes (vêm da API agora)
      const existingEvidences = serviceOrder.evidences || [];
      logger.info('existing_evidences_loaded', { count: existingEvidences.length });

      // Mapear evidências por item
      const evidencesByItem = new Map<string, Evidence[]>();
      existingEvidences.forEach(ev => {
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
      const servicesWithEvidences: ServiceWithEvidences[] = (items || []).map(
        (item: {
          id: string;
          description?: string;
          quantity?: number;
          unit_price?: number;
          total_price?: number;
          completed_at?: string | null;
        }) => ({
          id: item.id,
          description: item.description || '',
          quantity: item.quantity || 0,
          unit_price: Number(item.unit_price ?? 0),
          total_price: Number(item.total_price ?? 0),
          completed_at: item.completed_at,
          evidences: evidencesByItem.get(item.id) || [],
        })
      );

      setServices(servicesWithEvidences);
      logger.info('services_ready', { count: servicesWithEvidences.length });

      // Log para debug
      if (servicesWithEvidences.length === 0) {
        showToast('Nenhum serviço encontrado neste orçamento', 'info');
      }
    } catch (e) {
      logger.error('load_quote_data_error', { error: e instanceof Error ? e.message : String(e) });
      showToast('Erro ao carregar dados do orçamento', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (serviceId: string, file: File) => {
    try {
      logger.info('upload_image_start', { serviceId, size: file.size, type: file.type });
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        logger.warn('upload_image_no_user');
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
      logger.info('upload_image_success', { serviceId });
    } catch (e) {
      logger.error('upload_image_error', { error: e instanceof Error ? e.message : String(e) });
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
      logger.info('save_evidences_start');

      if (!quoteId) {
        showToast('ID do orçamento não encontrado', 'error');
        return;
      }

      // Coletar todas as evidências (estado atual substitui completamente no banco)
      const allEvidences = services.flatMap(service =>
        service.evidences.map(ev => ({
          quote_item_id: service.id,
          image_url: ev.image_url,
          description: ev.description || null,
        }))
      );
      logger.info('save_evidences_prepared', { count: allEvidences.length });

      // Usar API que usa admin client (bypassa RLS) com autenticação
      const response = await post<{ ok: boolean; inserted?: number; error?: string }>(
        '/api/partner/execution-evidences',
        {
          quote_id: quoteId,
          evidences: allEvidences,
        },
        { requireAuth: true }
      );

      if (!response.ok || !response.data?.ok) {
        logger.error('save_evidences_api_error', {
          status: response.status,
          error: response.error || response.data?.error,
        });
        showToast(response.error || response.data?.error || 'Erro ao salvar evidências', 'error');
        return;
      }

      showToast('Evidências salvas com sucesso', 'success');
      logger.info('save_evidences_success', { inserted: response.data?.inserted });

      // Recarregar dados para mostrar evidências salvas
      await loadQuoteData();
    } catch (e) {
      logger.error('save_evidences_error', { error: e instanceof Error ? e.message : String(e) });
      showToast('Erro ao salvar evidências', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteService = async (serviceId: string, serviceName: string) => {
    try {
      setSaving(true);
      logger.info('complete_service_start', { serviceId, serviceName });

      const response = await post<{
        ok: boolean;
        completed_at?: string;
        all_services_completed?: boolean;
        error?: string;
      }>(
        '/api/partner/complete-service',
        {
          quote_id: quoteId,
          quote_item_id: serviceId,
        },
        { requireAuth: true }
      );

      if (!response.ok || !response.data?.ok) {
        logger.error('complete_service_api_error', {
          status: response.status,
          error: response.error || response.data?.error,
        });
        showToast(
          response.error || response.data?.error || 'Erro ao marcar serviço como concluído',
          'error'
        );
        return;
      }

      const message = response.data?.all_services_completed
        ? '✅ Serviço concluído! Todos os serviços foram finalizados.'
        : `✅ Serviço "${serviceName}" marcado como concluído`;

      showToast(message, 'success');
      logger.info('complete_service_success', {
        serviceId,
        completed_at: response.data?.completed_at,
        all_completed: response.data?.all_services_completed,
      });

      // Recarregar dados para atualizar status
      await loadQuoteData();
    } catch (e) {
      logger.error('complete_service_error', { error: e instanceof Error ? e.message : String(e) });
      showToast('Erro ao marcar serviço como concluído', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    try {
      setSaving(true);
      logger.info('finalize_execution_start');

      if (!quoteId) {
        showToast('ID do orçamento não encontrado', 'error');
        return;
      }

      // VALIDAÇÃO: Verificar se todos os serviços têm pelo menos uma evidência
      const servicesWithoutEvidences = services.filter(service => service.evidences.length === 0);

      if (servicesWithoutEvidences.length > 0) {
        const serviceNames = servicesWithoutEvidences.map(s => `"${s.description}"`).join(', ');

        showToast(
          `❌ Não é possível finalizar: os seguintes serviços não possuem evidências: ${serviceNames}`,
          'error'
        );
        logger.warn('finalize_blocked_missing_evidences', {
          servicesWithoutEvidences: servicesWithoutEvidences.map(s => ({
            id: s.id,
            description: s.description,
          })),
        });
        return;
      }

      // VALIDAÇÃO: Verificar se todos os serviços estão concluídos
      const servicesNotCompleted = services.filter(service => !service.completed_at);

      if (servicesNotCompleted.length > 0) {
        const serviceNames = servicesNotCompleted.map(s => `"${s.description}"`).join(', ');

        showToast(
          `❌ Não é possível finalizar: os seguintes serviços não foram marcados como concluídos: ${serviceNames}`,
          'error'
        );
        logger.warn('finalize_blocked_services_not_completed', {
          servicesNotCompleted: servicesNotCompleted.map(s => ({
            id: s.id,
            description: s.description,
          })),
        });
        return;
      }

      // Salvar evidências primeiro
      await handleSave();

      // Finalizar execução via API (atualiza vehicle status e timeline)
      const response = await post<{
        ok: boolean;
        completed_at?: string;
        vehicle_status?: string;
        error?: string;
      }>('/api/partner/finalize-execution', { quote_id: quoteId }, { requireAuth: true });

      if (!response.ok || !response.data?.ok) {
        logger.error('finalize_execution_api_error', {
          status: response.status,
          error: response.error || response.data?.error,
        });
        showToast(response.error || response.data?.error || 'Erro ao finalizar execução', 'error');
        return;
      }

      showToast(
        '✅ Execução finalizada com sucesso! Veículo marcado como "Execução Finalizada"',
        'success'
      );
      logger.info('finalize_execution_success', {
        completed_at: response.data?.completed_at,
        vehicle_status: response.data?.vehicle_status,
      });

      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (e) {
      logger.error('finalize_execution_error', {
        error: e instanceof Error ? e.message : String(e),
      });
      showToast('Erro ao finalizar execução', 'error');
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
              border: service.completed_at ? '2px solid #10b981' : '1px solid #e5e7eb',
              position: 'relative',
            }}
          >
            {service.completed_at && (
              <div
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  background: '#10b981',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <FaCheck size={12} />
                Concluído
              </div>
            )}

            <h3
              style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                marginBottom: 16,
                color: '#333',
                paddingRight: 100,
              }}
            >
              {serviceIndex + 1}. {service.description}
            </h3>

            {/* Alerta se serviço não tem evidências */}
            {!service.completed_at && service.evidences.length === 0 && (
              <div
                style={{
                  background: '#fef3c7',
                  border: '1px solid #fbbf24',
                  color: '#92400e',
                  padding: '12px 16px',
                  borderRadius: 6,
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: '14px',
                }}
              >
                <span style={{ fontSize: '18px' }}>⚠️</span>
                <span>
                  <strong>Atenção:</strong> Este serviço precisa de pelo menos uma evidência antes
                  da finalização
                </span>
              </div>
            )}

            {!service.completed_at && (
              <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
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

                <button
                  onClick={() => handleCompleteService(service.id, service.description)}
                  disabled={saving}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 16px',
                    background: saving ? '#ccc' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  <FaCheck size={16} />
                  Marcar como Concluído
                </button>
              </div>
            )}

            {service.completed_at && (
              <p
                style={{
                  color: '#10b981',
                  fontSize: '14px',
                  marginBottom: 16,
                  fontStyle: 'italic',
                }}
              >
                ✓ Serviço concluído em {new Date(service.completed_at).toLocaleString('pt-BR')}
              </p>
            )}

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

          {(() => {
            const servicesWithoutEvidences = services.filter(s => s.evidences.length === 0);
            const servicesNotCompleted = services.filter(s => !s.completed_at);
            const canFinalize =
              servicesWithoutEvidences.length === 0 && servicesNotCompleted.length === 0;

            let tooltipMessage = '';
            if (servicesWithoutEvidences.length > 0) {
              tooltipMessage = `${servicesWithoutEvidences.length} serviço(s) sem evidências`;
            } else if (servicesNotCompleted.length > 0) {
              tooltipMessage = `${servicesNotCompleted.length} serviço(s) não concluído(s)`;
            }

            return (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <button
                  onClick={handleFinalize}
                  disabled={saving || !canFinalize}
                  title={!canFinalize ? tooltipMessage : 'Finalizar execução do orçamento'}
                  style={{
                    padding: '12px 24px',
                    background: saving || !canFinalize ? '#ccc' : '#072e4c',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: saving || !canFinalize ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    opacity: !canFinalize ? 0.6 : 1,
                  }}
                >
                  <FaCheck size={16} />
                  {saving ? 'Finalizando...' : 'Finalizar Execução'}
                </button>
                {!canFinalize && !saving && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-30px',
                      right: 0,
                      background: '#ef4444',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: 6,
                      fontSize: '12px',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }}
                  >
                    ⚠️ {tooltipMessage}
                  </div>
                )}
              </div>
            );
          })()}
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
