'use client';
import { FaCar, FaUserPlus, FaUsers } from 'react-icons/fa';
import { MdConstruction } from 'react-icons/md';
import styles from './Toolbar.module.css';
import { AddUserModal } from './AddUserModal';
import { AddPartnerModal } from './AddPartnerModal';
import { AddClientModal } from './AddClientModal';
import React, { useState } from 'react';
import VehicleRegistrationModal from './VehicleRegistrationModal';

const Toolbar: React.FC = () => {
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddPartner, setShowAddPartner] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);

  const handleVehicleSuccess = () => {
    // Aqui você pode adicionar lógica para atualizar a lista de veículos
    // ou mostrar uma notificação de sucesso
    // Sucesso silencioso, sem log
  };
  return (
    <section className={styles.toolbarSection}>
      <h3 className={styles.panelTitle}></h3>
      <div className={styles.actionButtonsContainer}>
        <button className={styles.btnVehicle} onClick={() => setShowVehicleModal(true)}>
          <span className={styles.iconWrapper}>
            <FaCar size={20} color="#fff" />
          </span>
          Adicionar Veículo
        </button>
        <button className={styles.btnClient} onClick={() => setShowAddClient(true)}>
          <span className={styles.iconWrapper}>
            <FaUserPlus size={20} color="#fff" />
          </span>
          Adicionar Cliente
        </button>
        <button
          className={styles.btnPartner}
          onClick={() => setShowAddPartner(true)}
          data-testid="add-partner-button"
        >
          <span className={styles.iconWrapper}>
            <MdConstruction size={20} color="#fff" />
          </span>
          Adicionar Parceiro
        </button>
        <button className={styles.btnUsers} onClick={() => setShowAddUser(true)}>
          <span className={styles.iconWrapper}>
            <FaUsers size={20} color="#fff" />
          </span>
          Adicionar Usuários
        </button>
      </div>
      <AddUserModal isOpen={showAddUser} onClose={() => setShowAddUser(false)} />
      <AddPartnerModal isOpen={showAddPartner} onClose={() => setShowAddPartner(false)} />
      <AddClientModal isOpen={showAddClient} onClose={() => setShowAddClient(false)} />
      <VehicleRegistrationModal
        isOpen={showVehicleModal}
        onClose={() => setShowVehicleModal(false)}
        onSuccess={handleVehicleSuccess}
      />
    </section>
  );
};

export default Toolbar;
