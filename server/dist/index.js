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
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const node_cron_1 = __importDefault(require("node-cron"));
const brain_js_1 = require("brain.js");
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const fs_1 = __importDefault(require("fs"));
const game_1 = __importDefault(require("./modals/game"));
const db_1 = __importDefault(require("./config/db"));
dotenv_1.default.config();
(0, db_1.default)();
const socket_io_1 = require("socket.io");
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "http://localhost:3002",
    },
});
const userNum = {
    X: 0,
    O: 1,
};
const arryToObj2 = (arr) => {
    let obj = {};
    arr.forEach((val, index) => {
        if (val) {
            obj["block" + index] = userNum[val];
        }
        else {
            obj["block" + index] = (index + 1) / 10;
        }
    });
    return obj;
};
const arryToObj = (arr) => {
    let obj = {};
    [...new Array(9)].forEach((val, index) => {
        obj["block" + index] = arr[index];
    });
    return obj;
};
const net = new brain_js_1.NeuralNetwork({ hiddenLayers: [15, 9, 4] });
function trainNeuralNetwork() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const loadedModelJson = JSON.parse(fs_1.default.readFileSync("./data/trainingData.json", "utf-8"));
            const status = net.train(loadedModelJson === null || loadedModelJson === void 0 ? void 0 : loadedModelJson.data);
            console.log("Neural network training status--:", status);
        }
        catch (error) {
            console.error("Error during neural network training:", error);
        }
    });
}
// const loadedModelJson = JSON.parse(
//   fs.readFileSync("./data/trainingData.json", "utf-8")
// );
// const status = net.train(
//   loadedModelJson?.data
//   //   , {
//   //   log: (err) => console.log(err),
//   // }
// );
// console.log("loadedModelJson", loadedModelJson?.data?.length);
// console.log("status", status);
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: "http://localhost:3002",
}));
app.use(express_1.default.urlencoded({ extended: false }));
app.post("/computer-move", function (req, res) {
    // return res.status(200).json({ move: 1 });
    try {
        const { board } = req.body;
        const output = net.run(board);
        console.count("finalll");
        console.log("finalll", output);
        res.status(200).json({ move: Math.round((output === null || output === void 0 ? void 0 : output.move) * 10) });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ error: "Something Went Wrong!" });
    }
});
app.post("/winnerset", function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const filePath = "./data/tempData.json";
            const jsonData = yield fs_1.default.promises.readFile(filePath, "utf-8");
            let parsedData = JSON.parse(jsonData);
            if (Array.isArray(parsedData.data)) {
                parsedData.data = [...parsedData.data, ...req.body.data];
                const updatedJSON = JSON.stringify(parsedData, null, 2); // 2 spaces for pretty formatting
                yield fs_1.default.promises.writeFile(filePath, updatedJSON, "utf-8");
                res.status(200).json({ message: "Data updated successfully" });
            }
            else {
                console.log("Data is not in the expected format.");
                res.status(400).json({ error: "Bad Request" });
            }
            res.end();
        }
        catch (err) {
            console.log(err);
            res.status(500).json({ error: "Something Went Wrong!" });
        }
        res.end();
    });
});
io.on("connection", (socket) => {
    socket.on("client-ready", () => {
        socket.broadcast.emit("get-state");
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
        try {
            // Calculate the timestamp for 7 days ago
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 1);
            const timestampThreshold = sevenDaysAgo.getTime();
            console.log(timestampThreshold);
            // Define the query object to match records older than 7 days
            const query = { createdAt: { $lt: timestampThreshold } };
            // Delete records that match the query
            yield game_1.default.deleteMany(query);
        }
        catch (err) {
            console.log(err);
        }
    });
}
// cronjobs
node_cron_1.default.schedule("0 0 */3 * *", () => {
    roomsCleanUp();
}, {
    scheduled: true,
    timezone: "Asia/Kolkata",
});
setTimeout(trainNeuralNetwork, 1000);
server.listen(3001, () => {
    console.log("✔️ Server listening on port 3001");
});
// app.listen(3003, () => {
//   console.log(`Example app listening on port 3003`);
// });
