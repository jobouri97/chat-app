import { Server } from "socket.io";
import { socketAuth } from "./socketAuth.js";
import { registerConversationEvents } from "./conversationSocket.js";
import { registerMessageEvents } from "./messageSocket.js";
import { registerPresenceEvents } from "./presenceSocket.js";
import { registerTypingEvents } from "./typingSocket.js";
import { isAllowedOrigin } from "../../config.js";

export function initializeSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin(origin, callback) {
        callback(isAllowedOrigin(origin) ? null : new Error("Origin not allowed by CORS."), true);
      },
    },
    maxHttpBufferSize: 32 * 1024,
  });

  // Authenticate every socket before it connects
  io.use(socketAuth);

  io.on("connection", (socket) => {
    console.log(`User ${socket.userId} connected`);

    registerPresenceEvents(io, socket);
    registerConversationEvents(io, socket);
    registerMessageEvents(io, socket);
    registerTypingEvents(io, socket);
  });

  return io;
}
