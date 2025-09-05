'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { usePartnerChecklist } from '@/modules/partner/hooks/usePartnerChecklist';
import PartnerServiceCategoryField from '@/modules/partner/components/PartnerServiceCategoryField';
import { Loading } from '@/modules/common/components/Loading/Loading';

const ChecklistPage = () => {
  const router = useRouter();
  const {
    form,
    vehicle,
    loading,
    saving,
    error,
    success,
    setField,
    setServiceFlag,
    setServiceNotes,
    saveChecklist,
  } = usePartnerChecklist();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveChecklist();
    } catch {
      // Error já tratado no hook
    }
  };

  const handleBack = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Loading />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          padding: '20px',
        }}
      >
        <h1 style={{ color: '#ef4444', marginBottom: '16px' }}>Veículo não encontrado</h1>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>
          Não foi possível encontrar o veículo para este orçamento.
        </p>
        <button
          onClick={handleBack}
          style={{
            padding: '12px 24px',
            background: '#002e4c',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
          }}
        >
          Voltar ao Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <div
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e1e5e9',
          padding: '16px 24px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <button
            onClick={handleBack}
            style={{
              background: 'none',
              border: 'none',
              color: '#002e4c',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
            }}
          >
            ← Voltar ao Dashboard
          </button>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#111827',
              margin: 0,
            }}
          >
            Checklist do Veículo
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        <form onSubmit={handleSubmit}>
          {/* Vehicle Information */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '16px',
              }}
            >
              Informações do Veículo
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                fontSize: '16px',
              }}
            >
              <div>
                <strong>Veículo:</strong> {vehicle.brand} {vehicle.model}{' '}
                {vehicle.year ? `(${vehicle.year})` : ''}
              </div>
              <div>
                <strong>Placa:</strong> {vehicle.plate}
              </div>
              {vehicle.color && (
                <div>
                  <strong>Cor:</strong> {vehicle.color}
                </div>
              )}
            </div>
          </div>

          {/* Inspection Data */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '20px',
              }}
            >
              Dados da Inspeção
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                marginBottom: '20px',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px',
                  }}
                >
                  Data da Inspeção *
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setField('date', e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px',
                  }}
                >
                  Quilometragem Atual (km) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.odometer}
                  onChange={e => setField('odometer', e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px',
                  }}
                >
                  Nível de Combustível
                </label>
                <select
                  value={form.fuelLevel}
                  onChange={e => setField('fuelLevel', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <option value="empty">Vazio</option>
                  <option value="quarter">1/4</option>
                  <option value="half">1/2</option>
                  <option value="three_quarters">3/4</option>
                  <option value="full">Cheio</option>
                </select>
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px',
                }}
              >
                Observações Gerais
              </label>
              <textarea
                value={form.observations}
                onChange={e => setField('observations', e.target.value)}
                placeholder="Digite observações gerais sobre o veículo..."
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          </div>

          {/* Services Section */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '20px',
              }}
            >
              Serviços Necessários
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: '20px',
              }}
            >
              <PartnerServiceCategoryField
                label="Mecânica"
                checked={form.services.mechanics.required}
                notes={form.services.mechanics.notes}
                onToggle={checked => setServiceFlag('mechanics', checked)}
                onNotesChange={notes => setServiceNotes('mechanics', notes)}
              />

              <PartnerServiceCategoryField
                label="Funilaria/Pintura"
                checked={form.services.bodyPaint.required}
                notes={form.services.bodyPaint.notes}
                onToggle={checked => setServiceFlag('bodyPaint', checked)}
                onNotesChange={notes => setServiceNotes('bodyPaint', notes)}
              />

              <PartnerServiceCategoryField
                label="Lavagem"
                checked={form.services.washing.required}
                notes={form.services.washing.notes}
                onToggle={checked => setServiceFlag('washing', checked)}
                onNotesChange={notes => setServiceNotes('washing', notes)}
              />

              <PartnerServiceCategoryField
                label="Pneus"
                checked={form.services.tires.required}
                notes={form.services.tires.notes}
                onToggle={checked => setServiceFlag('tires', checked)}
                onNotesChange={notes => setServiceNotes('tires', notes)}
              />

              <PartnerServiceCategoryField
                label="Loja"
                checked={form.services.loja.required}
                notes={form.services.loja.notes}
                onToggle={checked => setServiceFlag('loja', checked)}
                onNotesChange={notes => setServiceNotes('loja', notes)}
              />

              <PartnerServiceCategoryField
                label="Pátio Atacado"
                checked={form.services.patioAtacado.required}
                notes={form.services.patioAtacado.notes}
                onToggle={checked => setServiceFlag('patioAtacado', checked)}
                onNotesChange={notes => setServiceNotes('patioAtacado', notes)}
              />
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px',
                color: '#dc2626',
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px',
                color: '#16a34a',
              }}
            >
              {success}
            </div>
          )}

          {/* Actions */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: '16px',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                onClick={handleBack}
                disabled={saving}
                style={{
                  padding: '12px 24px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '12px 24px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? 'Salvando...' : 'Salvar Checklist'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChecklistPage;
