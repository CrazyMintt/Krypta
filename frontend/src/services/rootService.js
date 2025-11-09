import apiClient from "../api/client";

/**
 * Verifica se a API está funcionando corretamente
 * Endpoint: GET /
 *
 * @returns {Promise<string>} Mensagem de status da API
 */
export const getApiStatus = async () => {
  const { data } = await apiClient.get("/");
  return data;
  // Exemplo retorno: "API is running" ou mensagem similar
};
