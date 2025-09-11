// modules/vehicles/components/VehicleFormFields.tsx
'use client';

import React from 'react';
import {
  formatPlateInput,
  PLATE_ERROR_MESSAGES,
  validatePlate,
} from '@/modules/common/utils/plateValidation';
import ClientSearch from '@/modules/common/components/ClientSearch';
import type { FieldKey } from './types';

interface VehicleFormFieldsProps {
  formData: any; // Replace with actual type if available
  errors: any; // Replace with actual type if available
  loading: boolean;
  userRole: 'admin' | 'client';
  selectedClient: any; // Replace with actual type if available
  isHidden: (key: FieldKey) => boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handlePlateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleClientSelect: (client: any | null) => void; // Replace with actual type if available
  handleCheckboxChange: (name: string, checked: boolean) => void;
  handleSubmit: (e: React.FormEvent) => void;
}

export const VehicleFormFields: React.FC<VehicleFormFieldsProps> = ({
  formData,
  errors,
  loading,
  userRole,
  selectedClient,
  isHidden,
  handleInputChange,
  handlePlateChange,
  handleClientSelect,
  handleCheckboxChange,
  handleSubmit,
}) => {
  return (
    <>
      {userRole === 'admin' && (
        <div className="form-row">
          <div className="form-group full-width">
            <label htmlFor="clientSearch" className="required">
              Cliente
            </label>
            <ClientSearch
              selectedClient={selectedClient}
              onClientSelect={handleClientSelect}
              placeholder="Buscar cliente por nome ou email..."
              disabled={loading}
              error={errors.clientId}
            />
          </div>
        </div>
      )}

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="plate" className="required">
            Placa
          </label>
          <input
            type="text"
            id="plate"
            name="plate"
            value={formData.plate}
            onChange={handlePlateChange}
            placeholder="ABC-1234 ou ABC-1D23"
            className={errors.plate ? 'error' : ''}
            disabled={loading}
            maxLength={8}
            required
          />
          {errors.plate && <span className="error-message">{errors.plate}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="year" className="required">
            Ano
          </label>
          <input
            type="number"
            id="year"
            name="year"
            value={formData.year}
            onChange={handleInputChange}
            placeholder="2024"
            className={errors.year ? 'error' : ''}
            disabled={loading}
            min="1900"
            max={new Date().getFullYear() + 1}
            required
          />
          {errors.year && <span className="error-message">{errors.year}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="brand" className="required">
            Marca
          </label>
          <input
            type="text"
            id="brand"
            name="brand"
            value={formData.brand}
            onChange={handleInputChange}
            placeholder="Toyota, Volkswagen, etc."
            className={errors.brand ? 'error' : ''}
            disabled={loading}
            required
          />
          {errors.brand && <span className="error-message">{errors.brand}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="model" className="required">
            Modelo
          </label>
          <input
            type="text"
            id="model"
            name="model"
            value={formData.model}
            onChange={handleInputChange}
            placeholder="Corolla, Golf, etc."
            className={errors.model ? 'error' : ''}
            disabled={loading}
            required
          />
          {errors.model && <span className="error-message">{errors.model}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="color" className="required">
            Cor
          </label>
          <input
            type="text"
            id="color"
            name="color"
            value={formData.color}
            onChange={handleInputChange}
            placeholder="Branco, Preto, Azul, etc."
            className={errors.color ? 'error' : ''}
            disabled={loading}
            required
          />
          {errors.color && <span className="error-message">{errors.color}</span>}
        </div>

        {/* Valor FIPE (ocultável) */}
        {!isHidden('fipe_value') && (
          <div className="form-group">
            <label htmlFor="fipe_value">Valor FIPE (R$)</label>
            <input
              type="number"
              id="fipe_value"
              name="fipe_value"
              value={formData.fipe_value}
              onChange={handleInputChange}
              placeholder="50000"
              className={errors.fipe_value ? 'error' : ''}
              disabled={loading}
              min="0"
              step="0.01"
            />
            {errors.fipe_value && <span className="error-message">{errors.fipe_value}</span>}
          </div>
        )}
      </div>

      <div className="form-row">
        {/* Quilometragem Inicial (ocultável) */}
        {!isHidden('initialKm') && (
          <div className="form-group">
            <label htmlFor="initialKm">Quilometragem Inicial</label>
            <input
              type="number"
              id="initialKm"
              name="initialKm"
              value={formData.initialKm}
              onChange={handleInputChange}
              placeholder="Ex: 50000"
              className={errors.initialKm ? 'error' : ''}
              disabled={loading}
              min="0"
            />
            {errors.initialKm && <span className="error-message">{errors.initialKm}</span>}
          </div>
        )}

        {userRole === 'admin' && (
          <div className="form-group">
            <label htmlFor="estimated_arrival_date">Data Prevista de Chegada</label>
            <input
              type="date"
              id="estimated_arrival_date"
              name="estimated_arrival_date"
              value={formData.estimated_arrival_date}
              onChange={handleInputChange}
              className={errors.estimated_arrival_date ? 'error' : ''}
              disabled={loading}
              min={new Date().toISOString().split('T')[0]}
            />
            {errors.estimated_arrival_date && (
              <span className="error-message">{errors.estimated_arrival_date}</span>
            )}
          </div>
        )}
      </div>

      <div className="form-row">
        {!isHidden('observations') && (
          <div className="form-row">
            <div className="form-group full-width">
              <label>Finalidade do Veículo</label>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="preparacao"
                    checked={formData.preparacao}
                    onChange={e => handleCheckboxChange('preparacao', e.target.checked)}
                    disabled={loading}
                  />
                  <span className="checkmark"></span>
                  Preparação
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="comercializacao"
                    checked={formData.comercializacao}
                    onChange={e => handleCheckboxChange('comercializacao', e.target.checked)}
                    disabled={loading}
                  />
                  <span className="checkmark"></span>
                  Comercialização
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
