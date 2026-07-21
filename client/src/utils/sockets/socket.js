import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  "http://localhost:3000";

// Export one shared socket instance. autoConnect is false because connection
// must wait until the login token is available.
const socket = io(SOCKET_URL, {
  autoConnect: false,
});

export default socket;
