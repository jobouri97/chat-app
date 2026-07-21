import {
  createMessage,
} from "../../models/messageModel.js";
import pool from "../../database.js";

export function registerMessageEvents(io, socket) {
  socket.on(
    "message:send",
    async ({ conversationId, text }, reply) => {
      try {
        const id = Number(conversationId);
        const cleanText = text?.trim();

        if (!cleanText) {
          reply?.({
            success: false,
            message: "Message cannot be empty.",
          });
          return;
        }

        const message = await createMessage(
          id,
          socket.userId,
          cleanText,
        );

        if (!message) {
          reply?.({
            success: false,
            message: "You are not part of this conversation.",
          });
          return;
        }

        const recipientResult = await pool.query(
          `
            SELECT user_id
            FROM conversation_participants
            WHERE conversation_id = $1
              AND user_id != $2
            LIMIT 1
          `,
          [id, socket.userId],
        );

        const recipientId = recipientResult.rows[0]?.user_id;
        let recipients = io.to(`conversation:${id}`);

        if (recipientId) {
          recipients = recipients.to(`user:${recipientId}`);
        }

        recipients.emit(
          "message:new",
          message,
        );

        reply?.({
          success: true,
          message,
        });
      } catch {
        reply?.({
          success: false,
          message: "Could not send message.",
        });
      }
    },
  );
}
