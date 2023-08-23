"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const cron = require("node-cron");
const Game = require("./modals/game");
const connectDB = require("./config/db");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
connectDB();
const socket_io_1 = require("socket.io");
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "http://localhost:3000",
    },
});
io.on("connection", (socket) => {
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
function roomsCleanUp() {
    return __awaiter(this, void 0, void 0, function* () {
        // Calculate the timestamp for 7 days ago
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 1);
        const timestampThreshold = sevenDaysAgo.getTime();
        console.log(timestampThreshold);
        // Define the query object to match records older than 7 days
        const query = { createdAt: { $lt: timestampThreshold } };
        // Delete records that match the query
        yield Game.deleteMany(query);
    });
}
// cronjobs
cron.schedule("0 0 */3 * *", () => {
    roomsCleanUp();
}, {
    scheduled: true,
    timezone: "Asia/Kolkata",
});
server.listen(3001, () => {
    console.log("✔️ Server listening on port 3001");
});
