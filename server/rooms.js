import Player from "./Player.js";

/* Handles room management and assign its host. */

// Dictionnary {roomName: Room}
const rooms = {};

export function getOrCreateRoom(name) {
	if (!rooms[name]) {
		rooms[name] = new Room(name);
	}
	return rooms[name];
}

export function removeEmptyRoom(socketId) {
	for (const roomName in rooms) {
		const room = rooms[roomName];
		if (room.players[socketId]) {
			room.removePlayer(socketId);
			
			// If room becomes empty
			if (Object.keys(room.players).length === 0) {
				delete rooms[roomName];
				console.log(`Removed empty room ${roomName}`);
				return null;
			}
			return room;
		}
	}
	return null;
}

class Room {
	constructor(name) {
		this.name = name;
		this.players = {};
		this.host = null;
		this.isGameRunning = false;
	}

	addPlayer(socketId, username) {
		this.players[socketId] = new Player(username);

		// 1st player = host
		if (!this.host)
			this.host = socketId;
	}

	removePlayer(socketId) {
		delete this.players[socketId];

		// Reassign host if needed
		if (socketId === this.host)
			this.host = Object.keys(this.players)[0] || null;
	}

	getPlayersInfo() {
		return Object.entries(this.players).map(([socketId, player]) => ({
			id: socketId,
			username: player.username,
			isHost: socketId === this.host,
		}));
	}
}

export default Room;
