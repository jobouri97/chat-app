// Import JWT so we can verify the user's token.
import jwt from "jsonwebtoken";
import { config } from "../../config.js";

// This middleware runs BEFORE the socket connection is accepted.
//
// If the token is valid:
//   - the user is allowed to connect
//   - we save the user's ID on socket.userId
//
// If the token is invalid:
//   - the connection is rejected
export function socketAuth(socket, next) {
  // Read the token sent by the client.
  //
  // Client:
  // socket.auth = {
  //   token: "..."
  // };
  const token = socket.handshake.auth?.token;

  // No token was sent.
  if (!token) {
    return next(new Error("Authentication required."));
  }

  try {
    // Verify the JWT using our secret key.
    //
    // If the token was changed or expired,
    // jwt.verify() will throw an error.
    const decoded = jwt.verify(
      token,
      config.jwtSecret,
    );

    // Make sure the token contains a user ID.
    if (!decoded.userId) {
      return next(new Error("Invalid token."));
    }

    // Save the logged-in user's ID on the socket.
    //
    // Every socket event can now use:
    // socket.userId
    socket.userId = decoded.userId;

    // Authentication succeeded.
    next();
  } catch {
    return next(
      new Error("Invalid or expired token."),
    );
  }
}
