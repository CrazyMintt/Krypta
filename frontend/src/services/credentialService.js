import apiClient from "../api/client";

/**
 * Cria uma nova credencial para o usuário logado
 * Endpoint: POST /data/credentials
 *
 * @param {Object} payload
 * @param {string} payload.nome_aplicacao - Nome da aplicação
 * @param {string} [payload.descricao] - Descrição opcional
 * @param {Object} payload.senha - Dados da senha
 * @param {string} payload.senha.senha_cripto - Senha criptografada
 * @param {string} payload.senha.email - E-mail associado
 * @param {string} payload.senha.host_url - URL ou host
 * @param {number} [payload.id_pasta] - ID da pasta (opcional)
 * @param {number[]} [payload.id_tags] - Lista de IDs de tags (pode ser vazia)
 *
 * @returns {Promise<Object>} Objeto da credencial criada
 */
export const createCredential = async (payload) => {
  const { data } = await apiClient.post("/data/credentials", payload);
  return data;
  /* Exemplo de retorno:
  {
    id: number,
    usuario_id: number,
    nome_aplicacao: string,
    descricao: string,
    tipo: "arquivo" | "senha",
    criado_em: string,
    arquivo: { id, extensao, nome_arquivo },
    senha: { id, host_url, email, senha_cripto, iv_senha_cripto },
    separadores: []
  }
  */
};

/**
 * Atualiza uma credencial existente do tipo senha
 * Endpoint: PATCH /data/credentials/{data_id}
 *
 * @param {number} dataId - ID da credencial
 * @param {Object} payload - Mesmo formato do createCredential
 *
 * @returns {Promise<Object>} Credencial atualizada
 */
export const updateCredential = async (dataId, payload) => {
  const { data } = await apiClient.patch(`/data/credentials/${dataId}`, payload);
  return data;
  /* Exemplo de retorno:
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
