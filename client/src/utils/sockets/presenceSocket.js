import socket from "./socket.js";

export function onOnlineUsers(callback) {
  socket.on(
    "presence:online-users",
    callback,
  );
}

export function offOnlineUsers(callback) {
  socket.off(
    "presence:online-users",
    callback,
  );
}

export function onUserOnline(callback) {
  socket.on(
    "presence:user-online",
    callback,
  );
}

export function offUserOnline(callback) {
  socket.off(
    "presence:user-online",
    callback,
  );
}

export function onUserOffline(callback) {
  socket.on(
    "presence:user-offline",
    callback,
  );
}

export function offUserOffline(callback) {
  socket.off(
    "presence:user-offline",
    callback,
  );
}