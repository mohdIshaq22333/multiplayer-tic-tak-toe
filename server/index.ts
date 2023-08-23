const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const cron = require("node-cron");
const Game = require("./modals/game");
const connectDB = require("./config/db");
import dotenv from "dotenv";

dotenv.config();
connectDB();

import { Server, Socket } from "socket.io";
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});

interface CustomSocket extends Socket {
  roomId?: string;
}

io.on("connection", (socket: CustomSocket) => {
  socket.on("client-ready", () => {
    socket.broadcast.emit("get-canvas-state");
  });

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    socket.roomId = roomId;
  });
  socket.on("move", (data) => {
    // socket.broadcast.emit("move", data);
    if (socket.roomId) {
      socket.to(socket.roomId).emit("move", data);
    }
  });
  socket.on("reset", (data) => {
    if (socket.roomId) {
      socket.to(socket.roomId).emit("reset", data);
    }
  });

  socket.on("clear", () => io.emit("clear"));
});

// removing stale rooms
async function roomsCleanUp() {
  // Calculate the timestamp for 7 days ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 1);
  const timestampThreshold = sevenDaysAgo.getTime();

  console.log(timestampThreshold);

  // Define the query object to match records older than 7 days
  const query = { createdAt: { $lt: timestampThreshold } };

  // Delete records that match the query
  await Game.deleteMany(query);
}

// cronjobs
cron.schedule(
  "0 0 */3 * *",
  () => {
    roomsCleanUp();
  },
  {
    scheduled: true,
    timezone: "Asia/Kolkata",
  }
);

server.listen(3001, () => {
  console.log("✔️ Server listening on port 3001");
});
