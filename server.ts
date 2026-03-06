
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

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

  // Diagnostic logging
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      time: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development'
    });
  });

  app.get("/api/debug-files", (req, res) => {
    try {
      const files = fs.readdirSync(__dirname);
      const distFiles = fs.existsSync(path.join(__dirname, "dist")) 
        ? fs.readdirSync(path.join(__dirname, "dist")) 
        : ["dist folder missing"];
      res.json({ root: files, dist: distFiles });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

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

    socket.on("escape-room-solved", (data) => {
      const { pin, playerName } = data;
      const room = rooms.get(pin);
      if (room) {
        if (!room.solvers) room.solvers = [];
        if (!room.solvers.includes(playerName)) {
          room.solvers.push(playerName);
        }
        io.to(pin).emit("player-solved-escape-room", { playerName, allSolvers: room.solvers });
        console.log(`Player ${playerName} solved Escape Room in room ${pin}`);
      }
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
    console.log("Starting Vite in middleware mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: __dirname,
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static files from dist...");
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`__dirname: ${__dirname}`);
  });
}

startServer();
