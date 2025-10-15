'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/modules/admin/components/Header';
import { Loading } from '@/modules/common/components/Loading/Loading';

// Hooks
import { useToast } from './hooks/useToast';
import { useExecutionData } from './hooks/useExecutionData';
import { useEvidenceManager } from './hooks/useEvidenceManager';
import { useImageUpload } from './hooks/useImageUpload';
import { useServiceStart } from './hooks/useServiceStart';
import { useServiceCompletion } from './hooks/useServiceCompletion';
import { useExecutionFinalize } from './hooks/useExecutionFinalize';

// Components
import { LoadingState } from './components/LoadingState';
import { ExecutionHeader } from './components/ExecutionHeader';
import { EmptyState } from './components/EmptyState';
import { ServiceCard } from './components/ServiceCard';
import { FinalizeActions } from './components/FinalizeActions';
import { Toast } from './components/Toast';

import styles from './page.module.css';

function ExecutionEvidenceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quoteId = searchParams.get('quoteId');

  // Hooks
  const { toast, showToast } = useToast();
  const { loading, services, vehicleInfo, setServices, reloadData } = useExecutionData(quoteId);
  const { addEvidence, removeEvidence, updateEvidenceDescription } =
    useEvidenceManager(setServices);
  const { uploading, uploadImage } = useImageUpload(quoteId);
  const { starting, startService } = useServiceStart(quoteId);
  const { completing, completeService } = useServiceCompletion(quoteId);
  const { finalizing, finalize, saveProgress } = useExecutionFinalize(quoteId);

  // Handlers
  const handleBack = () => router.push('/dashboard');

  const handleStartService = async (serviceId: string, serviceName: string) => {
    const result = await startService(serviceId, serviceName);

    if (result.success) {
      showToast(result.message!, 'success');
      await reloadData();
    } else {
      showToast(result.error || 'Erro ao iniciar serviço', 'error');
    }
  };

  const handleImageUpload = async (serviceId: string, file: File) => {
    const result = await uploadImage(serviceId, file);

    if (result.success && result.url) {
      addEvidence(serviceId, result.url);
      showToast('Imagem carregada com sucesso', 'success');
    } else {
      showToast(result.error || 'Erro ao fazer upload', 'error');
    }
  };

  const handleCompleteService = async (serviceId: string, serviceName: string) => {
    const result = await completeService(serviceId, serviceName);

    if (result.success) {
      showToast(result.message!, 'success');
      await reloadData();
    } else {
      showToast(result.error || 'Erro ao concluir serviço', 'error');
    }
  };

  const handleSave = async () => {
    const result = await saveProgress(services);

    if (result.success) {
      showToast(result.message!, 'success');
      await reloadData();
    } else {
      showToast(result.error || 'Erro ao salvar', 'error');
    }
  };

  const handleFinalize = async () => {
    const result = await finalize(services);

    if (result.success) {
      showToast(result.message!, 'success');
    } else {
      showToast(result.error || 'Erro ao finalizar', 'error');
    }
  };

  // Check for missing quoteId
  if (!quoteId) {
    router.push('/dashboard');
    return null;
  }

  // Loading state
  if (loading) {
    return <LoadingState />;
  }

  // Main render
  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.container}>
        <ExecutionHeader vehicleInfo={vehicleInfo} onBack={handleBack} />

        {services.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {services.map((service, index) => (
              <ServiceCard
                key={service.id}
                service={service}
                serviceIndex={index}
                onStart={() => handleStartService(service.id, service.description)}
                onImageUpload={file => handleImageUpload(service.id, file)}
                onComplete={() => handleCompleteService(service.id, service.description)}
                onEvidenceDescriptionChange={(evidenceIndex, desc) =>
                  updateEvidenceDescription(service.id, evidenceIndex, desc)
                }
                onEvidenceRemove={evidenceIndex => removeEvidence(service.id, evidenceIndex)}
                starting={starting}
                uploading={uploading}
                completing={completing}
              />
            ))}

            <FinalizeActions
              services={services}
              onSave={handleSave}
              onFinalize={handleFinalize}
              saving={finalizing}
            />
          </>
        )}
      </main>

      <Toast toast={toast} />
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
