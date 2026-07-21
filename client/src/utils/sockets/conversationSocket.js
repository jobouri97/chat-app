import socket from "./socket.js";

export function startConversation(
  otherUserId,
  callback,
) {
  socket.emit(
    "conversation:start",
    {
      otherUserId: Number(otherUserId),
    },
    callback,
  );
}

export function joinConversation(
  conversationId,
  callback,
) {
  socket.emit(
    "conversation:join",
    {
      conversationId: Number(conversationId),
    },
    callback,
  );
}

export function leaveConversation(
  conversationId,
  callback,
) {
  socket.emit(
    "conversation:leave",
    {
      conversationId: Number(conversationId),
    },
    callback,
  );
}

export function onConversationStarted(callback) {
  socket.on("conversation:started", callback);
}

export function offConversationStarted(callback) {
  socket.off("conversation:started", callback);
}