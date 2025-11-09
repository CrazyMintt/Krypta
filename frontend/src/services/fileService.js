import apiClient from "../api/client";

/**
 * Cria um novo arquivo (enviado como Base64)
 * Endpoint: POST /data/files
 *
 * @param {Object} payload
 * @param {string} payload.nome_aplicacao - Nome do arquivo/aplicação
 * @param {string} [payload.descricao] - Descrição opcional
 * @param {Object} payload.arquivo - Dados do arquivo
 * @param {string} payload.arquivo.arquivo_data - Conteúdo em Base64
 * @param {string} payload.arquivo.extensao - Extensão do arquivo (ex: .pdf, .png)
 * @param {string} payload.arquivo.nome_arquivo - Nome original do arquivo
 * @param {number} [payload.id_pasta] - ID da pasta (opcional)
 * @param {number[]} [payload.id_tags] - IDs de tags (pode ser lista vazia)
 *
 * @returns {Promise<Object>} Dados do arquivo criado
 */
export const createFile = async (payload) => {
  const { data } = await apiClient.post("/data/files", payload);
  return data;
  /* Exemplo de retorno:
  {
    id: number,
    usuario_id: number,
    nome_aplicacao: string,
    descricao: string,
    tipo: "arquivo",
    criado_em: string,
    arquivo: { id, extensao, nome_arquivo },
    senha: { id, host_url, email },
    separadores: []
  }
  */
};

/**
 * Atualiza um dado existente do tipo arquivo
 * Endpoint: PATCH /data/files/{data_id}
 *
 * @param {number} dataId - ID do arquivo/dado
 * @param {Object} payload - Mesmo formato do createFile
 *
 * @returns {Promise<Object>} Arquivo atualizado
 */
export const updateFile = async (dataId, payload) => {
  const { data } = await apiClient.patch(`/data/files/${dataId}`, payload);
  return data;
  /* Exemplo de retorno:
  {
    id: number,
    usuario_id: number,
    nome_aplicacao: string,
    descricao: string,
    tipo: "arquivo",
    criado_em: string,
    arquivo: { id, extensao, nome_arquivo },
    senha: { id, host_url, email },
    separadores: []
  }
  */
};
