import express, { Request, Response } from "express";
import http from "http";
const app = express();
const server = http.createServer(app);
import cron from "node-cron";
import { NeuralNetwork } from "brain.js";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
import Game from "./modals/game";
import connectDB from "./config/db";

dotenv.config();
connectDB();

import { Server, Socket } from "socket.io";
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3002",
  },
});
const userNum = {
  X: 0,
  O: 1,
};
type Block = "" | "X" | "O";
const arryToObj2 = (arr: Block[]) => {
  let obj: any = {};
  arr.forEach((val: Block, index: number) => {
    if (val) {
      obj["block" + index] = userNum[val];
    } else {
      obj["block" + index] = (index + 1) / 10;
    }
  });
  return obj;
};
const arryToObj = (arr: Number[]) => {
  let obj: any = {};
  [...new Array(9)].forEach((val: number, index: number) => {
    obj["block" + index] = arr[index];
  });
  return obj;
};
// [20, 16, 8, 4]
// [15, 9]=0.02192588363173036=2000 iterations
const net = new NeuralNetwork({ hiddenLayers: [27, 18, 18], iterations: 6000 });
// 0.0163... =[18, 10, 5,3]=10000 iterations
// 0.01651041420724989 =[27, 18, 18]
// 0.016993320811456564 =[18, 18, 18]
// 0.0167528135890492 =[18, 18, 9]
// 0.01789833920854192=[18, 9, 9]
// 0.016991432774402265 =[18, 10, 5,3]
// 0.01730309931532406 =[18, 10, 5]
// 0.019470191368529302 =[15, 8, 4]
// 0.01910969505990482 =[15, 8, 4, 2]
async function trainNeuralNetwork() {
  try {
    // ****train and create model****//
    const loadedModelJson = JSON.parse(
      fs.readFileSync("./data/trainingData.json", "utf-8")
    );
    const status = net.train(loadedModelJson?.data, {
      log: (err) => console.log(err),
    });
    const json = net.toJSON();
    fs.writeFileSync("./data/trained-model.json", JSON.stringify(json));
    // ****till here****//

    // ****train with existed model****//
    // const json = JSON.parse(
    //   fs.readFileSync("./data/trained-model.json", "utf-8")
    // );
    // const status = net.fromJSON(json);
    // ****till here****//

    console.log("Neural network training status--:", status);
  } catch (error) {
    console.error("Error during neural network training:", error);
  }
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
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3002",
  })
);
app.use(express.urlencoded({ extended: false }));

app.post("/computer-move", function (req: Request, res: Response) {
  // return res.status(200).json({ move: 1 });

  try {
    const { board }: { board: number[] } = req.body;
    const output: any = net.run(board);
    console.count("finalll");
    console.log("finalll", output);
    res.status(200).json({ move: Math.round(output?.move * 10) });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Something Went Wrong!" });
  }
});
app.post("/winnerset", async function (req: Request, res: Response) {
  try {
    const filePath = "./data/tempData.json";
    const jsonData = await fs.promises.readFile(filePath, "utf-8");
    let parsedData = JSON.parse(jsonData);
    if (Array.isArray(parsedData.data)) {
      parsedData.data = [...parsedData.data, ...req.body.data];
      const updatedJSON = JSON.stringify(parsedData, null, 2); // 2 spaces for pretty formatting
      await fs.promises.writeFile(filePath, updatedJSON, "utf-8");
      res.status(200).json({ message: "Data updated successfully" });
    } else {
      console.log("Data is not in the expected format.");
      res.status(400).json({ error: "Bad Request" });
    }
    res.end();
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Something Went Wrong!" });
  }
  res.end();
});

// const output: any = net.run({
//   block0: 0.1,
//   block1: 1,
//   block2: 0.3,
//   block3: 0,
//   block4: 1,
//   block5: 0.6,
//   block6: 0,
//   block7: 0.8,
//   block8: 0.9,
// });
// console.log("output", Math.round(output?.move * 10));
// console.log("output", output);

interface CustomSocket extends Socket {
  roomId?: string;
}

io.on("connection", (socket: CustomSocket) => {
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
async function roomsCleanUp() {
  try {
    // Calculate the timestamp for 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 1);
    const timestampThreshold = sevenDaysAgo.getTime();

    console.log(timestampThreshold);

    // Define the query object to match records older than 7 days
    const query = { createdAt: { $lt: timestampThreshold } };

    // Delete records that match the query
    await Game.deleteMany(query);
  } catch (err) {
    console.log(err);
  }
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

setTimeout(trainNeuralNetwork, 1000);
server.listen(3001, () => {
  console.log("✔️ Server listening on port 3001");
});
