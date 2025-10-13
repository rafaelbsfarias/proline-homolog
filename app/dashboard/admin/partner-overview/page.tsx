/**
 * Partner Overview Page - Refactored
 *
 * Clean container using extracted hooks and components
 * Reduced from 859 lines to ~200 lines
 */

'use client';

import React, { useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/modules/admin/components/Header';
import { Loading } from '@/modules/common/components/Loading/Loading';
import Modal from '@/modules/common/components/Modal/Modal';
import QuoteReviewModal from '@/modules/admin/components/QuoteReviewModal';
import { ChecklistViewer } from '@/modules/vehicles/components/ChecklistViewer';
import { usePartnerChecklist } from '@/modules/vehicles/hooks/usePartnerChecklist';
import { supabase } from '@/modules/common/services/supabaseClient';
import { formatQuoteStatus } from '@/modules/common/utils/format';

// Import extracted hooks
import { usePartnerData } from '@/modules/admin/partner-overview/hooks/usePartnerData';
import { useQuoteFilters } from '@/modules/admin/partner-overview/hooks/useQuoteFilters';
import { useServiceFilters } from '@/modules/admin/partner-overview/hooks/useServiceFilters';

// Import extracted components
import {
  PartnerHeader,
  PartnerMetrics,
  QuotesTable,
  ServicesTable,
} from '@/modules/admin/partner-overview/components';

// Import types
import type { QuoteWithItems } from '@/modules/admin/partner-overview/types';

export default function PartnerOverviewPage() {
  const params = useSearchParams();
  const partnerId = params.get('partnerId') || '';

  // === Data Loading (via hook) ===
  const { loading, error, partner, quotes, services, refetch } = usePartnerData(partnerId);

  // === Filters (via hooks) ===
  const quoteFilters = useQuoteFilters(quotes);
  const serviceFilters = useServiceFilters(services);

  // === Quote Details Modal State ===
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [quoteDetails, setQuoteDetails] = useState<QuoteWithItems | null>(null);

  // === Quote Review Modal State ===
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedQuoteForReview, setSelectedQuoteForReview] = useState<QuoteWithItems | null>(null);

  // === Checklist Modal State ===
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [vehicleIdForChecklist, setVehicleIdForChecklist] = useState<string | null>(null);
  const { data: checklistData, loading: checklistLoading } = usePartnerChecklist(
    vehicleIdForChecklist || undefined
  );

  // === Handlers ===

  const handleOpenDetails = useCallback(async (quoteId: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const resp = await fetch(`/api/admin/quotes/${quoteId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
      });
      const data = await resp.json();
      if (resp.ok) {
        setQuoteDetails({ quote: data.quote, items: data.items || [] });
        setDetailsOpen(true);
      }
    } catch (err) {
      console.error('Error loading quote details:', err);
    }
  }, []);

  const handleOpenReview = useCallback(async (quoteId: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const resp = await fetch(`/api/admin/quotes/${quoteId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
      });
      const data = await resp.json();
      if (resp.ok) {
        setSelectedQuoteForReview({ quote: data.quote, items: data.items || [] });
        setReviewModalOpen(true);
      }
    } catch (err) {
      console.error('Error loading quote for review:', err);
    }
  }, []);

  const handleOpenChecklist = useCallback((vehicleId: string) => {
    setVehicleIdForChecklist(vehicleId);
    setShowChecklistModal(true);
  }, []);

  const handleCloseChecklist = useCallback(() => {
    setShowChecklistModal(false);
    setVehicleIdForChecklist(null);
  }, []);

  const handleToggleService = useCallback(
    async (serviceId: string, nextActive: boolean) => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const resp = await fetch(`/api/admin/partners/${partnerId}/services/${serviceId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({ is_active: nextActive }),
        });
        if (resp.ok) {
          await refetch(); // Reload data after toggle
        }
      } catch (err) {
        console.error('Error toggling service:', err);
      }
    },
    [partnerId, refetch]
  );

  const handleReviewSubmit = useCallback(
    async (
      action: 'approve_full' | 'reject_full' | 'approve_partial',
      data: {
        rejectedItemIds?: string[];
        rejectionReason?: string;
      }
    ) => {
      if (!selectedQuoteForReview) return;

      const quoteId = selectedQuoteForReview.quote.id;

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const payload = {
          action,
          rejectedItemIds: data.rejectedItemIds || [],
          rejectionReason: data.rejectionReason,
        };

        const resp = await fetch(`/api/admin/quotes/${quoteId}/review`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify(payload),
        });

        if (resp.ok) {
          setReviewModalOpen(false);
          setSelectedQuoteForReview(null);
          await refetch(); // Reload data after review
        } else {
          const errorData = await resp.json();
          console.error('Error reviewing quote:', errorData?.error || 'Unknown error');
        }
      } catch (err) {
        console.error('Error submitting review:', err);
      }
    },
    [selectedQuoteForReview, refetch]
  );

  // === Render ===

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <Header />
        <main style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 20px' }}>
          <Loading />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <Header />
        <main style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 20px' }}>
          <div
            style={{
              background: '#fee2e2',
              color: '#991b1b',
              padding: '16px',
              borderRadius: '8px',
            }}
          >
            {error}
          </div>
        </main>
      </div>
    );
  }

  if (!partner) {
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px' }}>
        {/* Back Link */}
        <Link
          href="/dashboard"
          style={{
            display: 'inline-block',
            marginBottom: '16px',
            color: '#3498db',
            textDecoration: 'none',
            fontSize: '0.875rem',
          }}
        >
          ← Voltar
        </Link>

        {/* Partner Header */}
        <PartnerHeader partner={partner} />

        {/* Partner Metrics */}
        <PartnerMetrics metrics={partner} />

        {/* Quotes Table */}
        <QuotesTable
          quotes={quoteFilters.filteredQuotes}
          query={quoteFilters.query}
          status={quoteFilters.status}
          onQueryChange={quoteFilters.setQuery}
          onStatusChange={quoteFilters.setStatus}
          onOpenDetails={handleOpenDetails}
          onOpenReview={handleOpenReview}
          onOpenChecklist={handleOpenChecklist}
        />

        {/* Services Table */}
        <ServicesTable
          services={serviceFilters.filteredServices}
          query={serviceFilters.query}
          status={serviceFilters.status}
          onQueryChange={serviceFilters.setQuery}
          onStatusChange={serviceFilters.setStatus}
          onToggle={handleToggleService}
        />
      </main>

      {/* Quote Details Modal */}
      <Modal
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title="Detalhes do Orçamento"
      >
        {quoteDetails && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <strong>ID:</strong> {quoteDetails.quote.id}
              <br />
              <strong>Status:</strong> {formatQuoteStatus(quoteDetails.quote.status)}
              <br />
              <strong>Valor Total:</strong>{' '}
              {quoteDetails.quote.total_value != null
                ? `R$ ${Number(quoteDetails.quote.total_value).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}`
                : '—'}
              <br />
              <strong>Criado em:</strong>{' '}
              {new Date(quoteDetails.quote.created_at).toLocaleDateString('pt-BR')}
            </div>

            <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>Itens do Orçamento</h3>
            <div style={{ maxHeight: 400, overflow: 'auto' }}>
              <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Descrição</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Qtd</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Preço Unit.</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quoteDetails.items.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '8px' }}>{item.description}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>{item.quantity}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        R${' '}
                        {Number(item.unit_price).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        R${' '}
                        {Number(item.total_price).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              {quoteDetails.quote.vehicle_id && (
                <button
                  onClick={() => {
                    setDetailsOpen(false);
                    handleOpenChecklist(quoteDetails.quote.vehicle_id!);
                  }}
                  style={{
                    padding: '8px 16px',
                    background: '#06b6d4',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  Ver Checklist Completo
                </button>
              )}
              {quoteDetails.quote.status === 'pending_admin_approval' && (
                <button
                  onClick={() => {
                    setDetailsOpen(false);
                    handleOpenReview(quoteDetails.quote.id);
                  }}
                  style={{
                    padding: '8px 16px',
                    background: '#3498db',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  Revisar Orçamento
                </button>
              )}
              <button
                onClick={() => setDetailsOpen(false)}
                style={{
                  padding: '8px 16px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Quote Review Modal */}
      {reviewModalOpen && selectedQuoteForReview && (
        <QuoteReviewModal
          isOpen={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            setSelectedQuoteForReview(null);
          }}
          quote={selectedQuoteForReview.quote}
          items={selectedQuoteForReview.items}
          onReview={handleReviewSubmit}
        />
      )}

      {/* Checklist Modal */}
      {showChecklistModal && vehicleIdForChecklist && (
        <Modal
          isOpen={showChecklistModal}
          onClose={handleCloseChecklist}
          title="Checklist Completo"
        >
          {checklistLoading ? (
            <Loading />
          ) : checklistData ? (
            <ChecklistViewer data={checklistData} onClose={handleCloseChecklist} />
          ) : (
            <div>Nenhum checklist disponível para este veículo.</div>
          )}
        </Modal>
      )}
    </div>
  );
}
