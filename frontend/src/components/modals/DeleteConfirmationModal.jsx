import React from 'react';
import Modal from '../layout/Modal';

const DeleteConfirmationModal = ({ isOpen, onCancel, onConfirm }) => {
  return (
    <Modal title="Confirmar Exclusão" isOpen={isOpen} onCancel={onCancel}>
      <p>Você tem certeza que deseja remover o compartilhamento deste item?</p>
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
        <button type="button" className="btn btn-danger" onClick={onConfirm}>Remover</button>
      </div>
    </Modal>
  );
};

export default DeleteConfirmationModal;
