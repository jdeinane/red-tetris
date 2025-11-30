import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import TetrisGame from "../tetris/TetrisGame";
import LobbyPage from "./LobbyPage";
/* Client game page. This file handles:
	- reads the room's and player's name in the URL
	- connects to the server
	- listens to events
	- renders the list of players name
	- shows the `Start Game` button */

let socket;

export default function GamePage() {
	const { room, player } = useParams();
	const [players, setPlayers] = useState([]);
	const [sequence, setSequence] = useState(null);

	useEffect(() => {
		socket = io("http://localhost:3000");

		socket.emit("join-room", { room, player });

		socket.on("room-players", (data) => {
			setPlayers(data);
		});

		socket.on("start-game", ({ sequence }) => {
			console.log("** Game started! ***");
			console.log("Sequence:", sequence);

			setSequence(sequence);
		});

		return () => socket.disconnect();

	}, [room, player]);

	if (!sequence) {
		return <LobbyPage socket={socket} players={players} />;
	}

	return <TetrisGame sequence={sequence} />;
}
