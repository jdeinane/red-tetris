import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";

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

	useEffect(() => {
		socket = io("http://localhost:3000");

		socket.emit("join-room", { room, player });

		socket.on("room-players", (data) => {
			setPlayers(data);
		});

		socket.on("start-game", ({ sequence }) => {
			console.log("** Game started! ***");
			console.log("Sequence:", sequence);

			//TODO: demarrer le moteur tetris
		});

		return () => socket.disconnect();

	}, [room, player]);

	return (
		<div>
			<h1>Room: {room}</h1>
			<h2>Player {player}</h2>

			{players.find(p => p.username === player)?.isHost && (
				<button
					onClick={() => socket.emit("start-game", { room })}
					style={{ padding: "10px", marginBottom: "20px"}}
					>
						Start Game
					</button>
			)}
			<h3>Players in room:</h3>
		<ul>
		{players.map((p) => (
			<li key={p.id}>
			{p.username} {p.isHost ? "(HOST)" : ""}
			</li>
		))}
		</ul>
		</div>
	);
}
