import { ChevronRight } from "lucide-react";

const Breadcrumbs = ({ breadcrumbs, onClick }) => (
  <div className="breadcrumbs">
    {breadcrumbs.map((bc, i) => (
      <span
        key={`${bc.id ?? "root"}-${i}`}
        onClick={() => onClick(bc)}
        style={{ cursor: "pointer" }}
      >
        {i > 0 && <ChevronRight size={16} />}
        {bc.nome}
      </span>
    ))}
  </div>
);

export default Breadcrumbs;
