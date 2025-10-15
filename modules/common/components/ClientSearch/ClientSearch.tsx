import React, { useState, useEffect, useRef } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import Input from '@/modules/common/components/Input/Input';
import styles from './ClientSearch.module.css';

interface Client {
  id: string;
  full_name: string;
  email: string;
}

interface ClientSearchProps {
  selectedClient: Client | null;
  onClientSelect: (client: Client | null) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

const ClientSearch: React.FC<ClientSearchProps> = ({
  selectedClient,
  onClientSelect,
  placeholder = 'Buscar cliente por nome ou email...',
  disabled = false,
  error,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const { get } = useAuthenticatedFetch();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Carregar clientes ao montar
  useEffect(() => {
    if (!isInitialized) {
      loadClients();
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Atualiza o campo quando o cliente selecionado muda
  useEffect(() => {
    if (selectedClient) {
      setSearchTerm(selectedClient.full_name);
      setShowDropdown(false);
    } else {
      setSearchTerm('');
    }
  }, [selectedClient]);

  // Filtrar clientes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredClients(clients);
      return;
    }

    const filtered = clients.filter(client => {
      const s = searchTerm.toLowerCase();
      return client.full_name.toLowerCase().includes(s) || client.email.toLowerCase().includes(s);
    });

    setFilteredClients(filtered);
  }, [searchTerm, clients]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await get<{ success: boolean; clients: Client[] }>('/api/admin/get-clients');
      if (response.ok && response.data) {
        setClients(response.data.clients || []);
      }
    } catch {
      // falha silenciosa
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (!value && selectedClient) {
      onClientSelect(null);
    }

    if (value.length > 0) setShowDropdown(true);
  };

  const handleInputFocus = () => {
    if (clients.length > 0) setShowDropdown(true);
  };

  const handleClientSelect = (client: Client) => {
    onClientSelect(client);
    setSearchTerm(client.full_name);
    setShowDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setShowDropdown(false);
  };

  return (
    <div className={styles.wrapper}>
      <Input
        id="clientSearch"
        name="clientSearch"
        label="Cliente"
        value={searchTerm}
        onChange={handleInputChange}
        placeholder={loading ? 'Carregando clientes...' : placeholder}
        disabled={disabled || loading}
        ref={inputRef}
      />

      {showDropdown && (
        <div ref={dropdownRef} className={styles.dropdown}>
          {filteredClients.length > 0 ? (
            filteredClients.map(client => (
              <div
                key={client.id}
                className={styles.dropdownItem}
                onClick={() => handleClientSelect(client)}
              >
                <div className={styles.clientName}>{client.full_name}</div>
                <div className={styles.clientEmail}>{client.email}</div>
              </div>
            ))
          ) : (
            <div className={styles.noResults}>Nenhum cliente encontrado</div>
          )}
        </div>
      )}

      {error && <div className={styles.errorMessage}>{error}</div>}
    </div>
  );
};

export default ClientSearch;
