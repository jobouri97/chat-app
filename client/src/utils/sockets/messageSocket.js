import socket from "./socket.js";

export function sendMessage(conversationId,text,callback,) {
  const cleanText = text.trim();

  if (!cleanText) {
    callback?.({
      success: false,
      message: "Message cannot be empty.",
    });

    return;
  }

  socket.emit(
    "message:send",
    {
      conversationId: Number(conversationId),
      text: cleanText,
    },
    callback,
  );
}

export function onNewMessage(callback) {
  socket.on("message:new", callback);
}

export function offNewMessage(callback) {
  socket.off("message:new", callback);
}