import express from "express";
import dotenv from "dotenv";
import { Server } from "socket.io";
import { createServer } from "http";
import {
  mediaControls,
  roomControls,
} from "./controllers/sockets.controllers.js";
import { searchSongs } from "./routes/youtube.route.js";
import cors from "cors";
import path from "path";
dotenv.config();
const app = express();
const PORT = process.env.PORT;
const __dirname = path.resolve();

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.BASE_URL,
    methods: ["GET", "POST"],
  },
});
app.use(
  cors({
    origin: process.env.BASE_URL,
    credentials: true,
  })
);

app.use("/youtube", searchSongs);

io.on("connection", (socket) => {
  console.log("A user connected");

  roomControls(socket);
  mediaControls(socket, io);
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client", "dist", "index.html"));
  });
}

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default { app, io, server };
