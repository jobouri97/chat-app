import pool from "../database.js";

// Get all messages in a conversation.
// The participant check prevents users outside the conversation
// from reading its messages.
export async function getMessagesByConversationId(
  conversationId,
  userId,
  limit,
  beforeId,
) {
  // beforeId is a cursor. Instead of loading every message, each request loads
  // one page of older messages. This stays fast as conversations become large.
  const result = await pool.query(
    `
      SELECT
        messages.id,
        messages.conversation_id,
        messages.sender_id,
        messages.content,
        messages.created_at,
        messages.read_at,
        users.username AS sender_username
      FROM messages
      JOIN users
        ON users.id = messages.sender_id
      JOIN conversation_participants
        ON conversation_participants.conversation_id =
           messages.conversation_id
      WHERE messages.conversation_id = $1
        AND conversation_participants.user_id = $2
        AND ($4::BIGINT IS NULL OR messages.id < $4)
      ORDER BY messages.id DESC
      LIMIT $3
    `,
    [conversationId, userId, limit, beforeId],
  );

  // SQL reads newest-first to use the index efficiently. The UI displays the
  // page oldest-first, so reverse the small result array before returning it.
  return result.rows.reverse();
}

// Create and save a new message.
// The SELECT makes sure the sender belongs to the conversation.
export async function createMessage(
  conversationId,
  senderId,
  content,
) {
  // INSERT ... SELECT ... WHERE EXISTS performs authorization and insertion in
  // one database statement, avoiding a timing gap between a check and a write.
  const result = await pool.query(
    `
      INSERT INTO messages (
        conversation_id,
        sender_id,
        content
      )
      SELECT $1, $2, $3
      WHERE EXISTS (
        SELECT 1
        FROM conversation_participants
        WHERE conversation_id = $1
          AND user_id = $2
      )
      RETURNING
        id,
        conversation_id,
        sender_id,
        content,
        created_at,
        read_at
    `,
    [conversationId, senderId, content],
  );

  return result.rows[0];
}

// Mark the other users' messages as read.
export async function markMessagesAsRead(
  conversationId,
  userId,
) {
  // Only messages sent by somebody else are marked as read. The EXISTS clause
  // also prevents a non-participant from changing messages in a conversation.
  const result = await pool.query(
    `
      UPDATE messages
      SET read_at = CURRENT_TIMESTAMP
      WHERE conversation_id = $1
        AND sender_id != $2
        AND read_at IS NULL
        AND EXISTS (
          SELECT 1
          FROM conversation_participants
          WHERE conversation_id = $1
            AND user_id = $2
        )
      RETURNING *
    `,
    [conversationId, userId],
  );

  return result.rows;
}
