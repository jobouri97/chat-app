import socket from "./socket.js";

export function markConversationSeen(
  conversationId,
  callback,
) {
  socket.emit(
    "message:seen",
    {
      conversationId: Number(conversationId),
    },
    callback,
  );
}

export function onMessagesSeen(callback) {
  socket.on("message:seen-update", callback);
}

export function offMessagesSeen(callback) {
  socket.off(
    "message:seen-update",
    callback,
  );
}