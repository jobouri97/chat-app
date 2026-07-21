// Bring in the JWT library.
// We use it to check if a token is valid.
import jwt from "jsonwebtoken";
import { config } from "../config.js";

// Middleware to verify the user's token.
export default function verifyToken(req, res, next) {

  // Get the Authorization header from the request.
  // Example:
  // Authorization: Bearer eyJhbGciOiJIUzI1Ni...
  const authorizationHeader = req.headers.authorization;

  // If there is no Authorization header,
  // the user did not send a token.
  if (!authorizationHeader) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  // Remove the word "Bearer " from the beginning
  // so only the token remains.
  const token = authorizationHeader.startsWith("Bearer ")
    ? authorizationHeader.slice(7)
    : null;

  // If we couldn't get a token, stop here.
  if (!token) {
    return res.status(401).json({
      message: "Invalid token format",
    });
  }

  try {
    // Verify the token using the server's secret key.
    // If the token has been changed or expired,
    // this line will throw an error.
    const decodedToken = jwt.verify(
      token,
      config.jwtSecret
    );

    // Save the decoded information in the request.
    // Example:
    // req.user = { userId: 5, iat: ..., exp: ... }
    //
    // Now any route after this middleware
    // can know which user made the request.
    // Controllers trust this server-created value instead of a user ID supplied
    // in the request body, which prevents users from impersonating one another.
    req.user = decodedToken;

    // Everything is OK.
    // Continue to the next middleware or route.
    next();

  } catch (error) {

    // The token is invalid or has expired.
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}
