import { authHeaders, request } from "./apiClient.js";

export function getMessages(conversationId, token, beforeId = null) {
  const query = beforeId ? `?beforeId=${encodeURIComponent(beforeId)}` : "";
  return request(`/api/conversations/${conversationId}/messages${query}`, { headers: authHeaders(token) });
}

export function sendMessage(conversationId, content, token) {
  return request(`/api/conversations/${conversationId}/messages`, {
    method: "POST", headers: authHeaders(token), body: JSON.stringify({ content }),
  });
}

export function markMessagesAsRead(conversationId, token) {
  return request(`/api/conversations/${conversationId}/messages/read`, {
    method: "PATCH", headers: authHeaders(token),
  });
}
