import React, { useState, useEffect } from 'react';
import { Folder, File, MoreVertical, ChevronRight, Search, Key } from 'lucide-react';
import Header from '../layout/Header';
import Modal from '../layout/Modal';
import ItemActionsMenu from '../layout/ItemActionsMenu';
import NewCredentialForm from '../forms/NewCredentialForm';

const Cofre = ({ fileSystem, setFileSystem }) => {
  const [currentPath, setCurrentPath] = useState('/');
  const [items, setItems] = useState(fileSystem[currentPath]);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [isNewCredentialModalOpen, setIsNewCredentialModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [activeItemIndex, setActiveItemIndex] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    setItems(fileSystem[currentPath]);
  }, [currentPath, fileSystem]);

  useEffect(() => {
    const handleOutsideClick = () => {
      if (activeItemIndex !== null) {
        setActiveItemIndex(null);
      }
    };

    window.addEventListener('click', handleOutsideClick);
    return () => {
      window.removeEventListener('click', handleOutsideClick);
    };
  }, [activeItemIndex]);

  const openNewFolderModal = () => setIsNewFolderModalOpen(true);
  const closeNewFolderModal = () => {
    setIsNewFolderModalOpen(false);
    setNewFolderName('');
  };

  const openNewCredentialModal = () => setIsNewCredentialModalOpen(true);
  const closeNewCredentialModal = () => setIsNewCredentialModalOpen(false);

  const handleCreateFolder = () => {
    if (newFolderName.trim() === '') return;
    const newFolder = { type: 'folder', name: newFolderName.trim() };
    const newPath = `${currentPath}${newFolderName.trim()}/`;
    const updatedFileSystem = { ...fileSystem, [currentPath]: [...fileSystem[currentPath], newFolder], [newPath]: [] };
    setFileSystem(updatedFileSystem);
    setItems(updatedFileSystem[currentPath]);
    closeNewFolderModal();
  };

  const addPassword = (newPassword) => {
    const newCredential = { type: 'credential', name: newPassword.name, email: newPassword.email };
    const updatedFileSystem = { ...fileSystem, [currentPath]: [...fileSystem[currentPath], newCredential] };
    setFileSystem(updatedFileSystem);
    setItems(updatedFileSystem[currentPath]);
    closeNewCredentialModal();
  };

  const openDeleteModal = (index) => {
    setItemToDelete(index);
    setIsDeleteModalOpen(true);
    setActiveItemIndex(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const confirmDelete = () => {
    if (itemToDelete === null) return;

    const item = items[itemToDelete];
    // For now, only allow deleting files, credentials, and empty folders
    if (item.type === 'folder') {
      const folderPath = `${currentPath}${item.name}/`;
      if (fileSystem[folderPath] && fileSystem[folderPath].length > 0) {
        alert('Não é possível excluir pastas que não estão vazias.');
        closeDeleteModal();
        return;
      }
    }

    const updatedItems = items.filter((_, index) => index !== itemToDelete);
    const updatedFileSystem = { ...fileSystem, [currentPath]: updatedItems };
    // If it was a folder, remove its own path from the file system
    if (item.type === 'folder') {
      const folderPath = `${currentPath}${item.name}/`;
      delete updatedFileSystem[folderPath];
    }

    setFileSystem(updatedFileSystem);
    setItems(updatedItems);
    closeDeleteModal();
  };

  const navigateTo = (folderName) => {
    const newPath = folderName === '' ? '/' : `${currentPath}${folderName}/`;
    if (fileSystem[newPath]) {
      setCurrentPath(newPath);
      setItems(fileSystem[newPath]);
    }
  };

  const navigateBack = (pathIndex) => {
    const pathParts = currentPath.split('/').filter(p => p);
    const newPath = `/${pathParts.slice(0, pathIndex + 1).join('/')}/`;
    if (fileSystem[newPath]) {
      setCurrentPath(newPath);
      setItems(fileSystem[newPath]);
    }
  };

  const Breadcrumbs = () => {
    const pathParts = currentPath.split('/').filter(p => p);
    return (
      <div className="breadcrumbs">
        <span onClick={() => navigateTo('')}>Raiz</span>
        {pathParts.map((part, index) => (
          <React.Fragment key={index}>
            <ChevronRight size={16} />
            <span onClick={() => navigateBack(index)}>{part}</span>
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <>
      <div id="left-panel">
        <div id="search-bar"><Search size={16} /><span>Pesquisar</span></div>
        <div id="tags">
          <div className="tag-title">Tags</div>
          <div className="tag-list">
            <div className="tag" style={{ borderLeftColor: 'red' }}>Email</div>
            <div className="tag" style={{ borderLeftColor: 'blue' }}>Apps</div>
          </div>
        </div>
      </div>

      <div id="main-content">
        <Header title="Meu Cofre" onNewFolder={openNewFolderModal} onNewCredential={openNewCredentialModal} />
        <div className="file-manager">
          <Breadcrumbs />
          <div className="file-list">
            {items.map((item, index) => (
              <div key={index} className="file-item" onDoubleClick={() => item.type === 'folder' && navigateTo(item.name)}>
                <div className="file-info">
                  {item.type === 'folder' && <Folder size={20} />}
                  {item.type === 'file' && <File size={20} />}
                  {item.type === 'credential' && <Key size={20} />}
                  <div className="file-details">
                    <span className="file-name">{item.name}</span>
                    {item.type === 'credential' && item.email && <span className="file-email">{item.email}</span>}
                  </div>
                </div>
                <div className="file-actions">
                  <button onClick={(e) => { e.stopPropagation(); setActiveItemIndex(index === activeItemIndex ? null : index); }}><MoreVertical size={16} /></button>
                  {activeItemIndex === index && (
                    <ItemActionsMenu onDelete={() => openDeleteModal(index)} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal title="Nova Pasta" isOpen={isNewFolderModalOpen} onCancel={closeNewFolderModal}>
        <div className="form-group">
          <label className="form-label">Nome da Pasta</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Digite o nome da pasta"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            autoFocus
          />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={closeNewFolderModal}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={handleCreateFolder}>Criar</button>
        </div>
      </Modal>

      <Modal title="Novo Item" isOpen={isNewCredentialModalOpen} onCancel={closeNewCredentialModal}>
        <NewCredentialForm onCancel={closeNewCredentialModal} addPassword={addPassword} />
      </Modal>

      <Modal title="Confirmar Exclusão" isOpen={isDeleteModalOpen} onCancel={closeDeleteModal}>
        <p>Você tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={closeDeleteModal}>Cancelar</button>
          <button type="button" className="btn btn-danger" onClick={confirmDelete}>Excluir</button>
        </div>
      </Modal>
    </>
  );
};

export default Cofre;
