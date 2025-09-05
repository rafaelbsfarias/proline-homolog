import React from 'react';
import type { PartnerChecklistForm } from '../../hooks/usePartnerChecklist';

type InspectionStatus = 'ok' | 'attention' | 'critical';

interface InspectionItem {
  key: keyof Pick<
    PartnerChecklistForm,
    | 'clutch'
    | 'sparkPlugs'
    | 'belts'
    | 'radiator'
    | 'frontShocks'
    | 'rearShocks'
    | 'suspension'
    | 'tires'
    | 'brakePads'
    | 'brakeDiscs'
    | 'engine'
    | 'steeringBox'
    | 'electricSteeringBox'
    | 'exhaust'
    | 'fluids'
    | 'airConditioning'
    | 'airConditioningCompressor'
    | 'airConditioningCleaning'
    | 'electricalActuationGlass'
    | 'electricalActuationMirror'
    | 'electricalActuationSocket'
    | 'electricalActuationLock'
    | 'electricalActuationTrunk'
    | 'electricalActuationWiper'
    | 'electricalActuationKey'
    | 'electricalActuationAlarm'
    | 'electricalActuationInteriorLight'
    | 'dashboardPanel'
    | 'lights'
    | 'battery'
  >;
  notesKey: keyof Pick<
    PartnerChecklistForm,
    | 'clutchNotes'
    | 'sparkPlugsNotes'
    | 'beltsNotes'
    | 'radiatorNotes'
    | 'frontShocksNotes'
    | 'rearShocksNotes'
    | 'suspensionNotes'
    | 'tiresNotes'
    | 'brakePadsNotes'
    | 'brakeDiscsNotes'
    | 'engineNotes'
    | 'steeringBoxNotes'
    | 'electricSteeringBoxNotes'
    | 'exhaustNotes'
    | 'fluidsNotes'
    | 'airConditioningNotes'
    | 'airConditioningCompressorNotes'
    | 'airConditioningCleaningNotes'
    | 'electricalActuationGlassNotes'
    | 'electricalActuationMirrorNotes'
    | 'electricalActuationSocketNotes'
    | 'electricalActuationLockNotes'
    | 'electricalActuationTrunkNotes'
    | 'electricalActuationWiperNotes'
    | 'electricalActuationKeyNotes'
    | 'electricalActuationAlarmNotes'
    | 'electricalActuationInteriorLightNotes'
    | 'dashboardPanelNotes'
    | 'lightsNotes'
    | 'batteryNotes'
  >;
  label: string;
  category: string;
  description?: string;
}

interface Props {
  values: Pick<
    PartnerChecklistForm,
    | 'clutch'
    | 'sparkPlugs'
    | 'belts'
    | 'radiator'
    | 'frontShocks'
    | 'rearShocks'
    | 'suspension'
    | 'tires'
    | 'brakePads'
    | 'brakeDiscs'
    | 'engine'
    | 'steeringBox'
    | 'electricSteeringBox'
    | 'exhaust'
    | 'fluids'
    | 'airConditioning'
    | 'airConditioningCompressor'
    | 'airConditioningCleaning'
    | 'electricalActuationGlass'
    | 'electricalActuationMirror'
    | 'electricalActuationSocket'
    | 'electricalActuationLock'
    | 'electricalActuationTrunk'
    | 'electricalActuationWiper'
    | 'electricalActuationKey'
    | 'electricalActuationAlarm'
    | 'electricalActuationInteriorLight'
    | 'dashboardPanel'
    | 'lights'
    | 'battery'
    | 'clutchNotes'
    | 'sparkPlugsNotes'
    | 'beltsNotes'
    | 'radiatorNotes'
    | 'frontShocksNotes'
    | 'rearShocksNotes'
    | 'suspensionNotes'
    | 'tiresNotes'
    | 'brakePadsNotes'
    | 'brakeDiscsNotes'
    | 'engineNotes'
    | 'steeringBoxNotes'
    | 'electricSteeringBoxNotes'
    | 'exhaustNotes'
    | 'fluidsNotes'
    | 'airConditioningNotes'
    | 'airConditioningCompressorNotes'
    | 'airConditioningCleaningNotes'
    | 'electricalActuationGlassNotes'
    | 'electricalActuationMirrorNotes'
    | 'electricalActuationSocketNotes'
    | 'electricalActuationLockNotes'
    | 'electricalActuationTrunkNotes'
    | 'electricalActuationWiperNotes'
    | 'electricalActuationKeyNotes'
    | 'electricalActuationAlarmNotes'
    | 'electricalActuationInteriorLightNotes'
    | 'dashboardPanelNotes'
    | 'lightsNotes'
    | 'batteryNotes'
  >;
  onChange: (
    name: keyof Pick<
      PartnerChecklistForm,
      | 'clutch'
      | 'sparkPlugs'
      | 'belts'
      | 'radiator'
      | 'frontShocks'
      | 'rearShocks'
      | 'suspension'
      | 'tires'
      | 'brakePads'
      | 'brakeDiscs'
      | 'engine'
      | 'steeringBox'
      | 'electricSteeringBox'
      | 'exhaust'
      | 'fluids'
      | 'airConditioning'
      | 'airConditioningCompressor'
      | 'airConditioningCleaning'
      | 'electricalActuationGlass'
      | 'electricalActuationMirror'
      | 'electricalActuationSocket'
      | 'electricalActuationLock'
      | 'electricalActuationTrunk'
      | 'electricalActuationWiper'
      | 'electricalActuationKey'
      | 'electricalActuationAlarm'
      | 'electricalActuationInteriorLight'
      | 'dashboardPanel'
      | 'lights'
      | 'battery'
      | 'clutchNotes'
      | 'sparkPlugsNotes'
      | 'beltsNotes'
      | 'radiatorNotes'
      | 'frontShocksNotes'
      | 'rearShocksNotes'
      | 'suspensionNotes'
      | 'tiresNotes'
      | 'brakePadsNotes'
      | 'brakeDiscsNotes'
      | 'engineNotes'
      | 'steeringBoxNotes'
      | 'electricSteeringBoxNotes'
      | 'exhaustNotes'
      | 'fluidsNotes'
      | 'airConditioningNotes'
      | 'airConditioningCompressorNotes'
      | 'airConditioningCleaningNotes'
      | 'electricalActuationGlassNotes'
      | 'electricalActuationMirrorNotes'
      | 'electricalActuationSocketNotes'
      | 'electricalActuationLockNotes'
      | 'electricalActuationTrunkNotes'
      | 'electricalActuationWiperNotes'
      | 'electricalActuationKeyNotes'
      | 'electricalActuationAlarmNotes'
      | 'electricalActuationInteriorLightNotes'
      | 'dashboardPanelNotes'
      | 'lightsNotes'
      | 'batteryNotes'
    >,
    value: string | InspectionStatus
  ) => void;
}

const inspectionItems: InspectionItem[] = [
  // MECÂNICA
  {
    key: 'clutch',
    notesKey: 'clutchNotes',
    label: 'Embreagem - Conjunto',
    category: 'MECÂNICA',
    description: 'Acionamento',
  },
  {
    key: 'sparkPlugs',
    notesKey: 'sparkPlugsNotes',
    label: 'Vela de Ignição',
    category: 'MECÂNICA',
    description: 'Conferir com 40.000 km (ajustar 0,7mm)',
  },
  {
    key: 'belts',
    notesKey: 'beltsNotes',
    label: 'Correia Dentada/Auxiliar',
    category: 'MECÂNICA',
    description: 'Conferir com 60.000 km (contaminação)',
  },
  {
    key: 'frontShocks',
    notesKey: 'frontShocksNotes',
    label: 'Amortecedor Dianteiro',
    category: 'MECÂNICA',
    description: 'Checar se há vazamento',
  },
  {
    key: 'rearShocks',
    notesKey: 'rearShocksNotes',
    label: 'Amortecedor Traseiro',
    category: 'MECÂNICA',
    description: 'Checar se há vazamento',
  },
  {
    key: 'suspension',
    notesKey: 'suspensionNotes',
    label: 'Suspensão',
    category: 'MECÂNICA',
    description: 'Checar terminal/articulação/bucha/rolamento',
  },

  // FLUIDOS
  {
    key: 'fluids',
    notesKey: 'fluidsNotes',
    label: 'Fluidos',
    category: 'FLUIDOS',
    description: 'Verificar níveis',
  },

  // PNEU/FREIOS
  {
    key: 'tires',
    notesKey: 'tiresNotes',
    label: 'Pneus',
    category: 'PNEU/FREIOS',
    description: 'Calibragem',
  },
  {
    key: 'brakePads',
    notesKey: 'brakePadsNotes',
    label: 'Pastilha de Freio',
    category: 'PNEU/FREIOS',
    description: 'Medir com calabre de inspeção (4mm)',
  },
  {
    key: 'brakeDiscs',
    notesKey: 'brakeDiscsNotes',
    label: 'Disco de Freio',
    category: 'PNEU/FREIOS',
    description: 'Medir com paquímetro o desgaste',
  },

  // MOTOR
  {
    key: 'engine',
    notesKey: 'engineNotes',
    label: 'Motor',
    category: 'MOTOR',
    description: 'Checar funcionamento/vazamento (carter)',
  },
  {
    key: 'radiator',
    notesKey: 'radiatorNotes',
    label: 'Radiador (Arrefecimento)',
    category: 'MOTOR',
    description: 'Verificar vazamentos inferiores',
  },
  {
    key: 'steeringBox',
    notesKey: 'steeringBoxNotes',
    label: 'Caixa de Direção',
    category: 'MOTOR',
    description: 'Verificar folga e vazamento',
  },
  {
    key: 'electricSteeringBox',
    notesKey: 'electricSteeringBoxNotes',
    label: 'Caixa Direção Elétrica',
    category: 'MOTOR',
    description: 'Verificar folga',
  },
  {
    key: 'exhaust',
    notesKey: 'exhaustNotes',
    label: 'Sistema de Escape',
    category: 'MOTOR',
    description: 'Checar vazamento/sinistros/alinhamento',
  },

  // AR CONDICIONADO
  {
    key: 'airConditioning',
    notesKey: 'airConditioningNotes',
    label: 'Ar Condicionado',
    category: 'AR CONDICIONADO',
    description: 'Checar se está congelando',
  },
  {
    key: 'airConditioningCompressor',
    notesKey: 'airConditioningCompressorNotes',
    label: 'Compressor Ar Condicionado',
    category: 'AR CONDICIONADO',
    description: 'Checar se está atracando',
  },
  {
    key: 'airConditioningCleaning',
    notesKey: 'airConditioningCleaningNotes',
    label: 'Limpeza Ar Condicionado',
    category: 'AR CONDICIONADO',
    description: 'Checar fluxo de ar (filtro de cabine)',
  },

  // ELÉTRICA
  {
    key: 'electricalActuationGlass',
    notesKey: 'electricalActuationGlassNotes',
    label: 'VIDRO',
    category: 'ELÉTRICA',
    description: 'Acionamento elétrico dos vidros',
  },
  {
    key: 'electricalActuationMirror',
    notesKey: 'electricalActuationMirrorNotes',
    label: 'RETROVISOR',
    category: 'ELÉTRICA',
    description: 'Acionamento elétrico dos retrovisores',
  },
  {
    key: 'electricalActuationSocket',
    notesKey: 'electricalActuationSocketNotes',
    label: 'TOMADA 12V',
    category: 'ELÉTRICA',
    description: 'Funcionamento da tomada 12V',
  },
  {
    key: 'electricalActuationLock',
    notesKey: 'electricalActuationLockNotes',
    label: 'TRAVA',
    category: 'ELÉTRICA',
    description: 'Sistema de travamento elétrico',
  },
  {
    key: 'electricalActuationTrunk',
    notesKey: 'electricalActuationTrunkNotes',
    label: 'PORTA MALA',
    category: 'ELÉTRICA',
    description: 'Acionamento elétrico do porta malas',
  },
  {
    key: 'electricalActuationWiper',
    notesKey: 'electricalActuationWiperNotes',
    label: 'LIMPADOR',
    category: 'ELÉTRICA',
    description: 'Sistema de limpadores de para-brisa',
  },
  {
    key: 'electricalActuationKey',
    notesKey: 'electricalActuationKeyNotes',
    label: 'CHAVE',
    category: 'ELÉTRICA',
    description: 'Funcionamento da chave/canivete',
  },
  {
    key: 'electricalActuationAlarm',
    notesKey: 'electricalActuationAlarmNotes',
    label: 'ALARME',
    category: 'ELÉTRICA',
    description: 'Sistema de alarme',
  },
  {
    key: 'electricalActuationInteriorLight',
    notesKey: 'electricalActuationInteriorLightNotes',
    label: 'LUZ INTERNA',
    category: 'ELÉTRICA',
    description: 'Iluminação interna do veículo',
  },
  {
    key: 'dashboardPanel',
    notesKey: 'dashboardPanelNotes',
    label: 'Painel de Instrumentos',
    category: 'ELÉTRICA',
    description: 'Checar luzes do painel',
  },
  {
    key: 'lights',
    notesKey: 'lightsNotes',
    label: 'Lâmpadas',
    category: 'ELÉTRICA',
    description: 'Checar funcionamento',
  },

  // BATERIA
  {
    key: 'battery',
    notesKey: 'batteryNotes',
    label: 'Bateria',
    category: 'BATERIA',
    description: 'Verificar carga e estado',
  },
];

const PartnerInspectionGroups: React.FC<Props> = ({ values, onChange }) => {
  const getStatusColor = (status: InspectionStatus) => {
    switch (status) {
      case 'ok':
        return '#10b981';
      case 'attention':
        return '#f59e0b';
      case 'critical':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status: InspectionStatus) => {
    switch (status) {
      case 'ok':
        return 'OK';
      case 'attention':
        return 'NOK';
      case 'critical':
        return 'NOK';
      default:
        return '';
    }
  };

  // Agrupar itens por categoria
  const groupedItems = inspectionItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, InspectionItem[]>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {Object.entries(groupedItems).map(([category, items]) => (
        <div
          key={category}
          style={{
            background: '#ffffff',
            border: '1px solid #e1e5e9',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <h3
            style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '16px',
              borderBottom: '2px solid #e1e5e9',
              paddingBottom: '8px',
            }}
          >
            {category}
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '20px',
            }}
          >
            {items.map(item => (
              <div
                key={item.key}
                style={{
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '16px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '12px',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h4
                      style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#111827',
                        marginBottom: '4px',
                      }}
                    >
                      {item.label}
                    </h4>
                    {item.description && (
                      <p
                        style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          margin: 0,
                          fontStyle: 'italic',
                        }}
                      >
                        {item.description}
                      </p>
                    )}
                  </div>

                  <span
                    style={{
                      fontSize: '12px',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      backgroundColor: getStatusColor(values[item.key]),
                      color: 'white',
                      fontWeight: '600',
                      marginLeft: '12px',
                    }}
                  >
                    {getStatusLabel(values[item.key])}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '6px',
                        border:
                          values[item.key] === 'ok' ? '2px solid #10b981' : '2px solid transparent',
                        backgroundColor: values[item.key] === 'ok' ? '#f0fdf4' : 'transparent',
                      }}
                    >
                      <input
                        type="radio"
                        name={item.key}
                        value="ok"
                        checked={values[item.key] === 'ok'}
                        onChange={() => onChange(item.key, 'ok')}
                        style={{ margin: 0 }}
                      />
                      <span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                        OK
                      </span>
                    </label>

                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '6px',
                        border:
                          values[item.key] === 'attention' || values[item.key] === 'critical'
                            ? '2px solid #ef4444'
                            : '2px solid transparent',
                        backgroundColor:
                          values[item.key] === 'attention' || values[item.key] === 'critical'
                            ? '#fef2f2'
                            : 'transparent',
                      }}
                    >
                      <input
                        type="radio"
                        name={`${item.key}_nok`}
                        value="nok"
                        checked={
                          values[item.key] === 'attention' || values[item.key] === 'critical'
                        }
                        onChange={() => onChange(item.key, 'attention')}
                        style={{ margin: 0 }}
                      />
                      <span style={{ fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                        NOK
                      </span>
                    </label>
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '4px',
                      }}
                    >
                      Observações
                    </label>
                    <textarea
                      value={values[item.notesKey]}
                      onChange={e => onChange(item.notesKey, e.target.value)}
                      placeholder="Digite observações (opcional)"
                      style={{
                        width: '100%',
                        minHeight: '60px',
                        padding: '8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PartnerInspectionGroups;
