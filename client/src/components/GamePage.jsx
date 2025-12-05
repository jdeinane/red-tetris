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
	const [spawn, setSpawn] = useState(null);
	const [modal, setModal] = useState(null);

	useEffect(() => {
		if (isSolo) {
			setSequence(generateLocalSequence());
			return;
		}

		socket = io(import.meta.env.VITE_SERVER_URL);

		let maxPlayers = localStorage.getItem("maxPlayers");
		if (maxPlayers) {
			maxPlayers = parseInt(maxPlayers);
			localStorage.removeItem("maxPlayers");
		}

		socket.emit("join-room", { room, player, maxPlayers });

		socket.on("room-players", (data) => {
			console.log("ROOM PLAYERS:", data);
			setPlayers(data);
		});

		socket.on("start-game", ({ sequence, spawn }) => {
			console.log("** Game started! ***");
			console.log("Sequence:", sequence);

			setSequence(sequence);
			setSpawn(spawn);
			setModal(null);
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
			if (winner === player) {
				setModal({ result: "win", winner });
			} else {
				setModal({ result: "lose", winner });
				}
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
		return (
			<LobbyPage
				socket={socket}
				players={players}
			/>
		);
	}

	return (
		<TetrisGame
		sequence={sequence}
		spawn={spawn}
		spectrums={isSolo ? {} : spectrums}
		socket={socket}
		room={room}
		player={player}
		endGame={modal}
		/>
	);
}
