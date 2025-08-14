import React, { useEffect, useState, useCallback } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import styles from './AddSpecialistToClientModal.module.css';

interface Specialist {
  id: string;
  full_name: string;
  email: string;
  user_role?: string; // usado apenas para filtragem quando a API retorna múltiplas roles
}

interface AddSpecialistToClientModalProps {
  isOpen: boolean;
  clientId: string;
  clientName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

// Single Responsibility: Tipagem da resposta da API
interface ApiResponse {
  users: Specialist[];
  count: number;
}

// Single Responsibility: Lógica de filtro isolada
const filterSpecialists = (specialists: Specialist[], searchTerm: string): Specialist[] => {
  if (!searchTerm.trim()) return specialists;

  const term = searchTerm.toLowerCase();
  return specialists.filter(
    specialist =>
      specialist.full_name.toLowerCase().includes(term) ||
      specialist.email.toLowerCase().includes(term)
  );
};

// Single Responsibility: Estado inicial limpo
const getInitialState = () => ({
  specialists: [] as Specialist[],
  selected: [] as string[],
  loading: false,
  error: null as string | null,
  success: false,
  searchTerm: '',
});

// Normaliza a resposta, aceitando tanto um objeto { users: [] } quanto um array direto []
const normalizeApiUsers = (data: unknown): Specialist[] | null => {
  // Caso a API retorne um array de usuários diretamente
  if (Array.isArray(data)) {
    const arr = data as any[];
    return arr
      .filter(u => (u?.user_role || u?.role) === 'specialist')
      .map(u => ({ id: u.id, full_name: u.full_name, email: u.email }));
  }

  // Caso a API retorne no formato { users: [...] }
  if (
    typeof data === 'object' &&
    data !== null &&
    'users' in data &&
    Array.isArray((data as any).users)
  ) {
    const users = (data as any).users as any[];
    return users
      .filter(u => (u?.user_role || u?.role) === 'specialist')
      .map(u => ({ id: u.id, full_name: u.full_name, email: u.email }));
  }

  return null;
};

const AddSpecialistToClientModal: React.FC<AddSpecialistToClientModalProps> = ({
  isOpen,
  clientId,
  clientName,
  onClose,
  onSuccess,
}) => {
  const { get, post } = useAuthenticatedFetch();
  const [state, setState] = useState(getInitialState());

  // Single Responsibility: Reset limpo do modal
  const resetModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      selected: [],
      error: null,
      success: false,
      searchTerm: '',
    }));
  }, []);

  // Single Responsibility: Buscar especialistas remotamente (com search por nome/email)
  const fetchSpecialists = useCallback(
    async (term: string) => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const qs = new URLSearchParams({ role: 'specialist' });
        if (term.trim()) qs.set('q', term.trim());
        const response = await get<ApiResponse>(`/api/admin/list-users?${qs.toString()}`);

        if (!response.ok) {
          setState(prev => ({
            ...prev,
            error: response.error || 'Erro ao buscar especialistas',
            loading: false,
          }));
          return;
        }

        const users = normalizeApiUsers(response.data);
        if (!users) {
          setState(prev => ({
            ...prev,
            error: 'Resposta da API inválida',
            loading: false,
          }));
          return;
        }

        setState(prev => ({
          ...prev,
          specialists: users,
          loading: false,
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: 'Erro ao buscar especialistas',
          loading: false,
        }));
      }
    },
    [get]
  );

  // Busca inicial ao abrir
  useEffect(() => {
    if (!isOpen) {
      resetModal();
      return;
    }
    fetchSpecialists('');
  }, [isOpen, fetchSpecialists, resetModal]);

  // Busca remota com debounce ao digitar
  useEffect(() => {
    if (!isOpen) return;
    const handle = setTimeout(() => {
      fetchSpecialists(state.searchTerm);
    }, 300);
    return () => clearTimeout(handle);
  }, [isOpen, state.searchTerm, fetchSpecialists]);

  // Single Responsibility: Toggle de seleção
  const handleSelect = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      selected: prev.selected.includes(id)
        ? prev.selected.filter(s => s !== id)
        : [...prev.selected, id],
    }));
  }, []);

  // Single Responsibility: Submissão com error handling
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!state.selected.length) return;

      setState(prev => ({ ...prev, loading: true, error: null, success: false }));

      try {
        const response = await post('/api/admin/assign-specialists', {
          clientId,
          specialistIds: state.selected,
        });

        if (!response.ok) {
          throw new Error(response.error || 'Erro ao vincular especialistas');
        }

        setState(prev => ({ ...prev, success: true, selected: [] }));
        onSuccess?.();
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        }));
      } finally {
        setState(prev => ({ ...prev, loading: false }));
      }
    },
    [clientId, state.selected, post, onSuccess]
  );

  if (!isOpen) return null;

  const filteredSpecialists = filterSpecialists(state.specialists, state.searchTerm);
  const hasSpecialists = filteredSpecialists.length > 0;
  const canSubmit = state.selected.length > 0 && !state.loading;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button className={styles.closeButton} onClick={onClose} type="button">
          &times;
        </button>

        <h2>Vincular Especialista(s) ao cliente: {clientName}</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Buscar especialista por nome ou email..."
            className={styles.searchInput}
            value={state.searchTerm}
            onChange={e => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
          />

          <div className={styles.listContainer}>
            {state.loading ? (
              <div>Carregando especialistas...</div>
            ) : !hasSpecialists ? (
              <div>Nenhum especialista encontrado.</div>
            ) : (
              filteredSpecialists.map(specialist => (
                <label key={specialist.id} className={styles.specialistItem}>
                  <input
                    type="checkbox"
                    checked={state.selected.includes(specialist.id)}
                    onChange={() => handleSelect(specialist.id)}
                  />
                  {specialist.full_name} ({specialist.email})
                </label>
              ))
            )}
          </div>

          <button type="submit" disabled={!canSubmit}>
            {state.loading ? 'Salvando...' : 'Vincular'}
          </button>

          {state.error && <div className={styles.error}>{state.error}</div>}
          {state.success && <div className={styles.success}>Especialista(s) vinculado(s)!</div>}
        </form>
      </div>
    </div>
  );
};

export default AddSpecialistToClientModal;
