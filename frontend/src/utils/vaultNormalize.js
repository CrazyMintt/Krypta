export const pickArray = (page) => {
  if (Array.isArray(page?.results)) return page.results;
  if (Array.isArray(page?.items)) return page.items;
  if (Array.isArray(page)) return page;
  return [];
};

export const dedupeById = (arr) => {
  const map = new Map();
  for (const it of arr) if (!map.has(it.id)) map.set(it.id, it);
  return Array.from(map.values());
};

export const onlyRootItems = (arr) =>
  arr.filter((d) => {
    const seps = Array.isArray(d.separadores) ? d.separadores : [];
    return !seps.some((s) => s.tipo === "pasta");
  });

export const normalizeFolders = (folders) =>
  (folders || []).map((f) => ({
    id: f.id,
    type: "folder",
    name: f.nome,
    email: null,
    tags: [],
    raw: f,
  }));

export const normalizeCredentials = (credentials) =>
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

  export const normalizeFiles = (files) =>
  (files || []).map((f) => {
    const tags =
      (f.separadores || [])
        .filter((s) => s.tipo === "tag")
        .map((s) => ({ id: s.id, name: s.nome, color: s.cor })) || [];

    const folderSep = (f.separadores || []).find((s) => s.tipo === "pasta");

    return {
      id: f.id,
      type: "file",
      name: f.nome_aplicacao ?? f.arquivo?.nome_arquivo ?? "arquivo",

      // informações do arquivo
      fileName: f.arquivo?.nome_arquivo ?? "",
      fileExtension: f.arquivo?.extensao ?? "",
      fileCipher: f.arquivo?.arquivo_data ?? "",
      fileIv: f.arquivo?.iv_arquivo ?? "",

      // pasta
      folderId: folderSep?.id_pasta_raiz ?? null,

      tags,
      raw: f,
    };
  });
