import Player from "./Player.js";
import Piece from "./Piece.js";

/* Handles game management and assign its host. */

// Dictionary { gameName: Game }
const games = {};
export { games };
let cleanupTimers = {};

export function getOrCreateGame(name, maxPlayers = 4) {
    const limit = maxPlayers || 4;

    if (!games[name]) {
        games[name] = new Game(name, limit);
    }
    return games[name];
}

export function removeEmptyGame(socketId) {
    for (const gameName in games) {
        const game = games[gameName];
        if (game.players[socketId]) {

            game.removePlayer(socketId);

            // If game becomes empty
            if (Object.keys(game.players).length === 0) {
				clearTimeout(cleanupTimers[gameName]);
				cleanupTimers[gameName] = setTimeout(() => {
					delete games[gameName];
					console.log(`Room ${gameName} deleted (empty after timeout)`);
				}, 10000);
            }

            return game;
        }
    }

    return null;
}

class Game {
    constructor(name, maxPlayers = 4) {
        this.name = name;
        this.players = {};
        this.host = null;
        this.isGameRunning = false;
        this.alive = new Set();
		this.maxPlayers = maxPlayers;
    }

    addPlayer(socketId, username) {
        this.players[socketId] = new Player(username);

        // First player = host
        if (!this.host) {
            this.host = socketId;
        }

        this.alive.add(socketId);
    }

    removePlayer(socketId) {
        delete this.players[socketId];
        this.alive.delete(socketId);

        // Reassign host if needed
        if (socketId === this.host) {
            this.host = Object.keys(this.players)[0] || null;
        }
    }

    getPlayersInfo() {
        return Object.entries(this.players).map(([socketId, player]) => ({
            id: socketId,
            username: player.username,
            isHost: socketId === this.host,
        }));
    }

    generatePiece(type) {
        return new Piece(type);
    }
}

export default Game;
