import {
  isConversationParticipant,
} from "../../models/conversationModel.js";

export function registerConversationEvents(io, socket) {
  socket.on(
    "conversation:join",
    async ({ conversationId } = {}, reply) => {
      try {
        const id = Number(conversationId);

        if (!Number.isInteger(id) || id <= 0) {
          reply?.({ success: false, message: "Invalid conversation ID." });
          return;
        }

        const isParticipant =
          await isConversationParticipant(id, socket.userId);

        if (!isParticipant) {
          reply?.({
            success: false,
            message: "You are not part of this conversation.",
          });
          return;
        }

        await socket.join(`conversation:${id}`);

        reply?.({ success: true });
      } catch {
        reply?.({
          success: false,
          message: "Could not join conversation.",
        });
      }
    },
  );

  socket.on("conversation:leave", ({ conversationId } = {}) => {
    socket.leave(`conversation:${Number(conversationId)}`);
  });
}
