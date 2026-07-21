// server/socket/presenceSocket.js

import {
  addUserConnection,
  removeUserConnection,
  getOnlineUserIds,
} from "./presenceStore.js";

export function registerPresenceEvents(io, socket) {
  const becameOnline = addUserConnection(
    socket.userId,
    socket.id,
  );

  // Give the user a private room.
  socket.join(`user:${socket.userId}`);

  // Send the current online-user list
  // only to the newly connected socket.
  socket.emit("presence:online-users", {
    userIds: getOnlineUserIds(),
  });

  // Notify everyone else only when this is
  // the user's first open tab/device.
  if (becameOnline) {
    socket.broadcast.emit("presence:user-online", {
      userId: socket.userId,
    });
  }

  socket.on("disconnect", () => {
    const becameOffline = removeUserConnection(
      socket.userId,
      socket.id,
    );

    // Notify others only when the user has
    // no tabs or devices connected anymore.
    if (becameOffline) {
      socket.broadcast.emit(
        "presence:user-offline",
        {
          userId: socket.userId,
        },
      );
    }
  });
}