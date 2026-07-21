import pool from "../../database.js";

export function registerTypingEvents(io, socket) {
  async function sendTypingStatus(
    conversationId,
    eventName,
  ) {
    try {
      const id = Number(conversationId);
      const senderId = Number(socket.userId);

      if (!Number.isInteger(id) || id <= 0) {
        return;
      }

      // Confirm the sender belongs to this conversation
      // and find the other participant.
      const result = await pool.query(
        `
          SELECT recipient.user_id
          FROM conversation_participants AS sender

          JOIN conversation_participants AS recipient
            ON recipient.conversation_id =
              sender.conversation_id
            AND recipient.user_id != sender.user_id

          WHERE sender.conversation_id = $1
            AND sender.user_id = $2

          LIMIT 1
        `,
        [id, senderId],
      );

      const recipientId = result.rows[0]?.user_id;

      if (!recipientId) {
        return;
      }

      // Send to all connected tabs/devices of the recipient.
      io.to(`user:${recipientId}`).emit(eventName, {
        conversationId: id,
        userId: senderId,
      });
    } catch (error) {
      console.error("Typing status error:", error);
    }
  }

  socket.on("typing:start", ({ conversationId } = {}) => {
    sendTypingStatus(
      conversationId,
      "typing:started",
    );
  });

  socket.on("typing:stop", ({ conversationId } = {}) => {
    sendTypingStatus(
      conversationId,
      "typing:stopped",
    );
  });
}
