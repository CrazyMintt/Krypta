import apiClient from "../api/client";

/**
 * Cria uma nova pasta
 * Endpoint: POST /separators/folders
 *
 * @param {Object} payload
 * @param {string} payload.nome - Nome da pasta
 * @param {number|null} [payload.id_pasta_raiz] - ID da pasta pai (null ou omitido para raiz)
 * @returns {Promise<Object>} Pasta criada
 */
export const createFolder = async (payload) => {
  const { data } = await apiClient.post("/separators/folders", payload);
  return data;
  /* Exemplo retorno:
  {
    id: number,
    nome: string,
    tipo: "pasta",
    cor: string | null,
    id_pasta_raiz: number | null
  }
  */
};

/**
 * Busca todas as pastas no nível raiz
 * Endpoint: GET /separators/folders/root
 *
 * @returns {Promise<Object[]>} Lista de pastas raiz
 */
export const getRootFolders = async () => {
  const { data } = await apiClient.get("/separators/folders/root");
  return data; // Array de pastas
};

/**
 * Busca todas as subpastas de uma pasta específica
 * Endpoint: GET /separators/folders/{folder_id}/children
 *
 * @param {number} folderId - ID da pasta pai
 * @returns {Promise<Object[]>} Lista de subpastas
 */
export const getSubfolders = async (folderId) => {
  const { data } = await apiClient.get(`/separators/folders/${folderId}/children`);
  return data; // Array de pastas
};

/**
 * Atualiza uma pasta existente
 * Endpoint: PATCH /separators/folders/{folder_id}
 *
 * @param {number} folderId - ID da pasta a ser atualizada
 * @param {Object} payload - { nome, id_pasta_raiz }
 * @returns {Promise<Object>} Pasta atualizada
 */
export const updateFolder = async (folderId, payload) => {
  const { data } = await apiClient.patch(`/separators/folders/${folderId}`, payload);
  return data;
};

/**
 * Apaga uma pasta e todo seu conteúdo recursivamente
 * Endpoint: DELETE /separators/folders/{folder_id}
 *
 * @param {number} folderId - ID da pasta a ser removida
 * @returns {Promise<boolean>} true se sucesso
 */
export const deleteFolder = async (folderId) => {
  await apiClient.delete(`/separators/folders/${folderId}`);
  return true;
};
