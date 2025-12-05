import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import { getOrCreateGame, removeEmptyGame } from "./Game.js";
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


// DEV MODE
/* app.get("/", (req, res) => {
  res.send("Server running. Build client first to serve UI.");
}); */

// PROD MODE
/* app.use(express.static(path.join(__dirname, "../client/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});
 */

/* HELPER: Check winner */
function checkWinner(room) {
  if (!room.isGameRunning)
    return;

  const aliveCount = room.alive.size;

  if (aliveCount === 1) {
    const winnerId = [...room.alive][0];
    const winnerName = room.players[winnerId].username;

    console.log(`🏆 Winner is ${winnerName} in room ${room.name}`);

    io.to(room.name).emit("game-ended", {
      winner: winnerName,
    });

    // Reset room for next round
    room.isGameRunning = false;
    room.alive.clear();
  }
}

/* Create a connection for each player */
io.on("connection", (socket) => {
  console.log("🟢 Connected:", socket.id);

  /* JOIN ROOM */
  socket.on("join-room", ({ room, player }) => {
    const r = getOrCreateGame(room);

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
    const room = removeEmptyGame(socket.id);

    if (room) {
      checkWinner(room);
      io.to(room.name).emit("room-players", room.getPlayersInfo());
    }
  });

  /* START GAME */
  socket.on("start-game", ({ room }) => {
    const r = getOrCreateGame(room);

    // Only host can start the game
    if (socket.id !== r.host)
      return;
    
    if (r.isGameRunning)
      return;

    r.isGameRunning = true;
    r.alive = new Set(Object.keys(r.players));

    const sequence = generateSequence(200);

    io.to(room).emit("start-game", { 
		sequence,
		spawn: { x: 3, y: 0 }
	});

    console.log(`** Game started in room ${room} **`);
  });

  /* PLAYER GAME OVER */
  socket.on("player-game-over", ({ room }) => {
    const r = getOrCreateGame(room);

    r.alive.delete(socket.id);

    console.log(`${r.players[socket.id]?.username} died in room ${room}`);

    checkWinner(r);
  })

  /* SPECTRUM UPDATE */
  socket.on("spectrum-update", ({ room, player, spectrum }) => {
    const r = getOrCreateGame(room);
    if (!r.isGameRunning)
      return;

    socket.to(room).emit("spectrum", {
      from: player,
      spectrum,
    });
  });

  /* LINES CLEARED */
  socket.on("lines-cleared", ({ room, player, count }) => {
    const r = getOrCreateGame(room);

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
