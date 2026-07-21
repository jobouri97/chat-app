import socket from "./socket.js";

export function startTyping(conversationId) {
  socket.emit("typing:start", {
    conversationId: Number(conversationId),
  });
}

export function stopTyping(conversationId) {
  socket.emit("typing:stop", {
    conversationId: Number(conversationId),
  });
}

export function onUserStartedTyping(callback) {
  socket.on("typing:started", callback);
}

export function offUserStartedTyping(callback) {
  socket.off("typing:started", callback);
}

export function onUserStoppedTyping(callback) {
  socket.on("typing:stopped", callback);
}

export function offUserStoppedTyping(callback) {
  socket.off("typing:stopped", callback);
}