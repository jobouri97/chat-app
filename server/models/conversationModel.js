import pool from "../database.js";

// Find a private conversation that already contains exactly these two users.
export async function findConversationBetweenUsers(firstUserId, secondUserId,) {
    const result = await pool.query(
        `
      SELECT
        c.id,
        c.created_at
      FROM conversations c

      JOIN conversation_participants cp
        ON cp.conversation_id = c.id

      GROUP BY c.id, c.created_at

      HAVING
        COUNT(*) = 2
        AND COUNT(*) FILTER (
          WHERE cp.user_id IN ($1, $2)
        ) = 2

      LIMIT 1
    `,
        [firstUserId, secondUserId],
    );

    return result.rows[0] || null;
}

// Create a conversation and add both users as participants.
export async function createConversation(firstUserId, secondUserId,) {
    const client = await pool.connect();

    try {
        // Start a database transaction.
        await client.query("BEGIN");

        // An advisory lock is a temporary PostgreSQL lock identified by two
        // numbers. If both users click at the same moment, one request waits for
        // the other, preventing two private conversations for the same pair.
        const lowerUserId = Math.min(firstUserId, secondUserId);
        const higherUserId = Math.max(firstUserId, secondUserId);
        await client.query(
          "SELECT pg_advisory_xact_lock($1, $2)",
          [lowerUserId, higherUserId],
        );

        const existingResult = await client.query(
          `
            SELECT c.id, c.created_at
            FROM conversations c
            JOIN conversation_participants cp ON cp.conversation_id = c.id
            GROUP BY c.id, c.created_at
            HAVING COUNT(*) = 2
              AND COUNT(*) FILTER (WHERE cp.user_id IN ($1, $2)) = 2
            LIMIT 1
          `,
          [firstUserId, secondUserId],
        );

        if (existingResult.rows[0]) {
          await client.query("COMMIT");
          return existingResult.rows[0];
        }

        // First, create the empty conversation.
        const conversationResult = await client.query(
            `
        INSERT INTO conversations DEFAULT VALUES
        RETURNING id, created_at
      `,
        );

        const conversation = conversationResult.rows[0];

        // Then add both users to the conversation.
        await client.query(
            `
        INSERT INTO conversation_participants (
          conversation_id,
          user_id
        )
        VALUES
          ($1, $2),
          ($1, $3)
      `,
            [
                conversation.id,
                firstUserId,
                secondUserId,
            ],
        );

        // Save both operations.
        await client.query("COMMIT");

        return conversation;
    } catch (error) {
        // Undo everything if one query fails.
        await client.query("ROLLBACK");
        throw error;
    } finally {
        // Return the database connection to the pool.
        client.release();
    }
}

// Get all conversations that belong to one user.
export async function getConversationsByUserId(userId) {
    const result = await pool.query(
        `
      SELECT
        c.id,
        c.created_at,

        other_user.id AS other_user_id,
        other_user.username AS other_username,
        MAX(messages.created_at) AS last_message_at,
        COUNT(messages.id) FILTER (
          WHERE messages.sender_id != $1
            AND messages.read_at IS NULL
        )::INTEGER AS unread_count

      FROM conversations c

      -- Find conversations containing the current user.
      JOIN conversation_participants current_participant
        ON current_participant.conversation_id = c.id
        AND current_participant.user_id = $1

      -- Find the other participant in the same conversation.
      JOIN conversation_participants other_participant
        ON other_participant.conversation_id = c.id
        AND other_participant.user_id != $1

      -- Get the other participant's user information.
      JOIN users other_user
        ON other_user.id = other_participant.user_id

      LEFT JOIN messages
        ON messages.conversation_id = c.id

      GROUP BY
        c.id,
        c.created_at,
        other_user.id,
        other_user.username

      ORDER BY
        COALESCE(MAX(messages.created_at), c.created_at) DESC
    `,
        [userId],
    );

    return result.rows;
}

// Check whether a user belongs to a conversation.
export async function isConversationParticipant(conversationId, userId,) {
    const result = await pool.query(
        `
      SELECT 1
      FROM conversation_participants
      WHERE conversation_id = $1
        AND user_id = $2
      LIMIT 1
    `,
        [conversationId, userId],
    );

    return result.rowCount > 0;
}

// Get one conversation only when the user belongs to it.
export async function findConversationByIdAndUserId(conversationId, userId,) {
    const result = await pool.query(
        `
      SELECT
        c.id,
        c.created_at
      FROM conversations c

      JOIN conversation_participants cp
        ON cp.conversation_id = c.id

      WHERE c.id = $1
        AND cp.user_id = $2

      LIMIT 1
    `,
        [conversationId, userId],
    );

    return result.rows[0] || null;
}
