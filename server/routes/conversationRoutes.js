import express from "express";

import { getConversationById, getMyConversations, startConversation, } from "../controllers/conversationController.js";

import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

// Start a conversation with another user.
router.post("/", verifyToken, startConversation);

// Get all conversations belonging to the logged-in user.
router.get("/", verifyToken, getMyConversations);

// Get one conversation.
// Keep this route after router.get("/").
router.get(
    "/:conversationId",
    verifyToken,
    getConversationById,
);

export default router;
