import axios from "axios";
import { showError } from "../utils/toast";

const api = axios.create({
  baseURL: "http://localhost:4000/api",
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.error || error?.message || "Erreur réseau";
    showError(message);
    return Promise.reject(error);
  }
);

export default api;