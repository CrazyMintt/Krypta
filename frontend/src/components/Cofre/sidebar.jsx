import { Search, MoreVertical, Plus } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import * as tagService from "../../services/tagService";
import TagModal from "../modals/TagModal";

const Sidebar = ({ allTags, selectedTags, onToggleTag, refreshTags, onSearch }) => {
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [tagBeingEdited, setTagBeingEdited] = useState(null);
  const menuRef = useRef(null);

  const truncate = (text, limit = 20) =>
    text.length > limit ? text.slice(0, limit) + "..." : text;

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openCreateModal = () => {
    setTagBeingEdited(null);
    setIsTagModalOpen(true);
  };

  const openEditModal = (tag) => {
    setTagBeingEdited(tag); // tag: { id, name, color }
    setIsTagModalOpen(true);
    setMenuOpenId(null);
  };

  const handleSaveTag = async ({ name, color }) => {
    if (tagBeingEdited) {
      await tagService.updateTag(tagBeingEdited.id, {
        nome: name,
        cor: color,       // aqui converte para backend
      });
    } else {
      await tagService.createTag({
        nome: name,
        cor: color,
      });
    }

    setIsTagModalOpen(false);
    setTagBeingEdited(null);
    refreshTags();
  };

  const handleDeleteTag = async (tagId) => {
    await tagService.deleteTag(tagId);
    setMenuOpenId(null);
    refreshTags();
  };

  return (
    <div className="left-panel">
      <div className="search-bar">
        <Search size={16} />
        <input
          type="text"
          placeholder="Pesquisar..."
          className="search-input"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>


      <div className="tags">
        <div className="tag-title-row">
          <div className="tag-title">Tags</div>
          <button className="tag-add-btn" onClick={openCreateModal}>
            <Plus size={16} />
          </button>
        </div>

        <div className="tag-list">
          {allTags.map((tag) => (
            <div
              key={tag.id}
              className={`tag ${
                selectedTags.includes(tag.name) ? "selected" : ""
              }`}
              style={{ borderLeftColor: tag.color }}
            >
              <div
                className="tag-content"
                onClick={() => onToggleTag(tag.name)}
              >
                <span
                  className="tag-color-dot"
                  style={{ backgroundColor: tag.color }}
                ></span>

                <span className="tag-label">{truncate(tag.name)}</span>
              </div>

              <div
                className="tag-menu-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpenId(menuOpenId === tag.id ? null : tag.id);
                }}
              >
                <MoreVertical size={16} />
              </div>

              {menuOpenId === tag.id && (
                <div className="tag-menu" ref={menuRef}>
                  <button onClick={() => openEditModal(tag)}>Editar</button>
                  <button onClick={() => handleDeleteTag(tag.id)}>Remover</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <TagModal
        isOpen={isTagModalOpen}
        onCancel={() => {
          setIsTagModalOpen(false);
          setTagBeingEdited(null);
        }}
        onSave={handleSaveTag}
        initialValue={
          tagBeingEdited
            ? { name: tagBeingEdited.name, color: tagBeingEdited.color }
            : null
        }
      />
    </div>
  );
};

export default Sidebar;
