'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useChecklistTemplate } from '@/modules/partner/hooks/useChecklistTemplate';
import { DynamicChecklistForm } from '@/modules/partner/components/checklist/DynamicChecklistForm';
import { ToastProvider } from '@/modules/partner/components/toast/ToastProvider';
import { Loading } from '@/modules/common/components/Loading/Loading';
import { supabase } from '@/modules/common/services/supabaseClient';

/**
 * ChecklistV2Page - Nova página de checklist usando sistema dinâmico de templates
 *
 * Esta página substitui o formulário hard-coded pelo sistema baseado em templates.
 * O template é carregado automaticamente baseado na categoria do parceiro.
 *
 * Fluxo:
 * 1. Usuário acessa com ?vehicleId=XXX&quoteId=YYY
 * 2. Hook useChecklistTemplate chama /api/partner/checklist/init
 * 3. Backend retorna template baseado na categoria do parceiro
 * 4. DynamicChecklistForm renderiza campos dinamicamente
 * 5. Usuário preenche e submete
 * 6. Dados são enviados para /api/partner/checklist/submit
 */
const ChecklistV2Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const vehicleId = searchParams.get('vehicleId');
  const quoteId = searchParams.get('quoteId');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Carrega o template baseado no veículo/quote
  const {
    template,
    loading,
    error: templateError,
    category,
  } = useChecklistTemplate(vehicleId || '', quoteId || undefined);

  const handleSubmit = async (formData: Record<string, unknown>) => {
    if (!vehicleId) {
      setError('ID do veículo não encontrado');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Verificar categoria do parceiro para determinar qual endpoint usar
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) throw new Error('Usuário não autenticado');

      const { data: partnerData, error: partnerError } = await supabase
        .from('partners')
        .select('category')
        .eq('profile_id', userId)
        .single();

      if (partnerError) {
        throw new Error('Erro ao verificar categoria do parceiro');
      }

      const partnerCategory = partnerData?.category;

      let response: Response;
      let data: { success?: boolean; error?: string };

      if (partnerCategory === 'Mecânica') {
        // Parceiros de Mecânica usam o endpoint de checklist técnico
        response = await fetch('/api/partner/checklist/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vehicleId,
            quoteId,
            checklistData: formData,
            templateId: template?.id,
          }),
        });
        data = await response.json();
      } else {
        // Outros parceiros salvam anomalias
        const formDataForAnomalies = new FormData();
        formDataForAnomalies.append('vehicle_id', vehicleId);
        if (quoteId) formDataForAnomalies.append('quote_id', quoteId);

        // Converter formData para formato de anomalias
        // Assumindo que formData contém campos como description, photos, etc.
        const anomalies = [
          {
            description: formData.description || formData.observations || 'Anomalia identificada',
            photos: [], // a fazer: implementar upload de fotos se necessário
            partRequest: formData.partRequest || null,
          },
        ];

        formDataForAnomalies.append('anomalies', JSON.stringify(anomalies));

        response = await fetch('/api/partner/checklist/save-anomalies', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sessionData.session?.access_token}`,
          },
          body: formDataForAnomalies,
        });
        data = await response.json();
      }

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar dados');
      }

      setSuccess(
        partnerCategory === 'Mecânica'
          ? 'Checklist salvo com sucesso!'
          : 'Anomalias salvas com sucesso!'
      );

      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.push('/dashboard/partner');
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar dados';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push('/dashboard/partner');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  // Error state
  if (templateError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erro ao Carregar Template</h1>
          <p className="text-gray-700 mb-6">{templateError}</p>
          <button
            onClick={handleBack}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  // No vehicle ID
  if (!vehicleId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Veículo não encontrado</h1>
          <p className="text-gray-700 mb-6">
            Não foi possível identificar o veículo. Por favor, acesse o checklist através do
            dashboard.
          </p>
          <button
            onClick={handleBack}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Voltar ao Dashboard
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Checklist de Vistoria</h1>
                {category && (
                  <p className="mt-1 text-sm text-gray-600">
                    Categoria: <span className="font-semibold">{category}</span>
                  </p>
                )}
              </div>
              {template && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">Template</p>
                  <p className="font-semibold text-gray-900">{template.title}</p>
                  <p className="text-xs text-gray-500">v{template.version}</p>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Messages */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-red-600 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-red-800 font-medium">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-green-600 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-green-800 font-medium">{success}</p>
              </div>
            </div>
          )}

          {/* Dynamic Form */}
          {template ? (
            <DynamicChecklistForm
              vehicleId={vehicleId}
              quoteId={quoteId}
              onSubmit={handleSubmit}
              disabled={saving}
            />
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <svg
                  className="w-6 h-6 text-yellow-600 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                    Template não disponível
                  </h3>
                  <p className="text-yellow-700">
                    Não foi possível carregar o template de checklist para esta categoria. Por
                    favor, entre em contato com o suporte.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ToastProvider>
  );
};

export default ChecklistV2Page;
