import { getToken, clearToken, clearUser } from "./storage";

// 1) Read from env, 2) otherwise default to '/api' (works with Vite proxy)
const BASE_URL_RAW = import.meta.env.VITE_API_URL || "/api";
// normalize so we don't end up with double slashes
const BASE_URL = BASE_URL_RAW.replace(/\/+$/, "");

export async function apiFetch(path, { method = "GET", headers = {}, body } = {}) {
  const url = `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;

  const res = await fetch(url, {
    method,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    clearToken();
    clearUser();
    window.location.replace("/login");
    return;
  }
  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}
