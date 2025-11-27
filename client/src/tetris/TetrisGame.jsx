import { useEffect, useState } from "react";
import Board from "./Board";
import {
	createEmptyBoard,
	createPiece,
	tick,
	movePiece,
	rotatePiece,
	hardDrop,
	getGhostPiece
} from "../../../shared/tetris.js"

/* Main game loop */

export default function TetrisGame({ sequence }) {
	const [board, setBoard] = useState(createEmptyBoard());
	const [activePiece, setActivePiece] = useState(null);
	const [index, setIndex] = useState(0);

	// Spawn initial piece
	useEffect(() => {
		if (!activePiece && sequence) {
			const nextType = sequence[index];
			setActivePiece(createPiece(nextType));
			setIndex((i) => i + 1);
		}
	}, [activePiece, sequence, index]);

	// Game loop
	useEffect(() => {
		const interval = setInterval(() => {
			if (!activePiece) return;

			const result = tick(board, activePiece);

			if (result.locked) {
				setBoard(result.board);

				const nextType = sequence[index];
				setActivePiece(createPiece(nextType));
				setIndex((i) => i + 1);

			} else {
				setActivePiece(result.activePiece);
			}
		}, 500);

		return () => clearInterval(interval);
	}, [activePiece]);

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

	// DEBUG
	useEffect(() => {
		console.clear();
		console.table(board);
	}, [board]);

	return (
		<div>
			<Board
				board ={board} 
				activePiece={activePiece} 
				ghostPiece={activePiece ? getGhostPiece(board, activePiece) : null}
			/>
		</div>
	);
}
