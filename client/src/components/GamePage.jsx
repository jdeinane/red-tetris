import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import TetrisGame from "../tetris/TetrisGame";
import LobbyPage from "./LobbyPage";
import { generateSequence } from "../../../shared/pieces.js";

function generateLocalSequence() {
	return generateSequence(200);
}


/* Client game page. This file handles:
	- reads the room's and player's name in the URL
	- connects to the server
	- listens to events
	- renders the list of players name
	- shows the `Start Game` button */

let socket;

export default function GamePage() {
	const { room, player } = useParams();
	const isSolo = !room || !player;
	const [players, setPlayers] = useState([]);
	const [sequence, setSequence] = useState(null);
	const [spectrums, setSpectrums] = useState({});

	useEffect(() => {
		if (isSolo) {
			setSequence(generateLocalSequence());
			return;
		}

		socket = io("http://localhost:3000");

		window.socket = socket;
		window.currentRoom = room;
		window.currentPlayer = player;

		socket.emit("join-room", { room, player });

		socket.on("room-players", (data) => {
			setPlayers(data);
		});

		socket.on("start-game", ({ sequence }) => {
			console.log("** Game started! ***");
			console.log("Sequence:", sequence);

			setSequence(sequence);
		});

		socket.on("join-denied", () => {
			alert("Game already started. \nPlease wait for the next round!");
			window.location.href = "/multi/join";
		});

		socket.on("garbage", ({ from, count }) => {
			console.log(`Received ${count} garbage from ${from}`);
			window.dispatchEvent(new CustomEvent("add-garbage", {
				detail:count
			}));
		});

		socket.on("game-ended", ({ winner }) => {
			if (winner === window.currentPlayer) {
				alert("🏆 YOU WIN!");
			} else {
				alert(`❌ YOU LOSE\nWinner: ${winner}`);
			}

			window.location.href = `/multi/join`;
		});

		socket.on("spectrum", ({ from, spectrum }) => {
			setSpectrums(prev => ({
				...prev,
				[from]: spectrum,
			}));
		});

		return () => socket.disconnect();

	}, [room, player]);

	if (!sequence) {
		if (isSolo) return <div>Loading solo mode…</div>;
		return <LobbyPage socket={socket} players={players} />;
	}

	return (
		<TetrisGame
		sequence={sequence}
		spectrums={isSolo ? {} : spectrums}
		/>
	);
}
