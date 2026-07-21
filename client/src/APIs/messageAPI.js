const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

// A reusable function for sending requests to the backend.
async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
}

// Creates the Authorization header using the saved JWT.
function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

// Get all messages belonging to one conversation.
export function getMessages(conversationId, token) {
  return request(
    `/api/conversations/${conversationId}/messages`,
    {
      headers: authHeaders(token),
    },
  );
}

// Send and save a new message.
export function sendMessage(
  conversationId,
  content,
  token,
) {
  return request(
    `/api/conversations/${conversationId}/messages`,
    {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({
        content,
      }),
    },
  );
}

// Mark received messages as read.
export function markMessagesAsRead(conversationId, token) {
  return request(
    `/api/conversations/${conversationId}/messages/read`,
    {
      method: "PATCH",
      headers: authHeaders(token),
    },
  );
}