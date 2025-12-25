import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import TetrisGame from "../tetris/TetrisGame";
import LobbyPage from "./LobbyPage";
import { generateSequence } from "../../../shared/pieces.js";

function generateLocalSequence() {
	return generateSequence(1000);
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
	const [isGameRunning, setIsGameRunning] = useState(false);

	useEffect(() => {
		if (isSolo) {
			if (!sequence)
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
			setSpectrums({})
			setIsGameRunning(true);
		});

		socket.on("join-denied", ( {reason} ) => {
			let message = "Can't enter room.";

			if (reason === "room-full")
				message = "Lobby is full.";
			else if (reason === "game-already-started")
				message = "The game has already started.";
			else if (reason === "name-taken")
				message = "This username is already taken.";
			else if (reason === "invalid-name")
				message = "Invalid username.";

			alert(message);
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
			setIsGameRunning(false);
		});

		socket.on("spectrum", ({ from, spectrum }) => {
			setSpectrums(prev => ({
				...prev,
				[from]: spectrum,
			}));
		});

		return () => {
			if (socket)
				socket.disconnect();
		};

	}, [room, player, isSolo]);

	const handleBackToLobby = () => {
		setSequence(null);
		setModal(null);
		setSpectrums({});
	};

	const handleQuitToMenu = () => {
		if (socket) {
			socket.disconnect();
			window.location.href = "/";
		}
	};

	if (!sequence) {
		if (isSolo) return <div>Loading solo mode…</div>;
		return (
			<LobbyPage
				socket={socket}
				players={players}
				gameRunning={isGameRunning}
			/>
		);
	}

	return (
	<div style={{ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      width: "100%" 
    }}>
      <h1 className="title" style={{ marginBottom: "20px" }}>
        Playing in: <span style={{ color: "var(--I)" }}>{room}</span>
      </h1>
		<TetrisGame
		sequence={sequence}
		spawn={spawn}
		spectrums={isSolo ? {} : spectrums}
		socket={socket}
		room={room}
		player={player}
		endGame={modal}
		onRestart={handleBackToLobby}
		onExit={handleQuitToMenu}
		isSolo={isSolo}
		/>
		</div>
	);
}
