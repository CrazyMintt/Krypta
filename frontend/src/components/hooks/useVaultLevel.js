import { useCallback, useEffect, useState } from "react";
import * as folderService from "../../services/folderService";
import * as dataService from "../../services/dataService";
import {
  pickArray,
  dedupeById,
  onlyRootItems,
  normalizeFolders,
  normalizeCredentials,
  normalizeFiles,
} from "../../utils/vaultNormalize";

export default function useVaultLevel(refreshKey, onFolderChange) {
  const [currentFolder, setCurrentFolder] = useState(null);
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

      // Dados (credenciais + arquivos)
      const searchFilters = {
        page_size: 100,
        page_number: 1,
        ...(folderObjOrNull ? { id_separadores: [folderObjOrNull.id] } : {}),
      };

      const dataPage = await dataService.searchData(searchFilters);
      let rawData = pickArray(dataPage);

      // Se estamos na raiz, remover itens que pertencem a alguma pasta
      if (!folderObjOrNull) rawData = onlyRootItems(rawData);

      rawData = dedupeById(rawData);

      // Separar por tipos
      const credentials = rawData.filter((d) => d.tipo === "senha");
      const files = rawData.filter((d) => d.tipo === "arquivo");

      setItems([
        ...normalizeFolders(folders),
        ...normalizeCredentials(credentials),
        ...normalizeFiles(files),
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Recarregar ao mudar pasta ou disparar refreshKey
  useEffect(() => {
    loadLevel(currentFolder);
  }, [currentFolder, refreshKey, loadLevel]);

  // Notificar o pai
  useEffect(() => {
    onFolderChange?.(currentFolder?.id ?? null);
  }, [currentFolder, onFolderChange]);

  const navigateToFolder = (folderItemOrNull) => {
    const next = folderItemOrNull
      ? { id: folderItemOrNull.id, nome: folderItemOrNull.name }
      : null;

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
