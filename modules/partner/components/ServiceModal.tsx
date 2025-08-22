import React, { useEffect, useRef, useState } from 'react';
import Modal from '@/modules/common/components/Modal';
import ServiceForm from './ServiceForm';
import { useAuthenticatedFetch } from '@/modules/common/hooks/useAuthenticatedFetch';
import {
  addService,
  importServicesFromCsv,
  type ServiceData,
} from '../services/partnerClientService';
import styles from './ServiceModal.module.css';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const csvFileInputRef = useRef<HTMLInputElement>(null);
  const { authenticatedFetch } = useAuthenticatedFetch();

  useEffect(() => {
    if (!isOpen) {
      // Reset states when modal is closed
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

      <div className={styles.footer}>
        {selectedCsvFile && (
          <p className={styles.selectedFile}>
            Arquivo selecionado: <strong>{selectedCsvFile.name}</strong>
          </p>
        )}
        <div className={styles.buttonGroup}>
          <button
            type="submit"
            form={ADD_SERVICE_FORM_ID}
            disabled={isSubmitting}
            className={`${styles.button} ${styles.buttonPrimary}`}
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
            className={`${styles.button} ${styles.buttonSecondary}`}
          >
            {isImporting ? 'Processando...' : 'Importar .csv'}
          </button>
          {selectedCsvFile && (
            <button
              onClick={handleConfirmCsvImport}
              disabled={isImporting}
              className={`${styles.button} ${styles.buttonConfirm}`}
            >
              Confirmar Importação
            </button>
          )}
        </div>
        {formMessage && <p className={`${styles.message} ${styles.errorMessage}`}>{formMessage}</p>}
        {csvImportMessage && (
          <p
            className={`${styles.message} ${
              csvImportMessage.startsWith('Erro') ? styles.errorMessage : styles.successMessage
            }`}
          >
            {csvImportMessage}
          </p>
        )}
      </div>
    </Modal>
  );
};

export default ServiceModal;
