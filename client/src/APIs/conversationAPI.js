import { authHeaders, request } from "./apiClient.js";

export function startConversationAPI(otherUserId, token) {
  return request("/api/conversations", {
    method: "POST", headers: authHeaders(token), body: JSON.stringify({ otherUserId }),
  });
}

export function getMyConversations(token) {
  return request("/api/conversations", { headers: authHeaders(token) });
}

export function getConversationById(conversationId, token) {
  return request(`/api/conversations/${conversationId}`, { headers: authHeaders(token) });
}
