import { Server } from "socket.io";
import { socketAuth } from "./socketAuth.js";
import { registerConversationEvents } from "./conversationSocket.js";
import { registerMessageEvents } from "./messageSocket.js";
import { registerPresenceEvents } from "./presenceSocket.js";
import { registerTypingEvents } from "./typingSocket.js";
import { isAllowedOrigin } from "../../config.js";

export function initializeSocketServer(httpServer) {
  // Socket.IO keeps a long-lived connection open so the server can push new
  // messages immediately, without the browser repeatedly polling the REST API.
  const io = new Server(httpServer, {
    cors: {
      origin(origin, callback) {
        callback(isAllowedOrigin(origin) ? null : new Error("Origin not allowed by CORS."), true);
      },
    },
    maxHttpBufferSize: 32 * 1024,
  });

  // Authenticate every socket before any event handler can run.
  io.use(socketAuth);

  io.on("connection", (socket) => {
    console.log(`User ${socket.userId} connected`);

    // Each module owns one kind of real-time event. Keeping them separate makes
    // the socket layer easier to read and test.
    registerPresenceEvents(io, socket);
    registerConversationEvents(io, socket);
    registerMessageEvents(io, socket);
    registerTypingEvents(io, socket);
  });

  return io;
}
