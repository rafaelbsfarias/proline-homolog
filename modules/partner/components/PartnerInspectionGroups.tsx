'use client';

import React from 'react';
import type { ChecklistFormWithInspections, InspectionStatus } from '../../common/types/checklist';

interface InspectionGroup {
  title: string;
  items: InspectionGroupItem[];
}

interface InspectionGroupItem {
  key: keyof ChecklistFormWithInspections;
  label: string;
  statusKey: keyof ChecklistFormWithInspections;
  notesKey: keyof ChecklistFormWithInspections;
  evidenceKey: keyof ChecklistFormWithInspections;
}

interface PartnerInspectionGroupsProps {
  form: ChecklistFormWithInspections;
  onUpdateItem: (
    field: keyof ChecklistFormWithInspections,
    value: string | InspectionStatus
  ) => void;
  disabled?: boolean;
}

const INSPECTION_GROUPS: InspectionGroup[] = [
  {
    title: 'Motor e Transmissão',
    items: [
      {
        key: 'clutch',
        label: 'Embreagem',
        statusKey: 'clutch',
        notesKey: 'clutchNotes',
        evidenceKey: 'clutchEvidence',
      },
      {
        key: 'sparkPlugs',
        label: 'Velas de Ignição',
        statusKey: 'sparkPlugs',
        notesKey: 'sparkPlugsNotes',
        evidenceKey: 'sparkPlugsEvidence',
      },
      {
        key: 'belts',
        label: 'Correias',
        statusKey: 'belts',
        notesKey: 'beltsNotes',
        evidenceKey: 'beltsEvidence',
      },
      {
        key: 'engine',
        label: 'Motor',
        statusKey: 'engine',
        notesKey: 'engineNotes',
        evidenceKey: 'engineEvidence',
      },
    ],
  },
  {
    title: 'Sistema de Arrefecimento',
    items: [
      {
        key: 'radiator',
        label: 'Radiador',
        statusKey: 'radiator',
        notesKey: 'radiatorNotes',
        evidenceKey: 'radiatorEvidence',
      },
      {
        key: 'fluids',
        label: 'Fluidos',
        statusKey: 'fluids',
        notesKey: 'fluidsNotes',
        evidenceKey: 'fluidsEvidence',
      },
    ],
  },
  {
    title: 'Suspensão',
    items: [
      {
        key: 'frontShocks',
        label: 'Amortecedores Dianteiros',
        statusKey: 'frontShocks',
        notesKey: 'frontShocksNotes',
        evidenceKey: 'frontShocksEvidence',
      },
      {
        key: 'rearShocks',
        label: 'Amortecedores Traseiros',
        statusKey: 'rearShocks',
        notesKey: 'rearShocksNotes',
        evidenceKey: 'rearShocksEvidence',
      },
      {
        key: 'suspension',
        label: 'Sistema de Suspensão',
        statusKey: 'suspension',
        notesKey: 'suspensionNotes',
        evidenceKey: 'suspensionEvidence',
      },
    ],
  },
  {
    title: 'Freios',
    items: [
      {
        key: 'brakePads',
        label: 'Pastilhas de Freio',
        statusKey: 'brakePads',
        notesKey: 'brakePadsNotes',
        evidenceKey: 'brakePadsEvidence',
      },
      {
        key: 'brakeDiscs',
        label: 'Discos de Freio',
        statusKey: 'brakeDiscs',
        notesKey: 'brakeDiscsNotes',
        evidenceKey: 'brakeDiscsEvidence',
      },
    ],
  },
  {
    title: 'Direção',
    items: [
      {
        key: 'steeringBox',
        label: 'Caixa de Direção',
        statusKey: 'steeringBox',
        notesKey: 'steeringBoxNotes',
        evidenceKey: 'steeringBoxEvidence',
      },
      {
        key: 'electricSteeringBox',
        label: 'Direção Elétrica',
        statusKey: 'electricSteeringBox',
        notesKey: 'electricSteeringBoxNotes',
        evidenceKey: 'electricSteeringBoxEvidence',
      },
    ],
  },
  {
    title: 'Ar Condicionado',
    items: [
      {
        key: 'airConditioning',
        label: 'Sistema de Ar Condicionado',
        statusKey: 'airConditioning',
        notesKey: 'airConditioningNotes',
        evidenceKey: 'airConditioningEvidence',
      },
      {
        key: 'airConditioningCompressor',
        label: 'Compressor do Ar Condicionado',
        statusKey: 'airConditioningCompressor',
        notesKey: 'airConditioningCompressorNotes',
        evidenceKey: 'airConditioningCompressorEvidence',
      },
      {
        key: 'airConditioningCleaning',
        label: 'Limpeza do Ar Condicionado',
        statusKey: 'airConditioningCleaning',
        notesKey: 'airConditioningCleaningNotes',
        evidenceKey: 'airConditioningCleaningEvidence',
      },
    ],
  },
  {
    title: 'Acionamento Elétrico',
    items: [
      {
        key: 'electricalActuationGlass',
        label: 'Vidros Elétricos',
        statusKey: 'electricalActuationGlass',
        notesKey: 'electricalActuationGlassNotes',
        evidenceKey: 'electricalActuationGlassEvidence',
      },
      {
        key: 'electricalActuationMirror',
        label: 'Retrovisores Elétricos',
        statusKey: 'electricalActuationMirror',
        notesKey: 'electricalActuationMirrorNotes',
        evidenceKey: 'electricalActuationMirrorEvidence',
      },
      {
        key: 'electricalActuationSocket',
        label: 'Tomada Elétrica',
        statusKey: 'electricalActuationSocket',
        notesKey: 'electricalActuationSocketNotes',
        evidenceKey: 'electricalActuationSocketEvidence',
      },
      {
        key: 'electricalActuationLock',
        label: 'Trava Elétrica',
        statusKey: 'electricalActuationLock',
        notesKey: 'electricalActuationLockNotes',
        evidenceKey: 'electricalActuationLockEvidence',
      },
      {
        key: 'electricalActuationTrunk',
        label: 'Porta-malas Elétrico',
        statusKey: 'electricalActuationTrunk',
        notesKey: 'electricalActuationTrunkNotes',
        evidenceKey: 'electricalActuationTrunkEvidence',
      },
      {
        key: 'electricalActuationWiper',
        label: 'Limpador de Para-brisa',
        statusKey: 'electricalActuationWiper',
        notesKey: 'electricalActuationWiperNotes',
        evidenceKey: 'electricalActuationWiperEvidence',
      },
      {
        key: 'electricalActuationKey',
        label: 'Chave Elétrica',
        statusKey: 'electricalActuationKey',
        notesKey: 'electricalActuationKeyNotes',
        evidenceKey: 'electricalActuationKeyEvidence',
      },
      {
        key: 'electricalActuationAlarm',
        label: 'Alarme',
        statusKey: 'electricalActuationAlarm',
        notesKey: 'electricalActuationAlarmNotes',
        evidenceKey: 'electricalActuationAlarmEvidence',
      },
      {
        key: 'electricalActuationInteriorLight',
        label: 'Luz Interna',
        statusKey: 'electricalActuationInteriorLight',
        notesKey: 'electricalActuationInteriorLightNotes',
        evidenceKey: 'electricalActuationInteriorLightEvidence',
      },
    ],
  },
  {
    title: 'Diversos',
    items: [
      {
        key: 'tires',
        label: 'Pneus',
        statusKey: 'tires',
        notesKey: 'tiresNotes',
        evidenceKey: 'tiresEvidence',
      },
      {
        key: 'exhaust',
        label: 'Sistema de Escapamento',
        statusKey: 'exhaust',
        notesKey: 'exhaustNotes',
        evidenceKey: 'exhaustEvidence',
      },
      {
        key: 'dashboardPanel',
        label: 'Painel',
        statusKey: 'dashboardPanel',
        notesKey: 'dashboardPanelNotes',
        evidenceKey: 'dashboardPanelEvidence',
      },
      {
        key: 'lights',
        label: 'Luzes',
        statusKey: 'lights',
        notesKey: 'lightsNotes',
        evidenceKey: 'lightsEvidence',
      },
      {
        key: 'battery',
        label: 'Bateria',
        statusKey: 'battery',
        notesKey: 'batteryNotes',
        evidenceKey: 'batteryEvidence',
      },
    ],
  },
];

const STATUS_OPTIONS: Array<{ value: InspectionStatus; label: string; color: string }> = [
  { value: 'ok', label: '✓ OK', color: 'text-green-600' },
  { value: 'attention', label: '⚠ Atenção', color: 'text-yellow-600' },
  { value: 'critical', label: '✗ Crítico', color: 'text-red-600' },
];

export function PartnerInspectionGroups({
  form,
  onUpdateItem,
  disabled = false,
}: PartnerInspectionGroupsProps) {
  const handleImageUpload = async (evidenceKey: keyof ChecklistFormWithInspections, file: File) => {
    // a fazer: Implementar upload de imagem para S3 ou Supabase Storage
    // Por enquanto, simular URL da imagem
    const fakeImageUrl = URL.createObjectURL(file);
    onUpdateItem(evidenceKey, fakeImageUrl);
  };

  return (
    <div className="space-y-8">
      {INSPECTION_GROUPS.map(group => (
        <div key={group.title} className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{group.title}</h3>
          </div>

          <div className="p-6 space-y-6">
            {group.items.map(item => (
              <div
                key={item.key}
                className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0"
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  {/* Nome do item */}
                  <div className="lg:w-1/4">
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      {item.label}
                    </label>
                  </div>

                  {/* Status */}
                  <div className="lg:w-1/4">
                    <label className="block text-xs font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={(form[item.statusKey] as string) || ''}
                      onChange={e =>
                        onUpdateItem(item.statusKey, e.target.value as InspectionStatus)
                      }
                      disabled={disabled}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                    >
                      <option value="">Selecione...</option>
                      {STATUS_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Observações */}
                  <div className="lg:w-1/4">
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Observações
                    </label>
                    <textarea
                      value={(form[item.notesKey] as string) || ''}
                      onChange={e => onUpdateItem(item.notesKey, e.target.value)}
                      disabled={disabled}
                      placeholder="Observações adicionais..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm resize-none"
                    />
                  </div>

                  {/* Upload de Evidência */}
                  <div className="lg:w-1/4">
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Evidência (Foto)
                    </label>

                    {/* Preview da imagem existente */}
                    {form[item.evidenceKey] && (
                      <div className="mb-3">
                        <img
                          src={form[item.evidenceKey] as string}
                          alt={`Evidência - ${item.label}`}
                          className="w-full h-24 object-cover rounded-md shadow-sm"
                        />
                      </div>
                    )}

                    {/* Input de upload */}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImageUpload(item.evidenceKey, file);
                        }
                      }}
                      disabled={disabled}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />

                    {/* Botão para remover evidência */}
                    {form[item.evidenceKey] && !disabled && (
                      <button
                        type="button"
                        onClick={() => onUpdateItem(item.evidenceKey, '')}
                        className="mt-2 text-xs text-red-600 hover:text-red-800 font-medium"
                      >
                        Remover evidência
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
