import apiClient from "../api/client";

/**
 * Busca todos os compartilhamentos do usuário logado
 * Endpoint: GET /shares/
 *
 * @returns {Promise<Object[]>} Lista de compartilhamentos
 */
export const getMyShares = async () => {
  const { data } = await apiClient.get("/shares/");
  return data;
  /* Exemplo retorno:
  [
    {
      id: number,
      token_acesso: string,
      n_acessos_total: number,
      n_acessos_atual: number,
      data_expiracao: string,
      criado_em: string
    }
  ]
  */
};

/**
 * Cria um novo link de compartilhamento
 * Endpoint: POST /shares/
 *
 * @param {Object} payload
 * @param {Array} payload.itens - Lista de itens a compartilhar
 * @param {number} payload.itens[].dado_origem_id - ID do dado original
 * @param {string} payload.itens[].dado_criptografado - Conteúdo criptografado (Base64)
 * @param {string} [payload.itens[].meta] - Metadados opcionais
 * @param {string} [payload.data_expiracao] - Data de expiração em ISO 8601 (UTC)
 * @param {number} [payload.n_acessos_total] - Limite total de acessos
 * @returns {Promise<Object>} Objeto com o link e token de acesso
 */
export const createShare = async (payload) => {
  const { data } = await apiClient.post("/shares/", payload);
  return data;
  /* Exemplo retorno:
  {
    share_link: string,
    token_acesso: string
  }
  */
};

/**
 * Busca os dados compartilhados de um token público (endpoint público)
 * Endpoint: GET /shares/{token_acesso}
 *
 * @param {string} tokenAcesso - Token de acesso do compartilhamento
 * @returns {Promise<Object>} Dados compartilhados
 */
export const getSharedData = async (tokenAcesso) => {
  // Esse endpoint é público, então não deve enviar Authorization header
  const { data } = await apiClient.get(`/shares/${tokenAcesso}`, {
    headers: { Authorization: undefined },
  });
  return data;
  /* Exemplo retorno:
  {
    itens: [
      { dado_criptografado: string, meta: string }
    ],
    data_expiracao: string
  }
  */
};

/**
 * Atualiza as regras de um compartilhamento existente
 * Endpoint: PATCH /shares/{share_id}
 *
 * @param {number} shareId - ID do compartilhamento
 * @param {Object} payload - Campos a atualizar
 * @param {string} [payload.data_expiracao] - Nova data de expiração (ISO UTC)
 * @param {number} [payload.n_acessos_total] - Novo limite de acessos
 * @returns {Promise<Object>} Compartilhamento atualizado
 */
export const updateShare = async (shareId, payload) => {
  const { data } = await apiClient.patch(`/shares/${shareId}`, payload);
  return data;
  /* Exemplo retorno:
  {
    id: number,
    token_acesso: string,
    n_acessos_total: number,
    n_acessos_atual: number,
    data_expiracao: string,
    criado_em: string
  }
  */
};

/**
 * Apaga um link de compartilhamento existente
 * Endpoint: DELETE /shares/{share_id}
 *
 * @param {number} shareId - ID do compartilhamento
 * @returns {Promise<boolean>} true se sucesso
 */
export const deleteShare = async (shareId) => {
  await apiClient.delete(`/shares/${shareId}`);
  return true; // backend retorna 204 No Content
};
