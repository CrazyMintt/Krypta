import React, { useState, useEffect } from 'react';
import { Folder, File, MoreVertical, ChevronRight, Search, Key } from 'lucide-react';
import Header from '../layout/Header';
import Modal from '../layout/Modal';
import ItemActionsMenu from '../layout/ItemActionsMenu';
import NewCredentialForm from '../forms/NewCredentialForm';

const Cofre = ({ fileSystem, setFileSystem, activityLog, setActivityLog, currentPath, setCurrentPath }) => {
  const [items, setItems] = useState(fileSystem[currentPath]);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [isNewCredentialModalOpen, setIsNewCredentialModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [activeItemIndex, setActiveItemIndex] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);
  const [dragOverFolderIndex, setDragOverFolderIndex] = useState(null);
  const [dragOverBreadcrumbPath, setDragOverBreadcrumbPath] = useState(null);

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

  const handleDragStart = (e, index) => {
    setDraggedItemIndex(index);
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (items[index].type === 'folder') {
      setDragOverFolderIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverFolderIndex(null);
  };

  const handleDrop = (e, targetFolderIndex) => {
    e.preventDefault();
    setDragOverFolderIndex(null);

    const sourceItemIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (isNaN(sourceItemIndex) || sourceItemIndex === targetFolderIndex) return;

    const sourceItem = items[sourceItemIndex];
    const targetFolder = items[targetFolderIndex];

    if (targetFolder.type !== 'folder') {
      return; // Cannot drop on a file or credential
    }

    let updatedFileSystem = { ...fileSystem };

    // 1. Remove from source
    const sourcePath = currentPath;
    const updatedSourceItems = items.filter((_, index) => index != sourceItemIndex);
    updatedFileSystem[sourcePath] = updatedSourceItems;

    // 2. Add to destination
    const targetPath = `${currentPath}${targetFolder.name}/`;
    const updatedTargetItems = [...updatedFileSystem[targetPath], sourceItem];
    updatedFileSystem[targetPath] = updatedTargetItems;

    // 3. If a folder was moved, recursively update all its children paths
    if (sourceItem.type === 'folder') {
      const oldFolderPath = `${currentPath}${sourceItem.name}/`;
      const newFolderPath = `${targetPath}${sourceItem.name}/`;

      const pathsToUpdate = Object.keys(updatedFileSystem).filter(path => path.startsWith(oldFolderPath));

      for (const oldPath of pathsToUpdate) {
        const newPath = oldPath.replace(oldFolderPath, newFolderPath);
        updatedFileSystem[newPath] = updatedFileSystem[oldPath];
        delete updatedFileSystem[oldPath];
      }
    }

    setFileSystem(updatedFileSystem);

    const newLogEntry = {
      type: 'edit', // Using 'edit' for a move action
      title: `"${sourceItem.name}" movido para "${targetFolder.name}"`,
      time: new Date().toLocaleString(),
    };
    setActivityLog([newLogEntry, ...activityLog]);
  };

  const handleBreadcrumbDragOver = (e, path) => {
    e.preventDefault();
    setDragOverBreadcrumbPath(path);
  };

  const handleBreadcrumbDragLeave = () => {
    setDragOverBreadcrumbPath(null);
  };

  const handleBreadcrumbDrop = (e, targetPath) => {
    e.preventDefault();
    setDragOverBreadcrumbPath(null);

    if (targetPath === currentPath) return; // Cannot drop in the same folder

    const sourceItemIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (isNaN(sourceItemIndex)) return;

    const sourceItem = items[sourceItemIndex];
    let updatedFileSystem = { ...fileSystem };

    // 1. Remove from source
    const sourcePath = currentPath;
    const updatedSourceItems = items.filter((_, index) => index != sourceItemIndex);
    updatedFileSystem[sourcePath] = updatedSourceItems;

    // 2. Add to destination
    const updatedTargetItems = [...updatedFileSystem[targetPath], sourceItem];
    updatedFileSystem[targetPath] = updatedTargetItems;

    // 3. If a folder was moved, recursively update all its children paths
    if (sourceItem.type === 'folder') {
      const oldFolderPath = `${currentPath}${sourceItem.name}/`;
      const newFolderPath = `${targetPath}${sourceItem.name}/`;

      const pathsToUpdate = Object.keys(updatedFileSystem).filter(path => path.startsWith(oldFolderPath));

      for (const oldPath of pathsToUpdate) {
        const newPath = oldPath.replace(oldFolderPath, newFolderPath);
        updatedFileSystem[newPath] = updatedFileSystem[oldPath];
        delete updatedFileSystem[oldPath];
      }
    }

    setFileSystem(updatedFileSystem);

    const targetFolderName = targetPath === '/' ? 'Raiz' : targetPath.split('/').filter(p => p).pop();
    const newLogEntry = {
      type: 'edit', // Using 'edit' for a move action
      title: `"${sourceItem.name}" movido para "${targetFolderName}"`,
      time: new Date().toLocaleString(),
    };
    setActivityLog([newLogEntry, ...activityLog]);
  };

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

    const newLogEntry = {
      type: 'add',
      title: `Pasta "${newFolderName.trim()}" criada`,
      time: new Date().toLocaleString(),
    };
    setActivityLog([newLogEntry, ...activityLog]);

    closeNewFolderModal();
  };

  const addPassword = (newPassword) => {
    const newCredential = { type: 'credential', name: newPassword.name, email: newPassword.email };
    const updatedFileSystem = { ...fileSystem, [currentPath]: [...fileSystem[currentPath], newCredential] };
    setFileSystem(updatedFileSystem);

    const newLogEntry = {
      type: 'add',
      title: `Credencial "${newPassword.name}" criada`,
      time: new Date().toLocaleString(),
    };
    setActivityLog([newLogEntry, ...activityLog]);

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

    const newLogEntry = {
      type: 'delete', // Or a more specific type
      title: `Item "${item.name}" excluído`,
      time: new Date().toLocaleString(),
    };
    setActivityLog([newLogEntry, ...activityLog]);

    closeDeleteModal();
  };

  const navigateTo = (folderName) => {
    const newPath = folderName === '' ? '/' : `${currentPath}${folderName}/`;
    if (fileSystem[newPath]) {
      setCurrentPath(newPath);
    }
  };

  const navigateBack = (pathIndex) => {
    const pathParts = currentPath.split('/').filter(p => p);
    const newPath = `/${pathParts.slice(0, pathIndex + 1).join('/')}/`;
    if (fileSystem[newPath]) {
      setCurrentPath(newPath);
    }
  };

  const Breadcrumbs = () => {
    const pathParts = currentPath.split('/').filter(p => p);
    return (
      <div className="breadcrumbs">
        <span 
          onClick={() => navigateTo('')} 
          className={dragOverBreadcrumbPath === '/' ? 'drag-over' : ''}
          onDragOver={(e) => handleBreadcrumbDragOver(e, '/')}
          onDragLeave={handleBreadcrumbDragLeave}
          onDrop={(e) => handleBreadcrumbDrop(e, '/')}
        >
          Raiz
        </span>
        {pathParts.map((part, index) => {
          const path = `/${pathParts.slice(0, index + 1).join('/')}/`;
          return (
            <React.Fragment key={index}>
              <ChevronRight size={16} />
              <span 
                onClick={() => navigateBack(index)}
                className={dragOverBreadcrumbPath === path ? 'drag-over' : ''}
                onDragOver={(e) => handleBreadcrumbDragOver(e, path)}
                onDragLeave={handleBreadcrumbDragLeave}
                onDrop={(e) => handleBreadcrumbDrop(e, path)}
              >
                {part}
              </span>
            </React.Fragment>
          )
        })}
      </div>
    );
  };

  return (
    <>
      <div className="left-panel">
        <div className="search-bar"><Search size={16} /><span>Pesquisar</span></div>
        <div className="tags">
          <div className="tag-title">Tags</div>
          <div className="tag-list">
            <div className="tag" style={{ borderLeftColor: 'red' }}>Email</div>
            <div className="tag" style={{ borderLeftColor: 'blue' }}>Apps</div>
          </div>
        </div>
      </div>

      <div className="main-content">
        <Header title="Meu Cofre" onNewFolder={openNewFolderModal} onNewCredential={openNewCredentialModal} />
        <div className="file-manager">
          <Breadcrumbs />
          <div className="file-list">
            {items.map((item, index) => (
              <div 
                key={index} 
                className={`file-item ${dragOverFolderIndex === index ? 'drag-over' : ''}`}
                draggable="true"
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDoubleClick={() => item.type === 'folder' && navigateTo(item.name)}>
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
