import "./board.css";

export default function Board({ board, activePiece }) {
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
