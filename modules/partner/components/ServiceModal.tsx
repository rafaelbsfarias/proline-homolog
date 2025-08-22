import React, { useEffect, useRef, useState } from 'react';
import Modal from '@/modules/common/components/Modal';
import ServiceForm from './ServiceForm';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import {
  addService,
  importServicesFromCsv,
  type ServiceData,
} from '../services/partnerClientService';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onServiceAdded: () => void;
}

const ADD_SERVICE_FORM_ID = 'add-service-form';

const ServiceModal: React.FC<ServiceModalProps> = ({ isOpen, onClose, onServiceAdded }) => {
  const [selectedCsvFile, setSelectedCsvFile] = useState<File | null>(null);
  const [csvImportMessage, setCsvImportMessage] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Estado para o submit do formulário

  const csvFileInputRef = useRef<HTMLInputElement>(null);
  const { authenticatedFetch } = useAuthenticatedFetch();

  useEffect(() => {
    if (!isOpen) {
      setCsvImportMessage('');
      setFormMessage('');
      setSelectedCsvFile(null);
      setIsSubmitting(false);
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

    try {
      const result = await importServicesFromCsv(authenticatedFetch, selectedCsvFile);
      setCsvImportMessage(
        `Importação concluída! Adicionados: ${result.addedCount}, Falhas: ${result.failedCount}.`
      );
      onServiceAdded();
      setSelectedCsvFile(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro inesperado.';
      setCsvImportMessage(`Erro: ${errorMessage}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleSubmit = async (serviceData: ServiceData) => {
    setFormMessage('');
    setIsSubmitting(true);
    try {
      await addService(authenticatedFetch, serviceData);
      onClose();
      onServiceAdded();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Falha ao adicionar serviço.';
      setFormMessage(`Erro: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gerenciar Serviços">
      <ServiceForm formId={ADD_SERVICE_FORM_ID} onSubmit={handleSubmit} />

      <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
        {selectedCsvFile && (
          <p style={{ marginBottom: '10px' }}>
            Arquivo selecionado: <strong>{selectedCsvFile.name}</strong>
          </p>
        )}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="submit" // Alterado para submit
            form={ADD_SERVICE_FORM_ID} // Associa ao formulário
            disabled={isSubmitting}
            style={{
              background: '#28a745',
              color: '#fff',
              fontWeight: 600,
              fontSize: '1.13rem',
              border: 0,
              borderRadius: 6,
              padding: '10px 32px',
              cursor: 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? 'Adicionando...' : 'Adicionar Serviço'}
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
