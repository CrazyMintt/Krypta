import apiClient from "../api/client";

/**
 * Busca todas as tags do usuário logado
 * Endpoint: GET /separators/tags
 *
 * @returns {Promise<Object[]>} Lista de tags
 */
export const getAllTags = async () => {
  const { data } = await apiClient.get("/separators/tags");
  return data;
  /* Exemplo retorno:
  [
    {
      id: number,
      nome: string,
      tipo: "pasta",
      cor: string,
      id_pasta_raiz: number | null
    }
  ]
  */
};

/**
 * Cria uma nova tag
 * Endpoint: POST /separators/tags
 *
 * @param {Object} payload
 * @param {string} payload.nome - Nome da tag
 * @param {string} payload.cor - Cor em formato HEX ou nome CSS
 * @returns {Promise<Object>} Tag criada
 */
export const createTag = async (payload) => {
  const { data } = await apiClient.post("/separators/tags", payload);
  return data;
  /* Exemplo retorno:
  {
    id: number,
    nome: string,
    tipo: "pasta",
    cor: string,
    id_pasta_raiz: number | null
  }
  */
};

/**
 * Atualiza uma tag existente (muda nome e/ou cor)
 * Endpoint: PATCH /separators/tags/{tag_id}
 *
 * @param {number} tagId - ID da tag
 * @param {Object} payload - Campos a atualizar { nome, cor }
 * @returns {Promise<Object>} Tag atualizada
 */
export const updateTag = async (tagId, payload) => {
  const { data } = await apiClient.patch(`/separators/tags/${tagId}`, payload);
  return data;
};

/**
 * Apaga uma tag específica
 * Endpoint: DELETE /separators/tags/{tag_id}
 *
 * @param {number} tagId - ID da tag a ser removida
 * @returns {Promise<boolean>} true se sucesso
 */
export const deleteTag = async (tagId) => {
  await apiClient.delete(`/separators/tags/${tagId}`);
  return true; // backend retorna 204 No Content
};
