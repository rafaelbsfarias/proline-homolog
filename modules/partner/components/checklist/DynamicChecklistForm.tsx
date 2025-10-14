import React from 'react';
import { useChecklistTemplate } from '@/modules/partner/hooks/useChecklistTemplate';

interface DynamicChecklistFormProps {
  vehicleId: string;
  quoteId?: string;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  disabled?: boolean;
}

/**
 * Componente de formulário de checklist dinâmico
 * Renderiza campos baseado no template da categoria do parceiro
 */
export const DynamicChecklistForm: React.FC<DynamicChecklistFormProps> = ({
  vehicleId,
  quoteId,
  onSubmit,
  disabled = false,
}) => {
  const { template, loading, error, category, vehicle } = useChecklistTemplate(vehicleId, quoteId);
  const [formData, setFormData] = React.useState<Record<string, unknown>>({
    // Campos básicos de inspeção
    date: new Date().toISOString().split('T')[0],
    odometer: '',
    fuelLevel: 'half',
    observations: '',
  });
  const [submitting, setSubmitting] = React.useState(false);

  const handleFieldChange = (itemKey: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [itemKey]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    setSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        <span className="ml-3 text-gray-600">Carregando template...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 font-medium">Erro ao carregar template</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 font-medium">Template não disponível</p>
        <p className="text-yellow-600 text-sm mt-1">
          Nenhum template encontrado para a categoria: {category || 'desconhecida'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Vehicle Information */}
      {vehicle && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações do Veículo</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Veículo:</span>{' '}
              <span className="font-medium text-gray-900">
                {vehicle.brand} {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ''}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Placa:</span>{' '}
              <span className="font-medium text-gray-900">{vehicle.plate}</span>
            </div>
            {vehicle.color && (
              <div>
                <span className="text-gray-600">Cor:</span>{' '}
                <span className="font-medium text-gray-900">{vehicle.color}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Template Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900">{template.title}</h2>
        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
          <span>Categoria: {category}</span>
          <span>•</span>
          <span>Versão: {template.version}</span>
          <span>•</span>
          <span>{template.sections.length} seções</span>
        </div>
      </div>

      {/* Inspection Basic Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados da Inspeção</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data da Inspeção <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={(formData.date as string) || ''}
              onChange={e => handleFieldChange('date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hodômetro (km)</label>
            <input
              type="number"
              value={(formData.odometer as string) || ''}
              onChange={e => handleFieldChange('odometer', e.target.value)}
              placeholder="Ex: 45000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nível de Combustível <span className="text-red-500">*</span>
            </label>
            <select
              value={(formData.fuelLevel as string) || 'half'}
              onChange={e => handleFieldChange('fuelLevel', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="empty">Vazio</option>
              <option value="quarter">1/4</option>
              <option value="half">1/2</option>
              <option value="three_quarters">3/4</option>
              <option value="full">Cheio</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações Gerais
            </label>
            <textarea
              value={(formData.observations as string) || ''}
              onChange={e => handleFieldChange('observations', e.target.value)}
              placeholder="Observações sobre o veículo..."
              rows={1}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {template.sections.map(section => (
          <div key={section.section} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 capitalize">
              {section.section.replace(/_/g, ' ')}
            </h3>

            <div className="space-y-4">
              {section.items.map(item => (
                <div key={item.id} className="border-b border-gray-200 pb-4 last:border-0">
                  <label className="block">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-700">
                          {item.label}
                          {item.is_required && <span className="text-red-500 ml-1">*</span>}
                        </span>
                        {item.description && (
                          <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                        )}
                      </div>
                      {item.subsection && (
                        <span className="text-xs text-gray-400 ml-2">{item.subsection}</span>
                      )}
                    </div>

                    {/* Status Select */}
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={(formData[item.item_key] as string) || ''}
                      onChange={e => handleFieldChange(item.item_key, e.target.value)}
                      required={item.is_required}
                    >
                      <option value="">Selecione...</option>
                      <option value="ok">OK</option>
                      <option value="nok">NOK</option>
                      <option value="na">N/A</option>
                    </select>

                    {/* Notes Field */}
                    <textarea
                      className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Observações..."
                      rows={2}
                      value={(formData[`${item.item_key}_notes`] as string) || ''}
                      onChange={e => handleFieldChange(`${item.item_key}_notes`, e.target.value)}
                    />

                    {/* Photo Upload Hint */}
                    {item.allows_photos && (
                      <div className="mt-2 flex items-center text-xs text-gray-500">
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        Permite até {item.max_photos || 5} foto(s)
                      </div>
                    )}

                    {item.help_text && (
                      <p className="mt-1 text-xs text-blue-600">{item.help_text}</p>
                    )}
                  </label>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            onClick={() => window.history.back()}
            disabled={disabled || submitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={disabled || submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Salvando...' : 'Salvar Checklist'}
          </button>
        </div>
      </form>
    </div>
  );
};
