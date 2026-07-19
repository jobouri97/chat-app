// Bring in the JWT library.
// This library can create a "token".
//
// A token is like a temporary ID card.
// After a user logs in successfully, the server gives them this ID card.
// The user shows this ID card to the server on future requests
// so the server knows who they are without asking them to log in again.
import jwt from "jsonwebtoken";

// Create a function that makes a token for a user.
export function generateToken(userId) {

  // Create and return a token.
  return jwt.sign(

    // This is the information we want to put inside the token.
    // Here we only save the user's ID.
    //
    // Example:
    // userId = 15
    //
    // The token will secretly contain:
    // {
    //   userId: 15
    // }
    //
    // (The user cannot simply edit this value because the token
    // is protected by the secret key below.)
    { userId },

    // This is the server's secret password.
    // Only the server knows this value.
    //
    // It is used to "lock" the token.
    // Later, when the user sends the token back,
    // the server uses the same secret to check
    // whether the token is genuine or has been changed.
    process.env.JWT_SECRET,

    // Extra settings for the token.
    {
      // Decide when the token expires.
      // For example:
      // "1h" = valid for 1 hour
      // "7d" = valid for 7 days
      //
      // After it expires, the user usually needs
      // to log in again to receive a new token.
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );
}