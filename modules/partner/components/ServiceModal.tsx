import React, { useEffect, useRef, useState } from 'react';
import Modal from '@/modules/common/components/Modal';
import ServiceForm, { ServiceFormRef } from './ServiceForm';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onServiceAdded: () => void;
}

const ServiceModal: React.FC<ServiceModalProps> = ({ isOpen, onClose, onServiceAdded }) => {
  const [selectedCsvFile, setSelectedCsvFile] = useState<File | null>(null);
  const [csvImportMessage, setCsvImportMessage] = useState('');
  // NOVO: Estado para mensagens do formulário de adição de serviço (substitui o alert).
  const [formMessage, setFormMessage] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const csvFileInputRef = useRef<HTMLInputElement>(null);
  const serviceFormRef = useRef<ServiceFormRef>(null);

  const { authenticatedFetch } = useAuthenticatedFetch();

  // Efeito para limpar as mensagens quando o modal for fechado.
  useEffect(() => {
    if (!isOpen) {
      setCsvImportMessage('');
      setFormMessage('');
      setSelectedCsvFile(null);
    }
  }, [isOpen]);

  const handleImportCsvClick = () => {
    csvFileInputRef.current?.click();
  };

  const handleCsvFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedCsvFile(event.target.files[0]);
      setCsvImportMessage('');
      setFormMessage('');
    } else {
      setSelectedCsvFile(null);
    }
  };

  const handleConfirmCsvImport = async () => {
    if (!selectedCsvFile) {
      setCsvImportMessage('Por favor, selecione um arquivo CSV.');
      return;
    }

    setIsImporting(true);
    setCsvImportMessage('Importando...');
    setFormMessage('');

    const formData = new FormData();
    formData.append('csvFile', selectedCsvFile);

    try {
      // CORRIGIDO: A variável 'result' agora é usada para criar a mensagem de sucesso.
      const result = await authenticatedFetch<{ addedCount: number; failedCount: number }>(
        '/api/partner/services/import-csv',
        {
          method: 'POST',
          body: formData,
        }
      );

      if (result.data) {
        setCsvImportMessage(
          `Importação concluída! Adicionados: ${result.data.addedCount}, Falhas: ${result.data.failedCount}.`
        );
      } else {
        setCsvImportMessage(`Importação concluída!`);
      }
      onServiceAdded();
      setSelectedCsvFile(null);
    } catch (error) {
      // CORRIGIDO: console.error removido.
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro inesperado.';
      setCsvImportMessage(`Erro: ${errorMessage}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleSubmit = async (serviceData: {
    name: string;
    description: string;
    estimated_days: number;
    price: number;
  }) => {
    setFormMessage(''); // Limpa mensagens anteriores
    try {
      await authenticatedFetch('/api/partner/services', {
        method: 'POST',
        body: JSON.stringify(serviceData),
      });

      // CORRIGIDO: console.info removido.
      onClose(); // Fecha o modal em caso de sucesso
      onServiceAdded();
    } catch (error) {
      // CORRIGIDO: console.error e alert removidos. O erro agora é exibido no estado 'formMessage'.
      const errorMessage = error instanceof Error ? error.message : 'Falha ao adicionar serviço.';
      setFormMessage(`Erro: ${errorMessage}`);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gerenciar Serviços">
      <ServiceForm ref={serviceFormRef} onSubmit={handleSubmit} />

      <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
        {selectedCsvFile && (
          <p style={{ marginBottom: '10px' }}>
            Arquivo selecionado: <strong>{selectedCsvFile.name}</strong>
          </p>
        )}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => {
              serviceFormRef.current?.submitForm();
            }}
            style={{
              background: '#28a745',
              color: '#fff',
              fontWeight: 600,
              fontSize: '1.13rem',
              border: 0,
              borderRadius: 6,
              padding: '10px 32px',
              cursor: 'pointer',
            }}
          >
            Adicionar Serviço
          </button>
          <input
            type="file"
            accept=".csv"
            ref={csvFileInputRef}
            onChange={handleCsvFileChange}
            style={{ display: 'none' }}
          />
          <button
            onClick={handleImportCsvClick}
            disabled={isImporting}
            style={{
              background: '#002E4C',
              color: '#fff',
              fontWeight: 600,
              fontSize: '1.13rem',
              border: 0,
              borderRadius: 6,
              padding: '10px 32px',
              cursor: 'pointer',
              opacity: isImporting ? 0.7 : 1,
            }}
          >
            {isImporting ? 'Processando...' : 'Importar .csv'}
          </button>
          {selectedCsvFile && (
            <button
              onClick={handleConfirmCsvImport}
              disabled={isImporting}
              style={{
                background: '#007bff',
                color: '#fff',
                fontWeight: 600,
                fontSize: '1.13rem',
                border: 0,
                borderRadius: 6,
                padding: '10px 32px',
                cursor: 'pointer',
              }}
            >
              Confirmar Importação
            </button>
          )}
        </div>
        {/* CORRIGIDO: Renderiza a mensagem de erro do formulário ou a mensagem de importação */}
        {formMessage && <p style={{ color: 'red', marginTop: '10px' }}>{formMessage}</p>}
        {csvImportMessage && (
          <p
            style={{
              color: csvImportMessage.startsWith('Erro') ? 'red' : 'green',
              marginTop: '10px',
            }}
          >
            {csvImportMessage}
          </p>
        )}
      </div>
    </Modal>
  );
};

export default ServiceModal;
