const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

// Reusable function for sending requests to the server.
async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,

    headers: {
      "Content-Type": "application/json",

      // Keep any additional headers, such as Authorization.
      ...options.headers,
    },
  });

  // Try to convert the response into JavaScript data.
  const data = await response.json().catch(() => ({}));

  // Throw an error when the server returns 400, 404, 500, etc.
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

// Start a conversation with another user.
export function startConversationAPI(otherUserId, token) {
  return request("/api/conversations", {
    method: "POST",

    headers: authHeaders(token),

    body: JSON.stringify({
      otherUserId,
    }),
  });
}

// Get all conversations belonging to the logged-in user.
export function getMyConversations(token) {
  return request("/api/conversations", {
    headers: authHeaders(token),
  });
}

// Get one conversation by its ID.
export function getConversationById(conversationId, token) {
  return request(`/api/conversations/${conversationId}`, {
    headers: authHeaders(token),
  });
}