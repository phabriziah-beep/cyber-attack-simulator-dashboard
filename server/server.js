const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",   // ← Better than "*" for Vite
    methods: ["GET", "POST"]
  }
});

// Fake attack generator
const attackTypes = ["DDoS", "SQL", "BRUTE", "PHISHING"];

function generateAttack() {
  return {
    type: attackTypes[Math.floor(Math.random() * attackTypes.length)],
    severity: ["LOW", "MEDIUM", "HIGH", "CRITICAL"][Math.floor(Math.random() * 4)],
    time: new Date().toLocaleTimeString()
  };
}

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  const interval = setInterval(() => {
    socket.emit("attack", generateAttack());
  }, 2000);

  socket.on("disconnect", () => {
    clearInterval(interval);
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});