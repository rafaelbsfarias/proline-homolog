// modules/vehicles/components/VehicleRegistrationModalBase.tsx
'use client';

import React from 'react';
import './VehicleRegistrationModal.css';
import type { VehicleRegistrationBaseProps } from './types';
import { useVehicleRegistrationForm } from '../hooks/useVehicleRegistrationForm';
import { VehicleFormFields } from './VehicleFormFields';
import MessageModal from '@/modules/common/components/MessageModal/MessageModal';

function VehicleRegistrationModalBase(props: VehicleRegistrationBaseProps) {
  const {
    isOpen,
    onClose,
    onSuccess,
    userRole,
    hiddenFields,
    // initialVehicle, // removido pois não existe na props
  } = props;
  const {
    formData,
    errors,
    loading,
    selectedClient,
    isHidden,
    handleInputChange,
    handlePlateChange,
    handleClientSelect,
    handleSubmit,
    error,
    success,
    setError,
    setSuccess,
  } = useVehicleRegistrationForm({
    isOpen,
    userRole,
    hiddenFields,
    onSuccess,
  });

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isHidden = (key: FieldKey) => (hiddenFields ?? []).includes(key);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        clientId: '',
        plate: '',
        brand: '',
        model: '',
        color: '',
        year: '',
        initialKm: '',
        fipe_value: '',
        observations: '',
        estimated_arrival_date: '',
      });
      setSelectedClient(null);
      setErrors({});
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (userRole === 'admin' && !selectedClient) {
      newErrors.clientId = 'Cliente é obrigatório';
    }

    if (!formData.plate.trim()) {
      newErrors.plate = PLATE_ERROR_MESSAGES.REQUIRED;
    } else if (!validatePlate(formData.plate)) {
      newErrors.plate = PLATE_ERROR_MESSAGES.INVALID_FORMAT;
    }

    if (!formData.brand.trim()) newErrors.brand = 'Marca é obrigatória';
    if (!formData.model.trim()) newErrors.model = 'Modelo é obrigatório';
    if (!formData.color.trim()) newErrors.color = 'Cor é obrigatória';

    if (!formData.year) {
      newErrors.year = 'Ano é obrigatório';
    } else {
      const currentYear = new Date().getFullYear();
      const y = Number(formData.year);
      if (y < 1900 || y > currentYear + 1) {
        newErrors.year = `Ano deve estar entre 1900 e ${currentYear + 1}`;
      }
    }

    if (!isHidden('initialKm') && formData.initialKm !== '' && Number(formData.initialKm) < 0) {
      newErrors.initialKm = 'Quilometragem deve ser positiva';
    }
    if (!isHidden('fipe_value') && formData.fipe_value !== '' && Number(formData.fipe_value) < 0) {
      newErrors.fipe_value = 'Valor FIPE deve ser positivo';
    }

    if (userRole === 'admin' && formData.estimated_arrival_date) {
      const d = new Date(formData.estimated_arrival_date);
      if (isNaN(d.getTime())) newErrors.estimated_arrival_date = 'Data inválida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    const endpoint = userRole === 'admin' ? '/api/admin/create-vehicle' : '/api/client/create-vehicle';
    const payload = {
      ...(userRole === 'admin' && { clientId: selectedClient!.id }),
      plate: formData.plate.trim().toUpperCase(),
      brand: formData.brand.trim(),
      model: formData.model.trim(),
      color: formData.color.trim(),
      year: Number(formData.year),
      ...(isHidden('initialKm') ? {} : { initialKm: formData.initialKm ? Number(formData.initialKm) : undefined }),
      ...(isHidden('fipe_value') ? {} : { fipe_value: formData.fipe_value ? Number(formData.fipe_value) : undefined }),
      observations: formData.observations.trim() || undefined,
      ...(userRole === 'admin' && { estimated_arrival_date: formData.estimated_arrival_date || undefined }),
    };

    try {
      const response = await post<{
        success: boolean;
        message: string;
        vehicle?: Vehicle;
        error?: string;
      }>(endpoint, payload);

      if (response.ok && response.data?.success) {
        setSuccess(true);
        onSuccess?.(response.data.vehicle);
      } else {
        throw new Error(response.data?.error || response.error || 'Erro ao cadastrar veículo');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar veículo');
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelect = (client: Client | null) => {
    setSelectedClient(client);
    setFormData(prev => ({ ...prev, clientId: client?.id || '' }));
    if (client && errors.clientId) {
      setErrors(prev => ({ ...prev, clientId: undefined }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPlateInput(e.target.value);
    setFormData(prev => ({ ...prev, plate: formatted }));
    if (errors.plate) setErrors(prev => ({ ...prev, plate: undefined }));
  };

  const handleClose = () => onClose();
  const handleCloseErrorModal = () => setError(null);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Cadastrar Novo Veículo</h2>
          <button className="close-button" onClick={onClose} disabled={loading}>
            ✕
          </button>
        </div>
        <VehicleFormFields
          formData={formData}
          errors={errors}
          loading={loading}
          userRole={userRole}
          selectedClient={selectedClient}
          isHidden={isHidden}
          handleInputChange={handleInputChange}
          handlePlateChange={handlePlateChange}
          handleClientSelect={handleClientSelect}
          handleSubmit={handleSubmit}
          onClose={onClose}
        />
        {error && <MessageModal message={error} onClose={() => setError(null)} variant="error" />}
        {success && (
          <MessageModal
            title="Sucesso"
            message="Veículo cadastrado com sucesso!"
            variant="success"
            onClose={() => {
              setSuccess(false);
              handleClose();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default VehicleRegistrationModalBase;
