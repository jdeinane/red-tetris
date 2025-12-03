import Player from "./Player.js";

/* Handles game management and assign its host. */

// Dictionary { gameName: Game }
const games = {};

export function getOrCreateGame(name) {
    if (!games[name]) {
        games[name] = new Game(name);
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
                delete games[gameName];
                console.log(`Removed empty game ${gameName}`);
                return null;
            }

            return game;
        }
    }

    return null;
}

class Game {
    constructor(name) {
        this.name = name;
        this.players = {};
        this.host = null;
        this.isGameRunning = false;
        this.alive = new Set();
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
}

export default Game;
