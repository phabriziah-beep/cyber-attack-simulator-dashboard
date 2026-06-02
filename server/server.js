const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: "*", // allow frontend (we can tighten later)
  methods: ["GET", "POST"]
}));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Fake attack generator
const attackTypes = ["DDoS", "SQL", "BRUTE", "PHISHING"];

function generateAttack() {
  return {
    type: attackTypes[Math.floor(Math.random() * attackTypes.length)],
    severity: ["LOW", "MEDIUM", "HIGH", "CRITICAL"][Math.floor(Math.random() * 4)],
    time: new Date().toISOString()
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

// IMPORTANT: Render PORT FIX
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});