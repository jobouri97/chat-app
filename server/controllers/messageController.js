import {
  getMessagesByConversationId,
  createMessage,
  markMessagesAsRead,
} from "../models/messageModel.js";
import { config } from "../config.js";

// Return all messages from one conversation.
export async function getConversationMessages(req, res) {
  try {
    const conversationId = Number(req.params.conversationId);
    const userId = req.user.userId;
    // beforeId is optional. When supplied, it asks for messages older than that
    // message ID and supports an infinite-scroll style interface.
    const beforeId = req.query.beforeId === undefined
      ? null
      : Number(req.query.beforeId);

    if (!Number.isInteger(conversationId)) {
      return res.status(400).json({
        message: "Invalid conversation ID.",
      });
    }

    if (beforeId !== null && (!Number.isInteger(beforeId) || beforeId <= 0)) {
      return res.status(400).json({ message: "Invalid beforeId cursor." });
    }

    const messages = await getMessagesByConversationId(
      conversationId,
      userId,
      config.messagePageSize,
      beforeId,
    );

    return res.status(200).json({
      messages,
      // null means there is no evidence of another full page to request.
      nextBeforeId: messages.length === config.messagePageSize
        ? messages[0].id
        : null,
    });
  } catch (error) {
    console.error("Get messages error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
}

// Save a new message in the database.
export async function sendMessage(req, res) {
  try {
    const conversationId = Number(req.params.conversationId);
    const senderId = req.user.userId;
    const content = req.body.content?.trim();

    if (!Number.isInteger(conversationId)) {
      return res.status(400).json({
        message: "Invalid conversation ID.",
      });
    }

    if (!content) {
      return res.status(400).json({
        message: "Message content is required.",
      });
    }


    if (content.length > config.messageMaxLength) {
      return res.status(400).json({
        message: `Message must be ${config.messageMaxLength} characters or fewer.`,
      });
    }

    const message = await createMessage(
      conversationId,
      senderId,
      content,
    );

    // This happens if the user is not a participant.
    if (!message) {
      return res.status(403).json({
        message: "You are not a participant in this conversation.",
      });
    }

    return res.status(201).json({
      message,
    });
  } catch (error) {
    console.error("Send message error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
}

// Mark received messages as read.
export async function readConversationMessages(req, res) {
  try {
    const conversationId = Number(req.params.conversationId);
    const userId = req.user.userId;

    if (!Number.isInteger(conversationId)) {
      return res.status(400).json({
        message: "Invalid conversation ID.",
      });
    }

    const messages = await markMessagesAsRead(
      conversationId,
      userId,
    );

    return res.status(200).json({
      message: "Messages marked as read.",
      messages,
    });
  } catch (error) {
    console.error("Mark messages as read error:", error);

    return res.status(500).json({
      message: "Internal server error.",
    });
  }
}
