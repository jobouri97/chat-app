import socket from "./socket.js";

export function connectSocket(token) {
  if (!token) {
    console.error("Socket token is missing.");
    return;
  }

  socket.auth = {
    token,
  };

  if (!socket.connected) {
    socket.connect();
  }
}

export function disconnectSocket() {
  if (socket.connected) {
    socket.disconnect();
  }
}

export function onSocketConnected(callback) {
  socket.on("connect", callback);
}

export function offSocketConnected(callback) {
  socket.off("connect", callback);
}

export function onSocketDisconnected(callback) {
  socket.on("disconnect", callback);
}

export function offSocketDisconnected(callback) {
  socket.off("disconnect", callback);
}

export function onSocketConnectionError(callback) {
  socket.on("connect_error", callback);
}

export function offSocketConnectionError(callback) {
  socket.off("connect_error", callback);
}