import {
  getMessagesByConversationId,
  createMessage,
  markMessagesAsRead,
} from "../models/messageModel.js";

// Return all messages from one conversation.
export async function getConversationMessages(req, res) {
  try {
    const conversationId = Number(req.params.conversationId);
    const userId = req.user.userId;

    if (!Number.isInteger(conversationId)) {
      return res.status(400).json({
        message: "Invalid conversation ID.",
      });
    }

    const messages = await getMessagesByConversationId(
      conversationId,
      userId,
    );

    return res.status(200).json({
      messages,
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