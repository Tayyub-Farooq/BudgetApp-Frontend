export const tokenKey = "token";
export const userKey = "user";

export const getToken = () => localStorage.getItem(tokenKey);
export const setToken = (t) => localStorage.setItem(tokenKey, t);
export const clearToken = () => localStorage.removeItem(tokenKey);

export const getUser = () => {
  try { return JSON.parse(localStorage.getItem(userKey) || "null"); }
  catch { return null; }
};
export const setUser = (u) => localStorage.setItem(userKey, JSON.stringify(u));
export const clearUser = () => localStorage.removeItem(userKey);
