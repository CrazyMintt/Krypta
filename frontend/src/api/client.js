import axios from "axios";

const apiClient = axios.create({
  baseURL: "https://localhost:8000",
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) config.headers.Authorization = token;
  return config;
});

export default apiClient;
