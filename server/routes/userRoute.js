import express from "express";
import { getUsers, getCurrentUser, updateUser, updateCurrentUserPassword, deleteUser, loginUser, registerUser } from "../controllers/userController.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

/* ---------- Authentication ---------- */

// Register a new user
router.post("/register", registerUser);

// Login an existing user
router.post("/login", loginUser);

/* ---------- User ---------- */

// Get all users (id + username)
router.get("/", verifyToken, getUsers);

// Get the currently logged-in user
router.get("/me", verifyToken, getCurrentUser);

// Update the currently logged-in user
router.put("/me", verifyToken, updateUser);

// Delete the currently logged-in user
router.delete("/me", verifyToken, deleteUser);

router.put("/me/password", verifyToken, updateCurrentUserPassword);

export default router;