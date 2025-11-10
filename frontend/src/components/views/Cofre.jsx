import React, { useEffect, useState } from "react";
import Header from "../layout/Header";
import Modal from "../layout/Modal";
import NewCredentialForm from "../forms/NewCredentialForm";
import RenameFolderForm from "../forms/RenameFolderForm";
import ReadCredentialModal from "../views/ReadCredentialModal";
import ShareItemModal from "../modals/ShareItemModal";
import Sidebar from "../Cofre/sidebar";
import Breadcrumbs from "../Cofre/BreadCrumbs";
import FileList from "../Cofre/FileList";
import "../../styles/share-modal.css";

import * as tagService from "../../services/tagService";
import * as folderService from "../../services/folderService";
import * as dataService from "../../services/dataService";
import useVaultLevel from "../hooks/useVaultLevel";

const Cofre = ({
  activityLog,
  setActivityLog,
  openNewFolderModal,
  openNewCredentialModal,
  onLogout,
  onFolderChange,
  refreshKey,
}) => {

  const {
    currentFolder,
    breadcrumbs,
    items,
    loading,
    loadLevel,
    navigateToFolder,
    navigateToBreadcrumb,
  } = useVaultLevel(refreshKey, onFolderChange);

  // Tags
  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

  // Menus/Modais
  const [activeItemId, setActiveItemId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [isEditCredentialModalOpen, setIsEditCredentialModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);

  const [isEditFolderModalOpen, setIsEditFolderModalOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState(null);

  const [isReadCredentialModalOpen, setIsReadCredentialModalOpen] = useState(false);
  const [credentialToRead, setCredentialToRead] = useState(null);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [itemToShare, setItemToShare] = useState(null);

  // Carrega tags
  useEffect(() => {
    (async () => {
      try {
        const data = await tagService.getAllTags();
        setAllTags((data || []).map((t) => ({ id: t.id, name: t.nome, color: t.cor })));
      } catch {
        setAllTags([]);
      }
    })();
  }, []);

  // Fecha menu ao clicar fora
  useEffect(() => {
    const handleOutsideClick = () => {
      if (activeItemId !== null) setActiveItemId(null);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, [activeItemId]);

  // Filtro por tags (feito aqui, lista já chega normalizada pelo hook)
  const handleToggleTag = (tagName) => {
    setSelectedTags((prev) =>
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]
    );
  };
  const displayedItems =
    selectedTags.length > 0
      ? items.filter(
          (item) =>
            item.tags &&
            selectedTags.every((selected) => item.tags.some((t) => t.name === selected))
        )
      : items;

  // Ações / Modais
  const openReadCredentialModal = async (credentialItem) => {
    try {
      const full = await dataService.getDataById(credentialItem.id);
      const tags =
        (full.separadores || [])
          .filter((s) => s.tipo === "tag")
          .map((s) => ({ name: s.nome, color: s.cor })) || [];
      setCredentialToRead({
        name: full.nome_aplicacao || credentialItem.name,
        email: full.senha?.email || credentialItem.email || "",
        password: full.senha?.senha_cripto || "",
        url: full.senha?.host_url || "",
        tags,
      });
    } catch {
      setCredentialToRead({
        name: credentialItem.name,
        email: credentialItem.email || "",
        password: "",
        url: "",
        tags: credentialItem.tags || [],
      });
    }
    setIsReadCredentialModalOpen(true);
    setActiveItemId(null);
  };
  const closeReadCredentialModal = () => {
    setCredentialToRead(null);
    setIsReadCredentialModalOpen(false);
  };

  const openShareModal = (item) => {
    setItemToShare(item);
    setIsShareModalOpen(true);
    setActiveItemId(null);
  };
  const closeShareModal = () => {
    setItemToShare(null);
    setIsShareModalOpen(false);
  };

  const openDeleteModal = (item) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
    setActiveItemId(null);
  };
  const closeDeleteModal = () => {
    setItemToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete.type === "folder") {
        await folderService.deleteFolder(itemToDelete.id);
      } else if (itemToDelete.type === "credential") {
        await dataService.deleteData(itemToDelete.id);
      }
      await loadLevel(currentFolder);
    } finally {
      closeDeleteModal();
    }
  };

  const openEditModal = (item) => {
    setItemToEdit(item.raw || null);
    setIsEditCredentialModalOpen(true);
    setActiveItemId(null);
  };
  const closeEditModal = () => {
    setItemToEdit(null);
    setIsEditCredentialModalOpen(false);
  };

  const openEditFolderModal = (item) => {
    setFolderToEdit({ id: item.id, nome: item.name });
    setIsEditFolderModalOpen(true);
    setActiveItemId(null);
  };
  const closeEditFolderModal = () => {
    setFolderToEdit(null);
    setIsEditFolderModalOpen(false);
  };

  const handleCredentialSaved = async () => {
    await loadLevel(currentFolder);
    closeEditModal();
  };

  const updateFolderName = async ({ id, name }) => {
    await folderService.updateFolder(id, { nome: name });
    await loadLevel(currentFolder);
    closeEditFolderModal();
  };

  return (
    <>
      <Sidebar
        allTags={allTags}
        selectedTags={selectedTags}
        onToggleTag={handleToggleTag}
      />

      <div className="main-content">
        <Header
          title={
            selectedTags.length > 0
              ? `Itens com as tags "${selectedTags.join(", ")}"`
              : "Meu Cofre"
          }
          onNewFolder={() => openNewFolderModal(currentFolder?.id ?? null)}
          onNewCredential={() => openNewCredentialModal(currentFolder?.id ?? null)}
          onLogout={onLogout}
        />

        <Breadcrumbs breadcrumbs={breadcrumbs} onClick={navigateToBreadcrumb} />

        <div className="file-manager">
          <FileList
            loading={loading}
            items={items}
            selectedItems={displayedItems}
            activeItemId={activeItemId}
            setActiveItemId={setActiveItemId}
            onOpenFolder={navigateToFolder}
            onOpenCredential={openReadCredentialModal}
            onActions={{
              onView: openReadCredentialModal,
              onEditCredential: openEditModal,
              onEditFolder: openEditFolderModal,
              onDelete: openDeleteModal,
              onShare: openShareModal,
            }}
          />
        </div>
      </div>

      <Modal title="Editar Credencial" isOpen={isEditCredentialModalOpen} onCancel={closeEditModal}>
        <NewCredentialForm
          onCancel={closeEditModal}
          editItem={itemToEdit}
          initialTags={allTags.map((t) => ({ id: t.id, nome: t.name, cor: t.color }))}
          onSuccess={handleCredentialSaved}
          currentFolderId={currentFolder?.id ?? null}
        />
      </Modal>

      <Modal title="Renomear Pasta" isOpen={isEditFolderModalOpen} onCancel={closeEditFolderModal}>
        <RenameFolderForm
          folder={folderToEdit ? { id: folderToEdit.id, name: folderToEdit.nome } : null}
          onCancel={closeEditFolderModal}
          updateFolderName={updateFolderName}
        />
      </Modal>

      <Modal title="Confirmar Exclusão" isOpen={isDeleteModalOpen} onCancel={closeDeleteModal}>
        <p>Você tem certeza que deseja excluir este item?</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={closeDeleteModal}>
            Cancelar
          </button>
          <button type="button" className="btn btn-danger" onClick={confirmDelete}>
            Excluir
          </button>
        </div>
      </Modal>

      <Modal title="Visualizar Item" isOpen={isReadCredentialModalOpen} onCancel={closeReadCredentialModal}>
        <ReadCredentialModal credential={credentialToRead} />
      </Modal>

      <Modal title="Compartilhar Item" isOpen={isShareModalOpen} onCancel={closeShareModal}>
        <ShareItemModal item={itemToShare} onCancel={closeShareModal} />
      </Modal>
    </>
  );
};

export default Cofre;
