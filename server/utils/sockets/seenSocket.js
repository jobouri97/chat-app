// Import the database connection.
import pool from "../../database.js";

// Register all "seen" events.
export function registerSeenEvents(io, socket) {
  // The client says:
  //
  // "I have read this conversation."
  socket.on(
    "message:seen",
    async ({ conversationId }, reply) => {
      try {
        // Make sure the conversation ID exists.
        if (!conversationId) {
          return reply?.({
            success: false,
            message: "Conversation ID is required.",
          });
        }

        // Check that the current user belongs
        // to this conversation.
        const memberResult = await pool.query(
          `
            SELECT 1
            FROM conversation_members
            WHERE conversation_id = $1
              AND user_id = $2
          `,
          [
            conversationId,
            socket.userId,
          ],
        );

        if (memberResult.rowCount === 0) {
          return reply?.({
            success: false,
            message:
              "You are not a member of this conversation.",
          });
        }

        // Save the time when the user read
        // the conversation.
        await pool.query(
          `
            UPDATE conversation_members
            SET last_read_at = CURRENT_TIMESTAMP
            WHERE conversation_id = $1
              AND user_id = $2
          `,
          [
            conversationId,
            socket.userId,
          ],
        );

        // Notify everyone in the conversation.
        io.to(
          `conversation:${conversationId}`,
        ).emit("message:seen-update", {
          conversationId,
          userId: socket.userId,
          seenAt: new Date().toISOString(),
        });

        reply?.({
          success: true,
        });
      } catch (error) {
        console.error(
          "Seen event error:",
          error,
        );

        reply?.({
          success: false,
          message:
            "Could not update seen status.",
        });
      }
    },
  );
}