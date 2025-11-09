import apiClient from "../api/client";

/**
 * Busca um dado específico (arquivo ou credencial)
 * Endpoint: GET /data/{data_id}
 *
 * @param {number} dataId - ID do dado
 * @returns {Promise<Object>} Dado retornado
 */
export const getDataById = async (dataId) => {
  const { data } = await apiClient.get(`/data/${dataId}`);
  return data;
  /* Exemplo retorno:
  {
    id: number,
    usuario_id: number,
    nome_aplicacao: string,
    descricao: string,
    tipo: "arquivo" | "senha",
    criado_em: string,
    arquivo: { id, extensao, nome_arquivo },
    senha: { id, host_url, email },
    separadores: []
  }
  */
};

/**
 * Apaga um dado específico (arquivo ou credencial)
 * Endpoint: DELETE /data/{data_id}
 *
 * @param {number} dataId - ID do dado a ser removido
 * @returns {Promise<boolean>} true se sucesso
 */
export const deleteData = async (dataId) => {
  await apiClient.delete(`/data/${dataId}`);
  return true; // backend retorna 204 No Content
};

/**
 * Busca paginada de dados (com filtro de separadores)
 * Endpoint: POST /data/search
 *
 * @param {Object} filters
 * @param {number} filters.page_size - Quantidade por página
 * @param {number} filters.page_number - Página atual
 * @param {number[]} [filters.id_separadores] - Lista de IDs de separadores (pode ser vazia)
 * @returns {Promise<Object[]>} Lista de dados encontrados
 */
export const searchData = async (filters) => {
  const { data } = await apiClient.post("/data/search", filters);
  return data;
  /* Exemplo retorno:
  [
    {
      id: number,
      usuario_id: number,
      nome_aplicacao: string,
      descricao: string,
      tipo: "arquivo" | "senha",
      criado_em: string,
      arquivo: { id, extensao, nome_arquivo },
      senha: { id, host_url, email },
      separadores: []
    }
  ]
  */
};
