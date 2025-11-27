import { useEffect, useState } from "react";
import Board from "./Board";
import NextPiece from "./NextPiece";
import {
	createEmptyBoard,
	createPiece,
	tick,
	movePiece,
	rotatePiece,
	hardDrop,
	getGhostPiece,
	hasCollision
} from "../../../shared/tetris.js"

/* Main game loop */

export default function TetrisGame({ sequence }) {
	const [board, setBoard] = useState(createEmptyBoard());
	const [activePiece, setActivePiece] = useState(null);
	const [index, setIndex] = useState(0);
	const [isGameOver, setIsGameOver] = useState(false);

	// Spawn new piece
	function spawnPiece() {
		const nextType = sequence[index];
		const newPiece = createPiece(nextType);
		const cannotMove =
			hasCollision(board, newPiece, -1, 0) &&
			hasCollision(board, newPiece, 1, 0) &&
			hasCollision(board, newPiece, 0, 1);
		
		if (cannotMove) {
			setIsGameOver(true);
			return;
		}

		setActivePiece(newPiece);
		setIndex(i => i + 1);
	}

	// Initial spawn
	useEffect(() => {
		if (!activePiece && sequence && !isGameOver) {
			spawnPiece();
		}
	}, [activePiece, sequence, index]);

	// Game loop
	useEffect(() => {
		if (isGameOver) return;

		const interval = setInterval(() => {
			if (!activePiece) return;

			const result = tick(board, activePiece);

			if (result.locked) {
				setBoard(result.board);
				setActivePiece(null);
			} else {
				setActivePiece(result.activePiece);
			}
		}, 500);

		return () => clearInterval(interval);
	}, [activePiece, board, isGameOver]);

	// Keyboard controls
	useEffect(() => {
		if (!activePiece) return;

		function handleKey(e) {
			if (e.key === "ArrowLeft")
				setActivePiece(p => movePiece(board, p, -1, 0));

			if (e.key === "ArrowRight") 
				setActivePiece(p => movePiece(board, p, 1, 0));

			if (e.key === "ArrowDown") 
				setActivePiece(p => movePiece(board, p, 0, 1));

			if (e.key === "ArrowUp")
				setActivePiece(p => rotatePiece(board, p));

			if (e.code === "Space")
				setActivePiece(p => hardDrop(board, p));
		}
		
		window.addEventListener("keydown", handleKey);

		return () => {
			window.removeEventListener("keydown", handleKey);
		};

	}, [activePiece, board]);


	// Restart Game
	function restartGame() {
		setBoard(createEmptyBoard());
		setIsGameOver(false);
		setIndex(0);

		// Respawn first piece
		const newPiece = createPiece(sequence[0]);
		setActivePiece(newPiece);
	}

	// DEBUG
	useEffect(() => {
		console.clear();
		console.table(board);
	}, [board]);

	// RENDER
	return (
		<div style={{ 
			display: "flex", 
			flexDirection: "row", 
			justifyContent: "center",
			gap: "40px",
			position: "relative"
		}}>
		
		{/* Board */}
		<Board
			board={board}
			activePiece={activePiece}
			ghostPiece={activePiece ? getGhostPiece(board, activePiece) : null}
		/>

		{/* Next piece */}
		<NextPiece type={sequence[index]} />

		{/* Game Over UI */}
		{isGameOver && (
			<div style={{
			position: "absolute",
			top: "35%",
			left: "50%",
			transform: "translate(-50%, -50%)",
			background: "rgba(0,0,0,0.85)",
			padding: "40px",
			color: "white",
			borderRadius: "12px",
			textAlign: "center",
			fontSize: "32px",
			width: "300px"
			}}>
			<h1 style={{ marginBottom: "20px" }}>GAME OVER</h1>
			<button
				onClick={restartGame}
				style={{
				padding: "12px 25px",
				fontSize: "18px",
				cursor: "pointer",
				background: "#ff69b4",
				color: "white",
				border: "none",
				borderRadius: "8px"
				}}
			>
				Restart
			</button>
			</div>
		)}

		</div>
	);
}
