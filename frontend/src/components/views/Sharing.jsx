import React, { useState } from "react";
import Header from "../layout/Header";
import { MoreVertical } from "lucide-react";
import "../../styles/sharing.css";
import { useSharedItems } from "../../context/SharedItemsContext";
import DeleteConfirmationModal from "../modals/DeleteConfirmationModal";

const Sharing = () => {
  const {
    sharedItems,
    removeSharedItem,
    activityLog,
    setActivityLog,
    loading,
  } = useSharedItems();

  const [activeItemId, setActiveItemId] = useState(null);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const handleActionClick = (e, itemId) => {
    e.stopPropagation();
    setActiveItemId(itemId === activeItemId ? null : itemId);
  };

  const openDeleteConfirmation = (item) => {
    setItemToDelete(item);
    setIsDeleteConfirmationOpen(true);
  };

  const closeDeleteConfirmation = () => {
    setItemToDelete(null);
    setIsDeleteConfirmationOpen(false);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      await removeSharedItem(itemToDelete.id);

      const newLogEntry = {
        type: "remove",
        title: `Compartilhamento do item "${itemToDelete.name}" removido`,
        time: new Date().toLocaleString(),
      };
      setActivityLog([newLogEntry, ...activityLog]);
    } catch (err) {
      console.error("Erro ao remover compartilhamento:", err);
      alert("Não foi possível remover o compartilhamento.");
    } finally {
      closeDeleteConfirmation();
    }
  };

  return (
    <div className="main-content">
      <Header title="Compartilhamentos Ativos" />

      {loading ? (
        <p className="loading-text">Carregando compartilhamentos...</p>
      ) : sharedItems.length === 0 ? (
        <p className="empty-text">Nenhum compartilhamento ativo encontrado.</p>
      ) : (
        <div className="sharing-list">
          {sharedItems.map((share) => (
            <div key={share.id} className="share-item">
              <div className="share-info">
                <span className="share-name">{share.name}</span>
                <span className="share-details">
                  Acessos restantes: {share.accessesLeft} | Expira em: {share.expiresIn}
                </span>
              </div>
              <div className="share-actions">
                <button onClick={(e) => handleActionClick(e, share.id)}>
                  <MoreVertical size={16} />
                </button>
                {activeItemId === share.id && (
                  <div className="item-actions-menu">
                    <div
                      className="menu-item"
                      onClick={() => openDeleteConfirmation(share)}
                    >
                      Remover
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={isDeleteConfirmationOpen}
        onCancel={closeDeleteConfirmation}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default Sharing;
