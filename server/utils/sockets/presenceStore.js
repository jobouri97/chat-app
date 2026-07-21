// This Map stores connected users.
//
// Example:
//
// userConnections = {
//   1 => Set("socket-a", "socket-b"),
//   2 => Set("socket-c")
// }
//
// User 1 has two tabs/devices connected.
// User 2 has one connection.
const userConnections = new Map();

// This store lives only in this Node process. It is suitable for one server.
// Multiple production server instances would share presence through Redis.

// Add a new socket connection for a user.
export function addUserConnection(userId, socketId) {
  const normalizedUserId = Number(userId);

  // Get the user's existing socket connections.
  let socketIds = userConnections.get(normalizedUserId);

  // If the user has no connections yet,
  // create a new Set for them.
  if (!socketIds) {
    socketIds = new Set();

    userConnections.set(
      normalizedUserId,
      socketIds,
    );
  }

  // The user was offline if they had no sockets before.
  const becameOnline = socketIds.size === 0;

  // Save this new socket connection.
  socketIds.add(socketId);

  // true means this was the user's first connection.
  return becameOnline;
}

// Remove one socket connection from a user.
export function removeUserConnection(userId, socketId) {
  const normalizedUserId = Number(userId);

  const socketIds = userConnections.get(
    normalizedUserId,
  );

  // The user was not stored.
  if (!socketIds) {
    return false;
  }

  // Remove only the disconnected socket.
  socketIds.delete(socketId);

  // If the user has no sockets left,
  // remove them completely from the Map.
  if (socketIds.size === 0) {
    userConnections.delete(normalizedUserId);

    // true means the user became completely offline.
    return true;
  }

  // The user still has another tab or device connected.
  return false;
}

// Return the IDs of all currently online users.
export function getOnlineUserIds() {
  return Array.from(userConnections.keys());
}

// Check whether a specific user is online.
export function isUserOnline(userId) {
  return userConnections.has(Number(userId));
}
