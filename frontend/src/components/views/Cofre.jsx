import React, { useEffect, useState, useCallback } from "react";
import { Folder, MoreVertical, Search, Key, ChevronRight } from "lucide-react";
import Header from "../layout/Header";
import Modal from "../layout/Modal";
import ItemActionsMenu from "../layout/ItemActionsMenu";
import NewCredentialForm from "../forms/NewCredentialForm";
import RenameFolderForm from "../forms/RenameFolderForm";
import ReadCredentialModal from "../views/ReadCredentialModal";
import ShareItemModal from "../modals/ShareItemModal";
import "../../styles/share-modal.css";

import * as folderService from "../../services/folderService";
import * as tagService from "../../services/tagService";
import * as dataService from "../../services/dataService";

const Cofre = ({
  activityLog,
  setActivityLog,
  openNewFolderModal,
  openNewCredentialModal,
  onLogout,
  onFolderChange,
  refreshKey,
}) => {
  const [currentFolder, setCurrentFolder] = useState(null); // { id, nome } | null
  const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, nome: "Raiz" }]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

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

  const normalizeFolders = (folders) =>
    (folders || []).map((f) => ({
      id: f.id,
      type: "folder",
      name: f.nome,
      email: null,
      tags: [],
      raw: f,
    }));

  const normalizeCredentials = (credentials) =>
    (credentials || []).map((c) => {
      const tags =
        (c.separadores || [])
          .filter((s) => s.tipo === "tag")
          .map((s) => ({ id: s.id, name: s.nome, color: s.cor })) || [];
      return {
        id: c.id,
        type: "credential",
        name: c.nome_aplicacao ?? "",
        email: c.senha?.email ?? "",
        tags,
        raw: c,
      };
    });

  const loadLevel = useCallback(async (folderObjOrNull) => {
    setLoading(true);
    try {
      const folders = !folderObjOrNull
        ? await folderService.getRootFolders()
        : await folderService.getSubfolders(folderObjOrNull.id);

      const searchFilters = {
        page_size: 100,
        page_number: 1,
        ...(folderObjOrNull ? { id_separadores: [folderObjOrNull.id] } : {}),
        // OBS: se quiser listar SOMENTE itens “na raiz” (sem pasta),
        // confirme com o backend qual filtro usar (ex.: id_pasta: null).
      };

      const dataPage = await dataService.searchData(searchFilters);
      const dataList = Array.isArray(dataPage?.results)
        ? dataPage.results
        : Array.isArray(dataPage?.items)
        ? dataPage.items
        : Array.isArray(dataPage)
        ? dataPage
        : [];

      const credentials = dataList.filter((d) => d.tipo === "senha");

      setItems([...normalizeFolders(folders), ...normalizeCredentials(credentials)]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carrega quando muda de pasta ou quando alguém sinaliza refresh pelo MainApp
  useEffect(() => {
    loadLevel(currentFolder);
  }, [currentFolder, refreshKey, loadLevel]);

  // Informa pasta atual ao MainApp
  useEffect(() => {
    onFolderChange?.(currentFolder?.id ?? null);
  }, [currentFolder, onFolderChange]);

  useEffect(() => {
    const handleOutsideClick = () => {
      if (activeItemId !== null) setActiveItemId(null);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, [activeItemId]);

  const handleTagClick = (tagName) => {
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

  // Navegação: apenas atualiza estado; o efeito recarrega
  const navigateToFolder = (folderItemOrNull) => {
    const next = folderItemOrNull ? { id: folderItemOrNull.id, nome: folderItemOrNull.name } : null;
    setCurrentFolder(next);
    setSelectedTags([]);
    setBreadcrumbs((prev) => {
      if (!next) return [{ id: null, nome: "Raiz" }];
      const idx = prev.findIndex((b) => b.id === next.id);
      if (idx >= 0) return prev.slice(0, idx + 1);
      return [...prev, next];
    });
  };

  const navigateToBreadcrumb = (bc) => {
    navigateToFolder(bc.id === null ? null : { id: bc.id, name: bc.nome });
  };

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
      <div className="left-panel">
        <div className="search-bar">
          <Search size={16} />
          <span>Pesquisar</span>
        </div>

        <div className="tags">
          <div className="tag-title">Tags</div>
          <div className="tag-list">
            {allTags.map((tag) => (
              <div
                key={tag.id}
                className={`tag ${selectedTags.includes(tag.name) ? "selected" : ""}`}
                onClick={() => handleTagClick(tag.name)}
                style={{ borderLeftColor: tag.color }}
              >
                {tag.name}
              </div>
            ))}
          </div>
        </div>
      </div>

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

        <div className="breadcrumbs">
          {breadcrumbs.map((bc, i) => (
            <span
              key={`${bc.id ?? "root"}-${i}`}
              onClick={() => navigateToBreadcrumb(bc)}
              style={{ cursor: "pointer" }}
            >
              {i > 0 && <ChevronRight size={16} />}
              {bc.nome}
            </span>
          ))}
        </div>

        <div className="file-manager">
          {loading ? (
            <div className="file-list">
              <p>Carregando...</p>
            </div>
          ) : (
            <div className="file-list">
              {displayedItems.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="file-item"
                  onClick={() => {
                    if (item.type === "folder") navigateToFolder(item);
                    if (item.type === "credential") openReadCredentialModal(item);
                  }}
                >
                  <div className="file-info">
                    {item.type === "folder" && <Folder size={20} />}
                    {item.type === "credential" && <Key size={20} />}
                    <div className="file-details">
                      <span className="file-name">{item.name}</span>
                      {item.type === "credential" && item.email && (
                        <span className="file-email">{item.email}</span>
                      )}
                    </div>
                  </div>

                  <div className="file-actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveItemId(item.id === activeItemId ? null : item.id);
                      }}
                    >
                      <MoreVertical size={16} />
                    </button>
                    {activeItemId === item.id && (
                      <ItemActionsMenu
                        onViewCredential={() => openReadCredentialModal(item)}
                        onEditCredential={() => openEditModal(item)}
                        onEditFolder={() => openEditFolderModal(item)}
                        onDelete={() => openDeleteModal(item)}
                        onShare={() => openShareModal(item)}
                        itemType={item.type}
                      />
                    )}
                  </div>
                </div>
              ))}
              {displayedItems.length === 0 && <p>Nenhum item.</p>}
            </div>
          )}
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
