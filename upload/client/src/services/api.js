import axios from "axios";

const api = axios.create({ baseURL: "/api" });

/**
 * auth: GitHub kullanıcı adı, profil URL'i veya PAT token
 * Header adını x-github-auth olarak gönder
 */
export function withAuth(auth) {
  return { headers: { "x-github-auth": auth } };
}

// Geriye dönük uyumluluk için token alias
export const withToken = withAuth;

export default api;
