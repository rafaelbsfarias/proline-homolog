import React, { useState, useEffect } from 'react';
import Modal from '@/modules/common/components/Modal/Modal';
import { supabase } from '@/modules/common/services/supabaseClient';

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
  created_at: string;
}

interface ClientQuoteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: Quote | null;
  onSuccess: () => void;
}

export default function ClientQuoteReviewModal({
  isOpen,
  onClose,
  quote,
  onSuccess,
}: ClientQuoteReviewModalProps) {
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (quote && isOpen) {
      fetchQuoteItems();
    } else {
      setItems([]);
      setSelectedItems(new Set());
      setError('');
    }
  }, [quote, isOpen]);

  const fetchQuoteItems = async () => {
    if (!quote) return;

    try {
      setLoadingItems(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      const response = await fetch(`/api/client/quotes/${quote.id}/details`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Erro ao buscar itens');

      const data = await response.json();
      const fetchedItems = data.items || [];
      setItems(fetchedItems);
      // Iniciar com todos os itens selecionados (aprovados)
      setSelectedItems(new Set(fetchedItems.map((item: QuoteItem) => item.id)));
    } catch {
      setError('Erro ao carregar itens do orçamento');
    } finally {
      setLoadingItems(false);
    }
  };

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

  const handleApprove = async () => {
    if (!quote) return;

    if (selectedItems.size === 0) {
      setError('Selecione pelo menos um item para aprovar');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError('Sessão não encontrada');
        return;
      }

      const response = await fetch(`/api/client/quotes/${quote.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          approvedItemIds: Array.from(selectedItems),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao aprovar orçamento');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao aprovar orçamento');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!quote) return;

    setLoading(true);
    setError('');

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError('Sessão não encontrada');
        return;
      }

      const response = await fetch(`/api/client/quotes/${quote.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao rejeitar orçamento');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao rejeitar orçamento');
    } finally {
      setLoading(false);
    }
  };

  const approvedTotal = items
    .filter(item => selectedItems.has(item.id))
    .reduce((sum, item) => sum + item.total_price, 0);

  const rejectedTotal = items
    .filter(item => !selectedItems.has(item.id))
    .reduce((sum, item) => sum + item.total_price, 0);

  if (!quote) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Revisar Orçamento" size="lg">
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

        {loadingItems ? (
          <div style={{ textAlign: 'center', padding: 20 }}>Carregando itens...</div>
        ) : (
          <>
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
                <h3 style={{ margin: 0, fontSize: '1rem' }}>
                  Selecione os itens que deseja aprovar ({items.length})
                </h3>
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
                  {selectedItems.size === items.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
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
                        background: selectedItems.has(item.id) ? '#d1fae5' : '#fee2e2',
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
            <div
              style={{
                background: '#eff6ff',
                borderRadius: 8,
                padding: 16,
                border: '1px solid #3b82f6',
              }}
            >
              <div style={{ display: 'grid', gap: 8, fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Itens Aprovados ({selectedItems.size}):</span>
                  <strong style={{ color: '#10b981' }}>
                    {approvedTotal.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </strong>
                </div>
                {rejectedTotal > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Itens Rejeitados ({items.length - selectedItems.size}):</span>
                    <strong style={{ color: '#ef4444' }}>
                      -
                      {rejectedTotal.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </strong>
                  </div>
                )}
                <div style={{ borderTop: '1px solid #3b82f6', paddingTop: 8, marginTop: 4 }}>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}
                  >
                    <strong>Valor Final:</strong>
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
          </>
        )}

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
            onClick={handleReject}
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
            Rejeitar Tudo
          </button>
          <button
            onClick={handleApprove}
            disabled={loading || selectedItems.size === 0}
            style={{
              padding: '10px 20px',
              background: selectedItems.size === 0 ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: loading || selectedItems.size === 0 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            {selectedItems.size === items.length
              ? 'Aprovar Tudo'
              : `Aprovar Selecionados (${selectedItems.size})`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
