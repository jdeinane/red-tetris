import { useEffect, useState } from "react";
import Board from "./Board";
import {
	createEmptyBoard,
	createPiece,
	tick,
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

	// DEBUG
	useEffect(() => {
		console.clear();
		console.table(board);
	}, [board]);

	return (
		<div>
			<Board board ={board} activePiece={activePiece} />
		</div>
	);
}

