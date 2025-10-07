import React, { useState } from 'react';
import Modal from '@/modules/common/components/Modal/Modal';

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Quote {
  id: string;
  status: string;
  total_value: number;
  service_order_id?: string;
  created_at?: string;
}

interface QuoteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: Quote | null;
  items: QuoteItem[];
  onReview: (
    action: 'approve_full' | 'reject_full' | 'approve_partial',
    data: {
      rejectedItemIds?: string[];
      rejectionReason?: string;
    }
  ) => Promise<void>;
}

export default function QuoteReviewModal({
  isOpen,
  onClose,
  quote,
  items,
  onReview,
}: QuoteReviewModalProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleToggleItem = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  };

  const handleApproveFull = async () => {
    setLoading(true);
    try {
      await onReview('approve_full', {});
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleRejectFull = async () => {
    if (!rejectionReason.trim()) {
      setError('Por favor, informe o motivo da rejeição');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onReview('reject_full', { rejectionReason });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePartial = async () => {
    if (selectedItems.size === 0) {
      setError('Selecione pelo menos um item para rejeitar');
      return;
    }
    if (selectedItems.size === items.length) {
      setError('Para rejeitar todos os itens, use a opção "Reprovar Integral"');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onReview('approve_partial', {
        rejectedItemIds: Array.from(selectedItems),
        rejectionReason: rejectionReason.trim() || undefined,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const approvedTotal = items
    .filter(item => !selectedItems.has(item.id))
    .reduce((sum, item) => sum + item.total_price, 0);

  const rejectedTotal = items
    .filter(item => selectedItems.has(item.id))
    .reduce((sum, item) => sum + item.total_price, 0);

  if (!quote) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Revisão Detalhada do Orçamento" size="lg">
      <div style={{ display: 'grid', gap: 16 }}>
        {/* Mensagem de Erro */}
        {error && (
          <div
            style={{
              background: '#fee2e2',
              border: '1px solid #ef4444',
              borderRadius: 8,
              padding: 12,
              color: '#991b1b',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        {/* Informações do Orçamento */}
        <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16 }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem' }}>Informações do Orçamento</h3>
          <div style={{ display: 'grid', gap: 8, fontSize: '14px' }}>
            <div>
              <strong>ID:</strong> {quote.id}
            </div>
            <div>
              <strong>OS:</strong> {quote.service_order_id || '-'}
            </div>
            <div>
              <strong>Valor Total:</strong>{' '}
              {quote.total_value.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </div>
          </div>
        </div>

        {/* Seleção de Itens */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Itens do Orçamento ({items.length})</h3>
            <button
              onClick={handleSelectAll}
              style={{
                padding: '6px 12px',
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              {selectedItems.size === items.length
                ? 'Desmarcar Todos'
                : 'Selecionar Todos para Rejeição'}
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ textAlign: 'left', padding: 8 }}>
                  <input
                    type="checkbox"
                    checked={selectedItems.size === items.length && items.length > 0}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th style={{ textAlign: 'left', padding: 8 }}>Descrição</th>
                <th style={{ textAlign: 'center', padding: 8 }}>Qtd</th>
                <th style={{ textAlign: 'right', padding: 8 }}>Valor Unit.</th>
                <th style={{ textAlign: 'right', padding: 8 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr
                  key={item.id}
                  style={{
                    background: selectedItems.has(item.id) ? '#fee2e2' : 'white',
                    borderTop: '1px solid #e5e7eb',
                  }}
                >
                  <td style={{ padding: 8 }}>
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => handleToggleItem(item.id)}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ padding: 8 }}>{item.description}</td>
                  <td style={{ padding: 8, textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>
                    {item.unit_price.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </td>
                  <td style={{ padding: 8, textAlign: 'right', fontWeight: 600 }}>
                    {item.total_price.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Resumo */}
        {selectedItems.size > 0 && (
          <div
            style={{
              background: '#fffbeb',
              borderRadius: 8,
              padding: 16,
              border: '1px solid #fbbf24',
            }}
          >
            <div style={{ display: 'grid', gap: 8, fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Itens Aprovados ({items.length - selectedItems.size}):</span>
                <strong style={{ color: '#10b981' }}>
                  {approvedTotal.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Itens Rejeitados ({selectedItems.size}):</span>
                <strong style={{ color: '#ef4444' }}>
                  -
                  {rejectedTotal.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </strong>
              </div>
              <div style={{ borderTop: '1px solid #fbbf24', paddingTop: 8, marginTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}>
                  <strong>Novo Total:</strong>
                  <strong style={{ color: '#072e4c' }}>
                    {approvedTotal.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Motivo da Rejeição */}
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
            Motivo da Rejeição{' '}
            {selectedItems.size === items.length && <span style={{ color: '#ef4444' }}>*</span>}
          </label>
          <textarea
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
            placeholder="Descreva o motivo da rejeição (obrigatório para rejeição total)"
            style={{
              width: '100%',
              minHeight: 80,
              padding: 8,
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: '14px',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Ações */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'flex-end',
            borderTop: '1px solid #e5e7eb',
            paddingTop: 16,
          }}
        >
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleRejectFull}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Reprovar Integral
          </button>
          {selectedItems.size > 0 && selectedItems.size < items.length && (
            <button
              onClick={handleApprovePartial}
              disabled={loading}
              style={{
                padding: '10px 20px',
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              Aprovar Parcial ({items.length - selectedItems.size} itens)
            </button>
          )}
          <button
            onClick={handleApproveFull}
            disabled={loading || selectedItems.size > 0}
            style={{
              padding: '10px 20px',
              background: selectedItems.size > 0 ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: loading || selectedItems.size > 0 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Aprovar Integral
          </button>
        </div>
      </div>
    </Modal>
  );
}
