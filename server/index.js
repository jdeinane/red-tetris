import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

import { getOrCreateRoom, removeEmptyRoom } from "./rooms.js";
import Player from "./Player.js";
import { generateSequence } from "../shared/pieces.js";

/*   This file contains the heart of the server, it handles:
      - the players' connections 
      - the rooms
      - the host
      - the game start
      - the pieces distrubution */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* Create Server + socket.io */
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*"},
});


// For serving client later (for now just public/)
app.use(express.static(path.join(__dirname, "../client/public")));

/* Create a connection for each player */
io.on("connection", (socket) => {
  console.log("🟢 Connected:", socket.id);

  /* JOIN ROOM */
  socket.on("join-room", ({ room, player }) => {
    const r = getOrCreateRoom(room);

    if (r.isGameRunning) {
      socket.emit("join-denied", { reason: "game-already-started" });
      return;
    }

    r.addPlayer(socket.id, player);
    socket.join(room);

    console.log(`${player} joined room ${room}`);

    io.to(room).emit("room-players", r.getPlayersInfo());
  });

  /* DISCONNECT */
  socket.on("disconnect", () => {
    console.log("🔴 Disconnected:", socket.id);

    // Remove player from its room
    const room = removeEmptyRoom(socket.id);

    if (room) {
      // Notify update
      io.to(room.name).emit("room-players", room.getPlayersInfo());
    }
  });

  /* START GAME */
  socket.on("start-game", ({ room }) => {
    const r = getOrCreateRoom(room);

    // Only host can start the game
    if (socket.id !== r.host)
      return;
    
    if (r.isGameRunning)
      return;

    r.isGameRunning = true;
  
    const sequence = generateSequence(200);

    io.to(room).emit("start-game", { sequence });

    console.log(`** Game started in room ${room} **`);
  });

  /* LINES CLEARED */
  socket.on("lines-cleared", ({ room, player, count }) => {
    const r = getOrCreateRoom(room);

    if (!r.isGameRunning)
      return;

    const garbage = Math.max(0, count - 1);
    if (garbage <= 0)
      return;

    console.log(`${player} cleared ${count} lines → sending ${garbage} garbage`);

    socket.to(room).emit("garbage", {
      from: player,
      count: garbage,
    });
  });
});

server.listen(3000, () =>
  console.log("red-tetris Server running on http://localhost:3000")
);
