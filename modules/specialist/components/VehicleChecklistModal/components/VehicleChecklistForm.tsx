import React from 'react';
import { ChecklistForm, VehicleInfo } from '../../../checklist/types';
import { ServiceCategory } from '../../../services/ChecklistService';
import DatePickerBR from '@/modules/common/components/DatePickerBR/DatePickerBR';
import Input from '@/modules/common/components/Input/Input';
import Select from '@/modules/common/components/Select/Select';
import ServiceCategoryField from '../../Checklist/ServiceCategoryField';
import styles from '../VehicleChecklistModal.module.css';

const fuelLevelOptions = [
  { value: 'empty', label: 'Vazio' },
  { value: 'quarter', label: '1/4' },
  { value: 'half', label: '1/2' },
  { value: 'three_quarters', label: '3/4' },
  { value: 'full', label: 'Cheio' },
];

const snakeToCamel = (str: string) =>
  str.replace(/([-_][a-z])/g, group => group.toUpperCase().replace('-', '').replace('_', ''));

export interface VehicleChecklistFormProps {
  form: ChecklistForm;
  vehicle: VehicleInfo;
  serviceCategories: ServiceCategory[];
  isFinalized: boolean;
  onFieldChange: (field: keyof ChecklistForm, value: string | ChecklistForm['fuelLevel']) => void;
  onServiceFlagChange: (serviceKey: keyof ChecklistForm['services'], value: boolean) => void;
  onServiceNotesChange: (serviceKey: keyof ChecklistForm['services'], value: string) => void;
}

/**
 * Componente para o formulário principal do checklist de veículo
 * Responsável apenas pela apresentação e interação do formulário
 * Segue o princípio da responsabilidade única
 */
const VehicleChecklistForm: React.FC<VehicleChecklistFormProps> = ({
  form,
  vehicle,
  serviceCategories,
  isFinalized,
  onFieldChange,
  onServiceFlagChange,
  onServiceNotesChange,
}) => {
  const displayedServices = React.useMemo(() => {
    if (!vehicle) return [];

    return serviceCategories.filter(category => {
      if (vehicle.comercializacao && category.type === 'comercializacao') {
        return true;
      }
      if (vehicle.preparacao && category.type === 'preparacao') {
        return true;
      }
      return false;
    });
  }, [vehicle, serviceCategories]);

  return (
    <>
      {/* Observações do Cliente */}
      {vehicle.observations && vehicle.observations.trim() !== '' && (
        <div className={styles.clientObservations}>
          <h4 className={styles.observationsTitle}>Observações do Cliente</h4>
          <p className={styles.observationsText}>{vehicle.observations}</p>
        </div>
      )}

      {/* Dados básicos da inspeção */}
      <div className={styles.grid}>
        <div className={styles.field}>
          <DatePickerBR
            id="date"
            label="Data da inspeção"
            valueIso={form.date}
            onChangeIso={(iso: string) => onFieldChange('date', iso)}
            minIso={new Date().toISOString().split('T')[0]}
            disabledDatesIso={[]}
            ariaLabel="Data da inspeção"
            containerClass={styles.datePickerContainer}
            inputClass={styles.datePickerInput}
            placeholder="dd/mm/aaaa"
          />
        </div>
        <div className={styles.field}>
          <Input
            id="odometer"
            name="odometer"
            label="Quilometragem atual (km)"
            type="text"
            value={form.odometer}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onFieldChange('odometer', e.target.value)
            }
            required
            disabled={isFinalized}
            mask={Number}
          />
        </div>
        <div className={styles.field}>
          <Select
            id="fuelLevel"
            className={styles.fuelLevel}
            name="fuelLevel"
            label="Nível de combustível"
            value={form.fuelLevel}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              onFieldChange('fuelLevel', e.target.value as ChecklistForm['fuelLevel'])
            }
            options={fuelLevelOptions}
            disabled={isFinalized}
          />
        </div>
      </div>

      {/* Campo de observações */}
      <div className={styles.field}>
        <label htmlFor="observations" className={styles.label}>
          Observações
        </label>
        <textarea
          id="observations"
          name="observations"
          value={form.observations}
          onChange={e => onFieldChange('observations', e.target.value)}
          disabled={isFinalized}
          className={styles.textarea}
          placeholder="Digite suas observações sobre o veículo..."
          rows={3}
        />
      </div>

      {/* Sinalização de serviços necessários por categoria */}
      {(vehicle?.comercializacao || vehicle?.preparacao) && displayedServices.length > 0 && (
        <div className={styles.group}>
          <h4 className={styles.groupTitle}>Serviços necessários</h4>
          <div className={styles.grid}>
            {displayedServices.map(category => {
              const formKey = snakeToCamel(category.key) as keyof typeof form.services;
              if (!form.services[formKey]) {
                return null;
              }
              return (
                <ServiceCategoryField
                  key={category.id}
                  label={category.name}
                  checked={form.services[formKey].required}
                  notes={form.services[formKey].notes}
                  onToggle={v => onServiceFlagChange(formKey, v)}
                  onNotesChange={v => onServiceNotesChange(formKey, v)}
                  disabled={isFinalized}
                />
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default VehicleChecklistForm;
