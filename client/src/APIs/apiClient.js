const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");

// Protected endpoints expect the token in an Authorization header.
export function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function request(path, options = {}) {
  // Every API module uses this helper, so JSON parsing and error handling behave
  // consistently across users, conversations, and messages.
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  // Some failures may return an empty body. Catching JSON errors prevents the
  // error handler itself from crashing and hiding the original HTTP failure.
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Something went wrong.");
  return data;
}
