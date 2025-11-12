import { Search } from "lucide-react";

const Sidebar = ({ allTags, selectedTags, onToggleTag }) => {
  return (
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
              onClick={() => onToggleTag(tag.name)}
              style={{ borderLeftColor: tag.color }}
            >
              {tag.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
