import apiClient from "../api/client";

/**
 * Busca a lista paginada de notificações (eventos) do usuário logado.
 * Endpoint: GET /notifications/
 *
 * @param {number} [pageNumber=1] - Número da página (default: 1)
 * @param {number} [pageSize=20] - Tamanho da página (máximo 100)
 * @returns {Promise<Object[]>} Lista de notificações
 */
export const getMyNotifications = async (pageNumber = 1, pageSize = 20) => {
  const { data } = await apiClient.get("/notifications/", {
    params: { page_number: pageNumber, page_size: pageSize },
  });
  return data;
  /* Exemplo retorno:
  [
    {
      id: number,
      notificacao: string,
      created_at: string (ISO datetime)
    }
  ]
  */
};

/**
 * Busca a lista paginada de logs de atividade do usuário logado.
 * Endpoint: GET /notifications/logs
 *
 * @param {number} [pageNumber=1] - Número da página (default: 1)
 * @param {number} [pageSize=20] - Tamanho da página (máximo 100)
 * @returns {Promise<Object[]>} Lista de logs de atividade
 */
export const getMyActivityLogs = async (pageNumber = 1, pageSize = 20) => {
  const { data } = await apiClient.get("/notifications/logs", {
    params: { page_number: pageNumber, page_size: pageSize },
  });
  return data;
  /* Exemplo retorno:
  [
    {
      id: number,
      dispositivo: string,
      data_hora: string (ISO datetime),
      ip: string,
      regiao: string,
      nome_aplicacao: string,
      tipo_acesso: string,
      id_dado: number
    }
  ]
  */
};
