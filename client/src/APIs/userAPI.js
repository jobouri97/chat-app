import { authHeaders, request } from "./apiClient.js";

export function registerUser(values) {
  return request("/register", { method: "POST", body: JSON.stringify(values) });
}
export function loginUser(values) {
  return request("/login", { method: "POST", body: JSON.stringify(values) });
}
export function getUsers(token) {
  return request("/", { headers: authHeaders(token) });
}
export function getCurrentUser(token) {
  return request("/me", { headers: authHeaders(token) });
}
export function updateCurrentUser(values, token) {
  return request("/me", { method: "PUT", headers: authHeaders(token), body: JSON.stringify(values) });
}
export function updateCurrentUserPassword(values, token) {
  return request("/me/password", { method: "PUT", headers: authHeaders(token), body: JSON.stringify(values) });
}
export function deleteCurrentUser(token) {
  return request("/me", { method: "DELETE", headers: authHeaders(token) });
}
