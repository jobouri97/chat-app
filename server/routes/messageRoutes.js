import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import {
  getConversationMessages,
  sendMessage,
  readConversationMessages,
} from "../controllers/messageController.js";

const router = express.Router();

// Get the messages belonging to one conversation.
router.get(
  "/:conversationId/messages",
  verifyToken,
  getConversationMessages,
);

// Send a message to one conversation.
router.post(
  "/:conversationId/messages",
  verifyToken,
  sendMessage,
);

// Mark received messages as read.
router.patch(
  "/:conversationId/messages/read",
  verifyToken,
  readConversationMessages,
);

export default router;