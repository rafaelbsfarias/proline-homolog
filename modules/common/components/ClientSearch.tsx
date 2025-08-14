import React, { useState, useEffect, useRef } from 'react';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

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

  // Carregar clientes ao montar o componente
  useEffect(() => {
    if (!isInitialized) {
      loadClients();
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Atualizar termo de busca quando cliente selecionado mudar
  useEffect(() => {
    if (selectedClient) {
      setSearchTerm(selectedClient.full_name);
      setShowDropdown(false);
    } else {
      setSearchTerm('');
    }
  }, [selectedClient]);

  // Filtrar clientes baseado no termo de busca
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredClients(clients);
      return;
    }

    const filtered = clients.filter(client => {
      const searchLower = searchTerm.toLowerCase();
      return (
        client.full_name.toLowerCase().includes(searchLower) ||
        client.email.toLowerCase().includes(searchLower)
      );
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

      const response = await get<{
        success: boolean;
        clients: Client[];
      }>('/api/admin/get-clients');

      if (response.ok && response.data) {
        setClients(response.data.clients || []);
      }
    } catch {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Se o usuário limpou o campo, limpar seleção
    if (!value && selectedClient) {
      onClientSelect(null);
    }

    // Mostrar dropdown quando usuário digita
    if (value.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleInputFocus = () => {
    if (clients.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleClientSelect = (client: Client) => {
    onClientSelect(client);
    setSearchTerm(client.full_name);
    setShowDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        placeholder={loading ? 'Carregando clientes...' : placeholder}
        disabled={disabled || loading}
        style={{
          width: '100%',
          border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`,
          borderRadius: '8px',
          padding: '12px 16px',
          fontSize: '1rem',
          transition: 'all 0.2s ease',
          backgroundColor: disabled ? '#f9fafb' : 'white',
          boxShadow: error ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none',
        }}
      />

      {showDropdown && filteredClients.length > 0 && (
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 1000,
            marginTop: '4px',
          }}
        >
          {filteredClients.map(client => (
            <div
              key={client.id}
              onClick={() => handleClientSelect(client)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: '1px solid #f3f4f6',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              <div style={{ fontWeight: '500', color: '#111827' }}>{client.full_name}</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{client.email}</div>
            </div>
          ))}
        </div>
      )}

      {showDropdown && filteredClients.length === 0 && searchTerm && (
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            marginTop: '4px',
            padding: '12px 16px',
            color: '#6b7280',
            textAlign: 'center',
          }}
        >
          Nenhum cliente encontrado
        </div>
      )}

      {error && (
        <div
          style={{
            fontSize: '0.75rem',
            color: '#ef4444',
            marginTop: '4px',
            fontWeight: '500',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default ClientSearch;
