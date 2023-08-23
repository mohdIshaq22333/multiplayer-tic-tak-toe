// import { Server } from "socket.io";
// import cors from "cors";
// import { NextApiRequest, NextApiResponse } from "next";
// import nextConnect from "next-connect";

// const handler = nextConnect();

// // Enable CORS
// handler.use(cors());

// handler.all((req, res) => {
//   if (res.socket.server.io) {
//     console.log("Already set up");
//     res.end();
//     return;
//   }

//   const io = new Server(res.socket.server);

//   // Event handler for client connections
//   io.on("connection", (socket) => {
//     const clientId = socket.id;
//     console.log("A client connected");
//     console.log(`A client connected. ID: ${clientId}`);
//     io.emit("client-new", clientId);

//     // Event handler for receiving messages from the client
//     socket.on("message", (data) => {
//       console.log("Received message:", data);
//     });

//     // Event handler for client disconnections
//     socket.on("disconnect", () => {
//       console.log("A client disconnected.");
//     });
//   });

//   res.socket.server.io = io;
//   res.end();
// });

// export default handler;

import { Server } from "socket.io";

export const GET = async (req, res) => {
  console.log("innnnnn");
  if (req?.socket?.server?.io) {
    console.log("Socket is already running");
  } else {
    console.log("Socket is initializing");
    const io = new Server(req?.socket?.server);
    req.socket.server.io = io;

    // Wait until the request has been made before accessing the res.socket object.
    await req.socket;

    io.on("connection", (socket) => {
      socket.on("move", (data) => {
        socket.broadcast.emit("move", data);
      });
    });
  }
  res.end();
};

// export default { POST: SocketHandler };
