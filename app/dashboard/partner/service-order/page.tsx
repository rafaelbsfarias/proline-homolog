'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import { Loading } from '@/modules/common/components/Loading/Loading';

interface ServiceOrderData {
  id: string;
  created_at: string;
  estimated_days: number;
  status: string;
  vehicle: {
    plate: string;
    brand: string;
    model: string;
    year: number;
    color: string;
    odometer: number;
  };
  partner: {
    company_name: string;
    contact_name: string;
    phone: string;
  };
  client: {
    name: string;
    phone: string;
    email: string;
  };
  items: Array<{
    id: string;
    description: string;
    quantity: number;
  }>;
}

export default function ServiceOrderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const quoteId = searchParams.get('quoteId');
  const { get } = useAuthenticatedFetch();

  const [data, setData] = useState<ServiceOrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!quoteId) {
      setError('ID do orçamento não fornecido');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const response = await get<{
          ok: boolean;
          serviceOrder?: ServiceOrderData;
          error?: string;
        }>(`/api/partner/service-order/${quoteId}`);

        if (!response.ok || !response.data?.ok || !response.data.serviceOrder) {
          throw new Error(response.data?.error || 'Erro ao buscar ordem de serviço');
        }

        setData(response.data.serviceOrder);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [quoteId, get]);

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) return <Loading />;

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: '#e74c3c', marginBottom: '16px' }}>Erro</h2>
        <p>{error}</p>
        <button
          onClick={() => router.back()}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            background: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Voltar
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
      <style>{`
        @media print {
          @page {
            margin: 1cm;
          }
          .no-print {
            display: none !important;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '20px' }}>
        {/* Botões de ação - não imprime */}
        <div
          className="no-print"
          style={{ maxWidth: '900px', margin: '0 auto 20px', display: 'flex', gap: '10px' }}
        >
          <button
            onClick={() => router.back()}
            style={{
              padding: '10px 20px',
              background: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            ← Voltar
          </button>
          <button
            onClick={handlePrint}
            style={{
              padding: '10px 20px',
              background: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z" />
            </svg>
            Imprimir / Baixar PDF
          </button>
        </div>

        {/* Documento da OS */}
        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            background: 'white',
            padding: '40px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          {/* Cabeçalho */}
          <div
            style={{
              borderBottom: '3px solid #3498db',
              paddingBottom: '20px',
              marginBottom: '30px',
            }}
          >
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#2c3e50' }}>
              ORDEM DE SERVIÇO
            </h1>
            <p style={{ margin: '8px 0 0 0', color: '#7f8c8d', fontSize: '14px' }}>
              OS Nº: {data.id.slice(0, 8).toUpperCase()}
            </p>
            <p style={{ margin: '4px 0 0 0', color: '#7f8c8d', fontSize: '14px' }}>
              Data de Emissão: {formatDate(data.created_at)}
            </p>
          </div>

          {/* Informações em 2 colunas */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '30px',
              marginBottom: '30px',
            }}
          >
            {/* Dados do Parceiro */}
            <div>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#2c3e50',
                  marginBottom: '12px',
                  borderBottom: '2px solid #ecf0f1',
                  paddingBottom: '8px',
                }}
              >
                PRESTADOR DE SERVIÇO
              </h3>
              <p style={{ margin: '8px 0', fontSize: '14px' }}>
                <strong>Empresa:</strong> {data.partner.company_name}
              </p>
              <p style={{ margin: '8px 0', fontSize: '14px' }}>
                <strong>Responsável:</strong> {data.partner.contact_name}
              </p>
              <p style={{ margin: '8px 0', fontSize: '14px' }}>
                <strong>Telefone:</strong> {data.partner.phone}
              </p>
            </div>

            {/* Dados do Cliente */}
            <div>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#2c3e50',
                  marginBottom: '12px',
                  borderBottom: '2px solid #ecf0f1',
                  paddingBottom: '8px',
                }}
              >
                CLIENTE
              </h3>
              <p style={{ margin: '8px 0', fontSize: '14px' }}>
                <strong>Nome:</strong> {data.client.name}
              </p>
              <p style={{ margin: '8px 0', fontSize: '14px' }}>
                <strong>Telefone:</strong> {data.client.phone}
              </p>
              <p style={{ margin: '8px 0', fontSize: '14px' }}>
                <strong>E-mail:</strong> {data.client.email}
              </p>
            </div>
          </div>

          {/* Dados do Veículo */}
          <div
            style={{
              marginBottom: '30px',
              background: '#ecf0f1',
              padding: '20px',
              borderRadius: '8px',
            }}
          >
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#2c3e50',
                marginBottom: '12px',
              }}
            >
              VEÍCULO
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <p style={{ margin: 0, fontSize: '14px' }}>
                <strong>Placa:</strong> {data.vehicle.plate}
              </p>
              <p style={{ margin: 0, fontSize: '14px' }}>
                <strong>Marca:</strong> {data.vehicle.brand}
              </p>
              <p style={{ margin: 0, fontSize: '14px' }}>
                <strong>Modelo:</strong> {data.vehicle.model}
              </p>
              <p style={{ margin: 0, fontSize: '14px' }}>
                <strong>Ano:</strong> {data.vehicle.year}
              </p>
              <p style={{ margin: 0, fontSize: '14px' }}>
                <strong>Cor:</strong> {data.vehicle.color || 'N/A'}
              </p>
              <p style={{ margin: 0, fontSize: '14px' }}>
                <strong>Km:</strong>{' '}
                {data.vehicle.odometer
                  ? `${data.vehicle.odometer.toLocaleString('pt-BR')} km`
                  : 'N/A'}
              </p>
            </div>
          </div>

          {/* Serviços a Serem Realizados */}
          <div style={{ marginBottom: '30px' }}>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#2c3e50',
                marginBottom: '16px',
                borderBottom: '2px solid #ecf0f1',
                paddingBottom: '8px',
              }}
            >
              SERVIÇOS A SEREM REALIZADOS
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#34495e', color: 'white' }}>
                  <th
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '14px',
                      borderBottom: '2px solid #2c3e50',
                    }}
                  >
                    Item
                  </th>
                  <th
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      fontSize: '14px',
                      borderBottom: '2px solid #2c3e50',
                    }}
                  >
                    Descrição do Serviço
                  </th>
                  <th
                    style={{
                      padding: '12px',
                      textAlign: 'center',
                      fontSize: '14px',
                      borderBottom: '2px solid #2c3e50',
                      width: '100px',
                    }}
                  >
                    Qtd.
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, index) => (
                  <tr key={item.id} style={{ background: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
                    <td
                      style={{
                        padding: '12px',
                        fontSize: '14px',
                        borderBottom: '1px solid #ecf0f1',
                      }}
                    >
                      {index + 1}
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        fontSize: '14px',
                        borderBottom: '1px solid #ecf0f1',
                      }}
                    >
                      {item.description}
                    </td>
                    <td
                      style={{
                        padding: '12px',
                        fontSize: '14px',
                        textAlign: 'center',
                        borderBottom: '1px solid #ecf0f1',
                      }}
                    >
                      {item.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Prazo de Conclusão */}
          <div
            style={{
              marginBottom: '40px',
              background: '#fff3cd',
              padding: '16px',
              borderRadius: '8px',
              border: '2px solid #ffc107',
            }}
          >
            <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#856404' }}>
              ⏱ Prazo Estimado de Conclusão:{' '}
              <span style={{ fontSize: '20px', color: '#ff6b6b' }}>{data.estimated_days}</span> dias
              úteis
            </p>
          </div>

          {/* Assinaturas */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '40px',
              marginTop: '60px',
            }}
          >
            <div
              style={{ borderTop: '2px solid #2c3e50', paddingTop: '12px', textAlign: 'center' }}
            >
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
                Responsável pelo Serviço
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#7f8c8d' }}>
                {data.partner.company_name}
              </p>
            </div>
            <div
              style={{ borderTop: '2px solid #2c3e50', paddingTop: '12px', textAlign: 'center' }}
            >
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
                Cliente / Autorização
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#7f8c8d' }}>
                {data.client.name}
              </p>
            </div>
          </div>

          {/* Rodapé */}
          <div
            style={{
              marginTop: '40px',
              paddingTop: '20px',
              borderTop: '1px solid #ecf0f1',
              textAlign: 'center',
              color: '#95a5a6',
              fontSize: '12px',
            }}
          >
            <p style={{ margin: 0 }}>
              Este documento é uma ordem de serviço gerada automaticamente pelo sistema.
            </p>
            <p style={{ margin: '4px 0 0 0' }}>Emitido em: {new Date().toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </div>
    </>
  );
}
