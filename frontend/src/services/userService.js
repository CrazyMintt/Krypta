import apiClient from "../api/client";

export const signup = async (email, nome, senha_mestre) => {
  const { data } = await apiClient.post("/users/", {
    email,
    nome,
    senha_mestre,
  });
  return data;
};

export const login = async (email, password) => {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  const { data } = await apiClient.post("/login", formData.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  return data;
};

// Retorna os dados do usuário logado atualmente
export const getUserMe = async () => {
  const { data } = await apiClient.get("/users/me");
  return data; 
  // Exemplo de retorno:
  // { id, nome, email, created_at }
};


export const deleteUserMe = async () => {
  const { data } = await apiClient.delete("/users/me");
  return data;
};

// Atualiza os dados (nome ou email) do usuário logado
export const updateUserMe = async (updateData) => {
  const { data } = await apiClient.patch("/users/me", updateData);
  return data;
  // Exemplo retorno:
  // { id, nome, email, created_at }
};

// Apaga todos os dados do usuário logado, mantendo a conta
export const deleteUserData = async () => {
  const { data } = await apiClient.delete("/users/me/data");
  return data; // backend retorna 204 No Content
};

// Retorna estatísticas de armazenamento do dashboard
export const getUserDashboardStats = async () => {
  const { data } = await apiClient.get("/users/me/dashboard");
  return data;
  /* Exemplo retorno:
  {
    armazenamento_total_bytes: number,
    armazenamento_usado_bytes: number,
    armazenamento_por_tipo: [
      { extensao: string, bytes_usados: number }
    ]
  }
  */
};
