import { useCallback, useEffect, useState } from "react";
import * as folderService from "../../services/folderService";
import * as dataService from "../../services/dataService";
import {
  pickArray,
  dedupeById,
  onlyRootItems,
  normalizeFolders,
  normalizeCredentials,
} from "../../utils/vaultNormalize";

export default function useVaultLevel(refreshKey, onFolderChange) {
  const [currentFolder, setCurrentFolder] = useState(null); // { id, nome } | null
  const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, nome: "Raiz" }]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadLevel = useCallback(async (folderObjOrNull) => {
    setLoading(true);
    try {
      // Pastas
      const folders = !folderObjOrNull
        ? await folderService.getRootFolders()
        : await folderService.getSubfolders(folderObjOrNull.id);

      // Dados/credenciais
      const searchFilters = {
        page_size: 100,
        page_number: 1,
        ...(folderObjOrNull ? { id_separadores: [folderObjOrNull.id] } : {}),
      };

      const dataPage = await dataService.searchData(searchFilters);
      let dataList = pickArray(dataPage).filter((d) => d.tipo === "senha");
      if (!folderObjOrNull) dataList = onlyRootItems(dataList);
      dataList = dedupeById(dataList);

      setItems([...normalizeFolders(folders), ...normalizeCredentials(dataList)]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carrega quando muda pasta ou refreshKey
  useEffect(() => {
    loadLevel(currentFolder);
  }, [currentFolder, refreshKey, loadLevel]);

  // Notifica pai
  useEffect(() => {
    onFolderChange?.(currentFolder?.id ?? null);
  }, [currentFolder, onFolderChange]);

  const navigateToFolder = (folderItemOrNull) => {
    const next = folderItemOrNull ? { id: folderItemOrNull.id, nome: folderItemOrNull.name } : null;
    setCurrentFolder(next);
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

  return {
    currentFolder,
    breadcrumbs,
    items,
    loading,
    loadLevel,
    navigateToFolder,
    navigateToBreadcrumb,
    setCurrentFolder,
    setBreadcrumbs,
  };
}
