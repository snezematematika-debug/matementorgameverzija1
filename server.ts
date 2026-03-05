
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // Game rooms state
  const rooms = new Map<string, any>();

  app.get("/test", (req, res) => {
    res.send("Server is alive");
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("create-room", (data) => {
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      const roomData = {
        pin,
        topic: data.topic,
        type: data.type,
        status: "WAITING",
        players: [],
        content: data.content,
        hostId: socket.id
      };
      rooms.set(pin, roomData);
      socket.join(pin);
      socket.emit("room-created", roomData);
      console.log(`Room created: ${pin} for topic ${data.topic}`);
    });

    socket.on("join-room", (data) => {
      const { pin, playerName } = data;
      const room = rooms.get(pin);

      if (room) {
        if (!room.players.find((p: any) => p.id === socket.id)) {
          room.players.push({ id: socket.id, name: playerName });
          socket.join(pin);
          io.to(pin).emit("player-joined", { players: room.players });
          socket.emit("join-success", room);
          console.log(`Player ${playerName} joined room ${pin}`);
        }
      } else {
        socket.emit("join-error", "Невалиден PIN код.");
      }
    });

    socket.on("start-game", (pin) => {
      const room = rooms.get(pin);
      if (room && room.hostId === socket.id) {
        room.status = "PLAYING";
        io.to(pin).emit("game-started", room);
      }
    });

    socket.on("close-room", (pin) => {
      const room = rooms.get(pin);
      if (room && room.hostId === socket.id) {
        io.to(pin).emit("room-closed");
        rooms.delete(pin);
      }
    });

    socket.on("leave-room", (pin) => {
      const room = rooms.get(pin);
      if (room) {
        room.players = room.players.filter((p: any) => p.id !== socket.id);
        socket.leave(pin);
        io.to(pin).emit("player-joined", { players: room.players });
      }
    });

    socket.on("submit-answer", (data) => {
      const { pin, answer, playerName } = data;
      io.to(pin).emit("answer-received", { playerName, answer });
    });

    socket.on("disconnect", () => {
      // Cleanup rooms if host disconnects or remove player
      rooms.forEach((room, pin) => {
        if (room.hostId === socket.id) {
          io.to(pin).emit("room-closed");
          rooms.delete(pin);
        } else {
          const playerIndex = room.players.findIndex((p: any) => p.id === socket.id);
          if (playerIndex !== -1) {
            room.players.splice(playerIndex, 1);
            io.to(pin).emit("player-left", { players: room.players });
          }
        }
      });
    });
  });

  app.get("/api/status", (req, res) => {
    res.json({ status: "running" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`__dirname: ${__dirname}`);
  });
}

startServer();
