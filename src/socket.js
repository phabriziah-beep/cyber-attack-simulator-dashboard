import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

const socket = io(SOCKET_URL, {
  transports: ["websocket"], // more stable than polling
  reconnection: true,
  reconnectionAttempts: Infinity,
  timeout: 10000
});

socket.on("connect", () => {
  console.log("✅ CONNECTED TO BACKEND:", socket.id);
});

socket.on("connect_error", (err) => {
  console.log("❌ CONNECT ERROR:", err.message);
});

socket.on("disconnect", () => {
  console.log("❌ DISCONNECTED FROM BACKEND");
});

export default socket;