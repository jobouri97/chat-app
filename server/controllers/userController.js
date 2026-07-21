import bcrypt from "bcrypt";
import { findUserById, findUserByEmail, findUserByUsername, createUser, deleteUserById, updateUserById, updateUserPasswordById, getAllUsers } from "../models/userModel.js";
import { generateToken } from "../utils/generateToken.js";

export async function getCurrentUser(req, res) {
  try {
    // The JWT middleware already put the user's ID here
    const userId = req.user.userId;

    // Find the user in the database
    const user = await findUserById(userId);

    // User doesn't exist
    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    // Return the user's information
    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
}

export async function getUsers(req, res) {
  try {
    const users = await getAllUsers();

    return res.status(200).json({
      users,
    });
  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
}

export async function loginUser(req, res) {
    try {
        // Get the login information sent by the frontend
        const { email, password } = req.body;

        // Make sure both fields were provided
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required.",
            });
        }

        // Ask the user model to find a user with this email
        const user = await findUserByEmail(email);

        // No user was found
        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password.",
            });
        }

        // Compare the normal password entered by the user
        // with the hashed password stored in the database
        const passwordIsCorrect = await bcrypt.compare(
            password,
            user.password_hash
        );

        // The password does not match
        if (!passwordIsCorrect) {
            return res.status(401).json({
                message: "Invalid email or password.",
            });
        }

        // Create a JWT containing the user's ID
        const token = generateToken(user.id);

        // Send the token and safe user information
        return res.status(200).json({
            message: "Login successful.",
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                created_at: user.created_at,
                updated_at: user.updated_at,
            },
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Internal server error.",
        });
    }
}

export async function registerUser(req, res) {
  try {
    // Get the user's information from the request
    const { username, email, password } = req.body;
    const normalizedUsername = username?.trim();

    // Make sure all required fields were provided
    if (!normalizedUsername || !email || !password) {
      return res.status(400).json({
        message: "Username, email, and password are required.",
      });
    }

    const existingUsername = await findUserByUsername(
      normalizedUsername,
    );

    if (existingUsername) {
      return res.status(409).json({
        message: "Username already exists.",
      });
    }

    // Check if the email is already being used
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return res.status(409).json({
        message: "Email already exists.",
      });
    }

    // Hash the password before saving it
    const passwordHash = await bcrypt.hash(password, 10);

    // Create the new user
    const user = await createUser(
      normalizedUsername,
      email,
      passwordHash
    );

    // Create a JWT for the new user
    const token = generateToken(user.id);

    // Send the response
    return res.status(201).json({
      message: "User registered successfully.",
      token,
      user,
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "Username or email already exists.",
      });
    }

    console.error("Register error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
}

export async function deleteUser(req, res) {
  try {
    // Get the user's ID from the URL
    const { id } = req.params;

    // Delete the user
    const deletedUser = await deleteUserById(id);

    // No user with this ID exists
    if (!deletedUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    // Success
    return res.status(200).json({
      message: "User deleted successfully.",
      user: deletedUser,
    });
  } catch (error) {
    console.error("Delete user error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
}

export async function updateUser(req, res) {
  try {
    // Get the user's ID from the URL
    const id = req.user.userId;

    // Get the new data from the request body
    const { username, email } = req.body;
    const normalizedUsername = username?.trim();

    // Make sure all required fields were provided
    if (!normalizedUsername || !email) {
      return res.status(400).json({
        message: "Username and email are required.",
      });
    }

    const existingUsername = await findUserByUsername(
      normalizedUsername,
      id,
    );

    if (existingUsername) {
      return res.status(409).json({
        message: "Username already exists.",
      });
    }

    // Update the user
    const updatedUser = await updateUserById(
      id,
      normalizedUsername,
      email
    );

    // No user with this ID exists
    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    // Success
    return res.status(200).json({
      message: "User updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "Username or email already exists.",
      });
    }

    console.error("Update user error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
}

export async function updateCurrentUserPassword(req, res) {
  try {
    // The user's ID was extracted from the verified JWT
    const userId = req.user.userId;

    // Passwords sent by the frontend
    const { currentPassword, newPassword } = req.body;

    // Check that both fields were provided
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password are required.",
      });
    }

    // Basic password validation
    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters.",
      });
    }

    // findUserById does not return password_hash,
    // so first get the user's safe information
    const currentUser = await findUserById(userId);

    if (!currentUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    // findUserByEmail returns the full database row,
    // including password_hash
    const userWithPassword = await findUserByEmail(
      currentUser.email
    );

    // Check whether the entered current password is correct
    const currentPasswordIsCorrect = await bcrypt.compare(
      currentPassword,
      userWithPassword.password_hash
    );

    if (!currentPasswordIsCorrect) {
      return res.status(401).json({
        message: "Current password is incorrect.",
      });
    }

    // Prevent changing to the same password
    const samePassword = await bcrypt.compare(
      newPassword,
      userWithPassword.password_hash
    );

    if (samePassword) {
      return res.status(400).json({
        message: "New password must be different.",
      });
    }

    // Hash the new password before storing it
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update the password in PostgreSQL
    await updateUserPasswordById(
      userId,
      newPasswordHash
    );

    return res.status(200).json({
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error("Update password error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
}

