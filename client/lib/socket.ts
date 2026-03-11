import { io } from "socket.io-client";

// Socket.io server URL.
// - In production behind Apache, set NEXT_PUBLIC_SOCKET_SERVER_URL to the
//   public origin (e.g. "https://chat.example.com") and proxy /socket.io.
// - In local development, set it to "http://localhost:5001" (Express port).
const SERVER_URL =
  process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:5001";

export const socket = io(SERVER_URL, {
  autoConnect: false, // Don't connect automatically
  transports: ["websocket", "polling"],
});

// Socket event handlers
socket.on("connect", () => {
  console.log("Connected to server:", socket.id);
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
});

// You can add more event listeners here as you build your chat app
// socket.on('message', (data) => { ... })
// socket.on('userJoined', (data) => { ... })

export default socket;
