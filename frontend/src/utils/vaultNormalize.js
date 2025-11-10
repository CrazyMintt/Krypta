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
