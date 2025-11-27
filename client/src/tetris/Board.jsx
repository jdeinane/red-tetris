import "./board.css";

export default function Board({ board, activePiece, ghostPiece }) {
	const displayBoard = board.map(row => [...row]);

	if (activePiece) {
		const { shape, x, y, type } = activePiece;

		for (let row = 0; row < shape.length; row++) {
			for (let col = 0; col < shape[row].length;col++) {
				if (!shape[row][col]) continue;

				const boardX = x + col;
				const boardY = y + row;

				if (
					boardY >= 0 &&
					boardY < displayBoard.length &&
					boardX >= 0 &&
					boardX < displayBoard[0].length
				) {
					displayBoard[boardY][boardX] = type;
				}
			}
		}
	}

	if (ghostPiece) {
		const { shape, x, y } = ghostPiece;

		for (let row = 0; row < shape.length; row++) {
			for (let col = 0; col < shape[row].length; col++) {
				if (!shape[row][col]) continue;

				const gx = x + col;
				const gy = y + row;

				if (
					gy >= 0 &&
					gy < displayBoard.length &&
					gx >= 0 &&
					gx < displayBoard[0].length &&
					!displayBoard[gy][gx]
				) {
					displayBoard[gy][gx] = "ghost";
				}
			}
		}
	}

	return (
		<div className="board">
			{displayBoard.map((row, rowIndex) =>
				row.map((cell, colIndex) => (
					<div
						key={`${rowIndex}-${colIndex}`}
						className={`cell cell-${cell || "empty"}`}
					/>
				))
			)}
		</div>
	);
}
