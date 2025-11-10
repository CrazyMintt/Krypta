import { Folder, Key, MoreVertical } from "lucide-react";
import ItemActionsMenu from "../layout/ItemActionsMenu";

const FileList = ({
  loading,
  items,
  selectedItems = items, // normalmente você já filtra antes
  activeItemId,
  setActiveItemId,
  onOpenFolder,
  onOpenCredential,
  onActions: { onView, onEditCredential, onEditFolder, onDelete, onShare },
}) => {
  if (loading) {
    return (
      <div className="file-list">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="file-list">
      {selectedItems.map((item) => (
        <div
          key={`${item.type}-${item.id}`}
          className="file-item"
          onClick={() => {
            if (item.type === "folder") onOpenFolder(item);
            if (item.type === "credential") onOpenCredential(item);
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
                onViewCredential={() => onView(item)}
                onEditCredential={() => onEditCredential(item)}
                onEditFolder={() => onEditFolder(item)}
                onDelete={() => onDelete(item)}
                onShare={() => onShare(item)}
                itemType={item.type}
              />
            )}
          </div>
        </div>
      ))}
      {selectedItems.length === 0 && <p>Nenhum item.</p>}
    </div>
  );
};

export default FileList;
