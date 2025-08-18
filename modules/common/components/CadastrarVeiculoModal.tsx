'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/modules/common/components/Modal';
import FormInput from '@/modules/common/components/FormInput';
import { FaSave, FaTimes } from 'react-icons/fa';
import { useToast } from '@/modules/common/components/ToastProvider';
import styles from './CadastrarVeiculoModal.module.css';
import { useAuthService } from '@/modules/common/services/AuthService';

interface CadastrarVeiculoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ClientOption {
  id: string;
  full_name: string;
  email: string;
}

const CadastrarVeiculoModal: React.FC<CadastrarVeiculoModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useToast();
  const authService = useAuthService();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [form, setForm] = useState({
    clientId: '',
    plate: '',
    model: '',
    color: '',
    year: '',
    initialKm: '',
    fipe_value: '',
    observations: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      const user = await authService.getCurrentUser();
      if (user.data.user) {
        setUserRole(user.data.user.user_metadata?.role || null);
      }
    };
    fetchUserRole();
  }, [authService]);

  useEffect(() => {
    if (userRole === 'admin' && isOpen) {
      const fetchClients = async () => {
        try {
          const res = await fetch('/api/admin/clientes');
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Erro ao carregar clientes.');
          }
          setClients(data.clients);
        } catch (err: any) {
          showToast('error', err.message || 'Erro ao carregar clientes.');
        } finally {
          setLoadingClients(false);
        }
      };
      fetchClients();
    }
  }, [userRole, isOpen, showToast]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleClose = () => {
    setForm({
      clientId: '',
      plate: '',
      model: '',
      color: '',
      year: '',
      initialKm: '',
      fipe_value: '',
      observations: '',
    });
    setError(null);
    setLoading(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validação de campos obrigatórios
    if (
      (userRole === 'admin' && !form.clientId) ||
      !form.plate ||
      !form.model ||
      !form.color ||
      !form.year ||
      !form.initialKm ||
      !form.fipe_value
    ) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/veiculos/cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao cadastrar veículo.');
      }

      showToast('success', data.message || 'Veículo cadastrado com sucesso!');
      handleClose(); // Fecha e reseta o formulário
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar veículo.');
      showToast('error', err.message || 'Erro ao cadastrar veículo.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null; // Não renderiza se não estiver aberto

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Cadastrar Veículo">
      <div className={styles.formContainer}>
        {userRole === 'admin' && loadingClients ? (
          <div>Carregando clientes...</div>
        ) : userRole === 'admin' && clients.length === 0 ? (
          <div className={styles.noClientsMessage}>
            Nenhum cliente cadastrado. Cadastre um cliente antes de adicionar um veículo.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.formGrid}>
            {userRole === 'admin' && (
              <div className={styles.formGroup}>
                <label htmlFor="clientId">Cliente Associado</label>
                <select
                  id="clientId"
                  name="clientId"
                  value={form.clientId}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className={styles.selectInput}
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.full_name} ({client.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <FormInput
              label="Placa"
              id="plate"
              name="plate"
              value={form.plate}
              onChange={handleChange}
              required
              disabled={loading}
            />
            <FormInput
              label="Modelo"
              id="model"
              name="model"
              value={form.model}
              onChange={handleChange}
              required
              disabled={loading}
            />
            <FormInput
              label="Cor"
              id="color"
              name="color"
              value={form.color}
              onChange={handleChange}
              required
              disabled={loading}
            />
            <FormInput
              label="Ano"
              id="year"
              name="year"
              type="number"
              value={form.year}
              onChange={handleChange}
              required
              disabled={loading}
            />
            <FormInput
              label="KM Inicial"
              id="initialKm"
              name="initialKm"
              type="number"
              value={form.initialKm}
              onChange={handleChange}
              required
              disabled={loading}
            />
            <FormInput
              label="Valor FIPE"
              id="fipe_value"
              name="fipe_value"
              type="number"
              value={form.fipe_value}
              onChange={handleChange}
              required
              disabled={loading}
            />
            <div className={styles.formGroupFullWidth}>
              <label htmlFor="observations">Observações (Opcional)</label>
              <textarea
                id="observations"
                name="observations"
                value={form.observations}
                onChange={handleChange}
                disabled={loading}
                className={styles.textareaInput}
                rows={4}
              />
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            <div className={styles.formActions}>
              <button
                type="submit"
                className={`${styles.modalButton} ${styles.primary}`}
                disabled={loading}
              >
                {loading ? 'Cadastrando...' : 'Cadastrar Veículo'}
              </button>
              <button
                type="button"
                className={`${styles.modalButton} ${styles.secondary}`}
                onClick={() =>
                  setForm({
                    clientId: userRole === 'admin' ? form.clientId : '',
                    plate: '',
                    model: '',
                    color: '',
                    year: '',
                    initialKm: '',
                    fipe_value: '',
                    observations: '',
                  })
                }
                disabled={loading}
              >
                Limpar
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default CadastrarVeiculoModal;
