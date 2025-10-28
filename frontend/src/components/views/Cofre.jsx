import React, { useState, useEffect } from 'react';
import { Folder, File, MoreVertical, ChevronRight, Search, Key } from 'lucide-react';
import Header from '../layout/Header';
import Modal from '../layout/Modal';
import ItemActionsMenu from '../layout/ItemActionsMenu';
import NewCredentialForm from '../forms/NewCredentialForm';
import RenameFolderForm from "../forms/RenameFolderForm";


const Cofre = ({ fileSystem, setFileSystem, activityLog, setActivityLog, currentPath, setCurrentPath, changeView }) => {
  const [items, setItems] = useState(fileSystem[currentPath]);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [isNewCredentialModalOpen, setIsNewCredentialModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [activeItemId, setActiveItemId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);
  const [dragOverFolderIndex, setDragOverFolderIndex] = useState(null);
  const [dragOverBreadcrumbPath, setDragOverBreadcrumbPath] = useState(null);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [isEditCredentialModalOpen, setIsEditCredentialModalOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState(null);
  const [isEditFolderModalOpen, setIsEditFolderModalOpen] = useState(false);
      const [selectedTags, setSelectedTags] = useState([]);
      const allTags = Array.from(
        Object.values(fileSystem)
          .flat()
          .filter(item => item.tags)
          .flatMap(item => item.tags)
          .reduce((map, tag) => {
            if (!map.has(tag.name)) {
              map.set(tag.name, tag);
            }
            return map;
          }, new Map()).values()
      );
        const displayedItems = selectedTags.length > 0
          ? Object.values(fileSystem).flat().filter(item => 
              item.tags && selectedTags.every(selectedTag => item.tags.some(itemTag => itemTag.name === selectedTag))
            )
          : items;
    useEffect(() => {
      setItems(fileSystem[currentPath]);
      setSelectedTags([]); // Reset tag filter on path change
    }, [currentPath, fileSystem]);
    const handleTagClick = (tag) => {
      setSelectedTags(prevTags => 
        prevTags.includes(tag) 
          ? prevTags.filter(t => t !== tag) 
          : [...prevTags, tag]
      );
    };
  useEffect(() => {
    const handleOutsideClick = () => {
      if (activeItemId !== null) {
        setActiveItemId(null);
      }
    };

    window.addEventListener('click', handleOutsideClick);
    return () => {
      window.removeEventListener('click', handleOutsideClick);
    };
  }, [activeItemId]);

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
    const newFolder = { id: Date.now(), type: 'folder', name: newFolderName.trim() };
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
    const newCredential = { id: Date.now(), type: 'credential', ...newPassword };
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

  const openDeleteModal = (item) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
    setActiveItemId(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;

    const newFileSystem = { ...fileSystem };
    let itemPath = null;
    let itemIndex = -1;

    // Find the item in the file system
    for (const path in newFileSystem) {
      const index = newFileSystem[path].findIndex(i => i.id === itemToDelete.id);
      if (index !== -1) {
        itemPath = path;
        itemIndex = index;
        break;
      }
    }

    if (itemPath !== null) {
      const item = newFileSystem[itemPath][itemIndex];

      if (item.type === 'folder') {
        const folderPath = `${itemPath}${item.name}/`;
        if (newFileSystem[folderPath] && newFileSystem[folderPath].length > 0) {
          alert('Não é possível excluir pastas que não estão vazias.');
          closeDeleteModal();
          return;
        }
        delete newFileSystem[folderPath];
      }

      const updatedItems = newFileSystem[itemPath].filter((_, index) => index !== itemIndex);
      newFileSystem[itemPath] = updatedItems;
      setFileSystem(newFileSystem);

      const newLogEntry = {
        type: 'delete',
        title: `Item "${item.name}" excluído`,
        time: new Date().toLocaleString(),
      };
      setActivityLog([newLogEntry, ...activityLog]);
    }

    closeDeleteModal();
  };

  const openEditModal = (item) => {
    setItemToEdit(item);
    setIsEditCredentialModalOpen(true);
    setActiveItemId(null);
  };

  const closeEditModal = () => {
    setItemToEdit(null);
    setIsEditCredentialModalOpen(false);
  };

  const updatePassword = (updatedItem) => {
    if (!updatedItem || updatedItem.id === undefined) return;

    const newFileSystem = { ...fileSystem };
    let itemPath = null;
    let itemIndex = -1;

    // Find the item in the file system
    for (const path in newFileSystem) {
      const index = newFileSystem[path].findIndex(i => i.id === updatedItem.id);
      if (index !== -1) {
        itemPath = path;
        itemIndex = index;
        break;
      }
    }

    if (itemPath !== null) {
      const updatedItems = [...newFileSystem[itemPath]];
      updatedItems[itemIndex] = updatedItem;
      newFileSystem[itemPath] = updatedItems;
      setFileSystem(newFileSystem);

      const logEntry = {
        type: 'edit',
        title: `Credencial "${updatedItem.name}" alterada`,
        time: new Date().toLocaleString(),
      };
      setActivityLog([logEntry, ...activityLog]);
    }

    closeEditModal();
  };

  const openEditFolderModal = (item) => {
    setFolderToEdit(item);
    setNewFolderName(item.name); // preencher input
    setIsEditFolderModalOpen(true);
    setActiveItemId(null);
  };

  const closeEditFolderModal = () => {
    setFolderToEdit(null);
    setNewFolderName('');
    setIsEditFolderModalOpen(false);
  };

  const updateFolderName = (updatedFolder) => {
    const newFileSystem = { ...fileSystem };
    let itemPath = null;
    let itemIndex = -1;

    for (const path in newFileSystem) {
      const index = newFileSystem[path].findIndex(i => i.id === updatedFolder.id);
      if (index !== -1) {
        itemPath = path;
        itemIndex = index;
        break;
      }
    }

    if (itemPath) {
      const oldFolder = newFileSystem[itemPath][itemIndex];
      const oldPath = `${itemPath}${oldFolder.name}/`;
      const newPath = `${itemPath}${updatedFolder.name}/`;

      newFileSystem[itemPath][itemIndex] = updatedFolder;

      if (newFileSystem[oldPath]) {
        newFileSystem[newPath] = newFileSystem[oldPath];
        delete newFileSystem[oldPath];

        for (const path in newFileSystem) {
          if (path.startsWith(oldPath)) {
            const newSubPath = path.replace(oldPath, newPath);
            newFileSystem[newSubPath] = newFileSystem[path];
            delete newFileSystem[path];
          }
        }
      }
      setFileSystem(newFileSystem);
      setActivityLog([
        { type: 'edit', title: `Pasta renomeada para "${updatedFolder.name}"`, time: new Date().toLocaleString() },
        ...activityLog
      ]);
    }

    closeEditFolderModal();
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
            {allTags.map(tag => (
              <div 
                key={tag.name} 
                className={`tag ${selectedTags.includes(tag.name) ? 'selected' : ''}`}
                onClick={() => handleTagClick(tag.name)} 
                style={{ borderLeftColor: tag.color }}>
                {tag.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="main-content">
        <Header 
          title={selectedTags.length > 0 ? `Itens com as tags "${selectedTags.join(', ')}"` : "Meu Cofre"} 
          onNewFolder={openNewFolderModal} 
          onNewCredential={openNewCredentialModal} 
        />
        <div className="file-manager">
          {selectedTags.length === 0 && <Breadcrumbs />}
          <div className="file-list">
            {displayedItems.map((item, index) => (
              <div 
                key={item.id} 
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
                  <button onClick={(e) => { e.stopPropagation(); setActiveItemId(item.id === activeItemId ? null : item.id); }}><MoreVertical size={16} /></button>
                  {activeItemId === item.id && (
                    <ItemActionsMenu
                      onEditCredential={() => openEditModal(item)}
                      onEditFolder={() => openEditFolderModal(item)}
                      onDelete={() => openDeleteModal(item)}
                      itemType={item.type}
                    />
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
      <NewCredentialForm onCancel={closeNewCredentialModal} addPassword={addPassword} allTags={allTags} />
    </Modal>

    <Modal title="Editar Item" isOpen={isEditCredentialModalOpen} onCancel={closeEditModal}>
      <NewCredentialForm 
        onCancel={closeEditModal}
        editItem={itemToEdit}
        updatePassword={updatePassword}
        allTags={allTags}
      />
    </Modal>

    <Modal title="Renomear Pasta" isOpen={isEditFolderModalOpen} onCancel={closeEditFolderModal}>
      <RenameFolderForm
        folder={folderToEdit}
        onCancel={closeEditFolderModal}
        updateFolderName={updateFolderName}
      />
    </Modal>

    <Modal title="Confirmar Exclusão" isOpen={isDeleteModalOpen} onCancel={closeDeleteModal}>
      <p>Você tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.</p>
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={closeDeleteModal}>Cancelar</button>
        <button type="button" className="btn btn-danger" onClick={confirmDelete}>Excluir</button>
      </div>
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
