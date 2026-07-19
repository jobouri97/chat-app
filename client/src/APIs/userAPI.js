// client/src/APIs/userAPI.js

// Get the backend URL from the .env file.
// If there is no value in the .env file,
// use "http://localhost:3000" as the default.
const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
)
// Remove the "/" at the end of the URL if it exists.
// Example:
// "http://localhost:3000/" -> "http://localhost:3000"
.replace(/\/$/, "");

// A reusable function for sending requests to the backend.
// Instead of writing fetch() many times,
// all API functions will use this helper.
async function request(path, options = {}) {

  // Send the HTTP request.
  const response = await fetch(`${API_URL}${path}`, {

    // Copy all options passed to the function
    // (method, headers, body, etc.)
    ...options,

    // Add the default Content-Type header.
    // If the caller provides additional headers,
    // merge them with this one.
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  // Try to convert the response into JSON.
  // If the response has no JSON body,
  // return an empty object instead of crashing.
  const data = await response.json().catch(() => ({}));

  // If the request failed (status is not 2xx),
  // throw an error with the backend message if available.
  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  // Return the successful response data.
  return data;
}

// Create the Authorization header used for protected routes.
// The backend will read this token and verify the user.
function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
  };
}

// =======================
// Authentication APIs
// =======================

// Register a new user.
export function registerUser({ username, email, password }) {
  return request("/register", {
    method: "POST",

    // Convert the JavaScript object into JSON
    // before sending it to the backend.
    body: JSON.stringify({ username, email, password }),
  });
}

// Log in an existing user.
export function loginUser({ email, password }) {
  return request("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// =======================
// User APIs
// =======================

// Get all users.
// A valid JWT token is required.
export function getUsers(token) {
  return request("/", {

    // Send the JWT token in the Authorization header.
    headers: authHeaders(token),
  });
}

// Get the currently logged-in user's information.
// The backend knows who the user is by reading the JWT token.
export function getCurrentUser(token) {
  return request("/me", {
    headers: authHeaders(token),
  });
}

// Update the current user's username and email.
export function updateCurrentUser({ username, email }, token) {
  return request("/me", {
    method: "PUT",
    headers: authHeaders(token),

    // Send the new values to the backend.
    body: JSON.stringify({ username, email }),
  });
}

// Update the current user's password.
export function updateCurrentUserPassword(
  { currentPassword, newPassword },
  token,
) {
  return request("/me/password", {
    method: "PUT",
    headers: authHeaders(token),

    // Send both the current password
    // and the new password.
    body: JSON.stringify({
      currentPassword,
      newPassword,
    }),
  });
}

// Delete the currently logged-in user's account.
export function deleteCurrentUser(token) {
  return request("/me", {
    method: "DELETE",
    headers: authHeaders(token),
  });
}