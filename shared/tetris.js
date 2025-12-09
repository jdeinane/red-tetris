import { BOARD_WIDTH, BOARD_HEIGHT } from "./constants.js";
import { PIECE_SHAPES } from "./pieces.js";

const WALL_KICKS = {
  DEFAULT: [
		[0, 0],   // 1. normal rotation
		[-1, 0],  // 2. move to the left if right wall
		[1, 0],   // 3. move to the right if left wall
		[0, -1],  // 4. move to the top if floor
		[-2, 0],  // 5. double left (for I piece)
		[2, 0],   // 6. double right (for I piece)
		[-1, -1], // 7. diagonal (complex case)
		[1, -1],
		[0, -2],  // 8. heavy ascend (critical case)
  ],
  I: [
		[0, 0],
        [-2, 0],  // 1. double left
        [2, 0],   // 2. double right
        [-1, 0],  // 3. simple left
        [1, 0],   // 4. simple right
        [-3, 0],  // 5. triple left
        [3, 0],   // 6. triple right
        [0, -1],  // 7. top
        [-2, -1], 
        [2, -1],
        [0, -2],
        [0, -3]   // 8. triple top
]
};


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
export function createPiece(type, spawn = null) {
	const shape = PIECE_SHAPES[type];
	if (!shape) {
		throw new Error(`Unknown piece type: ${type}`);
	}

	const width = shape[0].length;
	const defaultX = Math.floor(BOARD_WIDTH / 2) - Math.ceil(width / 2);

	const s = spawn || { x: defaultX, y: 0 };

	return {
		type,
		shape,
		x: s.x,
		y: s.y,
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
				newY >= BOARD_HEIGHT
			) {
				return true;
			}

			// Collision with a block that is already laid?
			if (newY >= 0 && board[newY][newX]) {
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
	if (!piece) return null;
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
	if (!piece) return null;
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
	if (!piece) return null;

	if (piece.type === 'O') return piece;

	const newShape = rotateMatrixCW(piece.shape);
	const candidate = { ...piece, shape: newShape };

	const kicks = piece.type === 'I' ? WALL_KICKS.I : WALL_KICKS.DEFAULT;

	for (const [ox, oy] of kicks) {
		if (!hasCollision(board, candidate, ox, oy)) {
			return { ...candidate, x: candidate.x + ox, y: candidate.y + oy };
		}
	}
	return piece;
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
		const row = board[y];
		const isGarbageRow = row.includes("G");
		const isFull = row.every((cell) => cell !== 0);

		if (isGarbageRow) {
			newBoard.push([...row]);
			continue;
		}

		if (isFull) {
			cleared++;
			continue;
		}

		newBoard.push([...row]);
	}

	while (newBoard.length < BOARD_HEIGHT)
		newBoard.unshift(Array(BOARD_WIDTH).fill(0));

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
	if (!piece) return null;
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

	const cols = board[0].length;

	// Clone board
	const newBoard = board.map((row) => [...row]);

	for (let i = 0; i < count; i++) {
		if (newBoard[0].some(cell => cell !== 0))
			return null;

		newBoard.shift();

		const hole = Math.floor(Math.random() * cols);
		const garbageRow = Array.from({ length: cols }, (_, x) =>
		x === hole ? 0 : "G"
		);

		console.log("Garbage row added:", garbageRow); // DEBUG
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
