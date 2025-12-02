import { BOARD_WIDTH, BOARD_HEIGHT } from "./constants.js";
import { PIECE_SHAPES } from "./pieces.js";

/* Board helpers: 
	- creates a 20x10 grid
	- fills it with 0 (empty) */
export function createEmptyBoard() {
	return Array.from({ length: BOARD_HEIGHT }, () =>
		Array(BOARD_WIDTH).fill(0)
	);
}

/* Pieces:
	- changes the shape of the piece (I, T, L...)
	- places it in the top center of the board
	- returns an object */
export function createPiece(type) {
	const shape = PIECE_SHAPES[type];
	if (!shape) {
		throw new Error(`Unknown piece type: ${type}`);
	}

	const width = shape[0].length;
	const startX = Math.floor(BOARD_WIDTH / 2) - Math.ceil(width / 2);

	return {
		type,
		shape,
		x: startX,
		y: 0,
	};
}

/* Collisions :
	- checks if the piece touches a side or a block
	- returns true if there's a collision
	- returns false otherwise */
export function hasCollision(board, piece, offsetX = 0, offsetY = 0) {
	const { shape, x, y } = piece;

	for (let row = 0; row < shape.length; row++) {
		for (let col = 0; col < shape[row].length; col++) {
			if (!shape[row][col])
				continue;
			
			const newX = x + col + offsetX;
			const newY = y + row + offsetY;

			// Outside plateau?
			if (
				newX < 0 			||
				newX >= BOARD_WIDTH ||
				newY < 0			||
				newY >= BOARD_HEIGHT
			) {
				return true;
			}

			// Collision with a block that is already laid?
			if (board[newY][newX]) {
				return true;
			}
		}
	}
	return false;
}

/* Movements */

/*	- moves the piece
	- checks if there's a collision */
export function movePiece(board, piece, dx, dy) {
	const newPiece = { ...piece, x: piece.x + dx, y: piece.y + dy};
	return hasCollision(board, newPiece, 0, 0) ? piece : newPiece;
}

/*	- brings down the piece of one square
	- checks collision */
export function softDrop(board, piece) {
	return movePiece(board, piece, 0, 1);
}

/*	- brings down the piece until it touches the floor
	- runs until there's collision, returns the last valide position */
export function hardDrop(board, piece) {
	let current = piece;
	while (!hasCollision(board, current, 0, 1)) {
		current = movePiece(board, current, 0, 1);
	}
	return current;
}

/* Rotation */

/* - rotates the matrix clockwise */
function rotateMatrixCW(matrix) {
	const rows = matrix.length;
	const cols = matrix[0].length;
	const res = Array.from({ length:cols }, () => Array(rows).fill(0));

	for (let y = 0; y < rows; y++) {
		for (let x = 0; x < cols; x++) {
			res[x][rows - 1 - y] = matrix[y][x];
		}
	}
	return res;
}

/*	- does a rotation on the piece
	- checks collision
	- if there's collision -> cancel rotation */
export function rotatePiece(board, piece) {
	const rotatedShape = rotateMatrixCW(piece.shape);
	const rotatedPiece = { ...piece, shape: rotatedShape };

	return hasCollision(board, rotatedPiece, 0, 0) ? piece : rotatedPiece;
}

/* Fusion + lines */

/*	- merges the piece to the board
	- returns a new board */
export function mergePiece(board, piece) {
	const newBoard = board.map((row) => [...row]);
	const { shape, x, y, type } = piece;

	for (let row = 0; row < shape.length; row++ ) {
		for (let col = 0; col < shape[row].length; col++) {
			if (!shape[row][col])
				continue;
			
			const boardX = x + col;
			const boardY = y + row;

			if (boardY >= 0 && boardY < BOARD_HEIGHT) {
				newBoard[boardY][boardX] = type;
			}
		}
	}
	return newBoard;
}

/*	- goes through each line: if it's full -> remove
	- add empty lines on top */
export function clearLines(board) {
	const newBoard = [];
	let cleared = 0;

	for (let y = 0; y < BOARD_HEIGHT; y++) {
		if (board[y].every((cell) => cell !== 0)) {
			cleared++;
		} else {
			newBoard.push([...board[y]]);
		}
	}

	while (newBoard.length < BOARD_HEIGHT) {
		newBoard.unshift(Array(BOARD_WIDTH).fill(0));
	}

	return { board: newBoard, clearedLines: cleared };
}

/* Tick (gravity):
	- moves the piece one square to the bottom
	- if it can't go down: 
		- merge to the board
		- remove lines
		- flag the piece as `locked`
		- activePiece = null
	- otherwise:
		- the piece continues to go down
		- nothing is merge */
export function tick(board, activePiece) {
	// Try to down the piece
	const dropped = movePiece(board, activePiece, 0, 1);

	// If not moving -> lock the piece
	if (dropped === activePiece) {
		const withPiece = mergePiece(board, activePiece);
		const { board: cleaned, clearedLines } = clearLines(withPiece);

		return {
			board: cleaned,
			activePiece: null,
			locked: true,
			clearedLines,
		};
	}

	// Else, simply update the position
	return {
		board,
		activePiece: dropped,
		locked: false,
		clearedLines: 0,
	};
}

/* Ghost piece: transparent shadow that shows where the piece is gonna land:
	- clones the piece
	- lets down until it cannot
	- returns its finale position */
export function getGhostPiece(board, piece) {
	let ghost = { ...piece };

	while (!hasCollision(board, ghost, 0, 1)) {
		ghost = { ...ghost, y: ghost.y + 1};
	}
	return ghost;
}

/* Garbage Line: when a player clears n lines, others receive n - 1 indestructibles
	lines at the bottom of their board */
export function addGarbageLines(board, count) {
	if (count <= 0)
		return board;

	const rows = board.length;
	const cols = board[0].length;

	// Clone board
	const newBoard = board.map((row) => [...row]);

	for (let i = 0; i < count; i++) {
		newBoard.shift();

		const hole = Math.floor(Math.random() * cols);
		const garbageRow = Array.from({ length: cols }, (_, x) =>
		x === hole ? 0 : "G" // "G" = garbage block
		);
	newBoard.push(garbageRow);
	}
	
	return newBoard;
}

/* Board Spectrum: returns an array of 10 numbers
	representing the height of each column */
export function getSpectrum(board) {
	const cols = board[0].length;
	const heights = Array(cols).fill(0);

	for (let c = 0; c < cols; c++) {
		for (let r = 0; r < board.length; r++) {
			if (board[r][c] !== 0) {
				heights[c] = board.length - r;
				break;
			}
		}
	}
	return heights;
}
