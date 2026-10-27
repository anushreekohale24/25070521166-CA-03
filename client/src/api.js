// All communication with the Node/Express server lives here.
const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const getToken = () => localStorage.getItem("token");
export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};
export const saveSession = (token, user) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};
export const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export async function api(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = "Bearer " + token;

  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Cannot reach the server. Is it running on port 5000?");
  }

  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && token) {
    clearSession();
    window.location.href = "/login";
  }
  if (!res.ok) throw new Error(data.msg || "Something went wrong");
  return data;
}
