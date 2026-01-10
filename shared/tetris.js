import { BOARD_WIDTH, BOARD_HEIGHT } from "./constants.js";
import { PIECE_SHAPES } from "./pieces.js";

/* TETRIS LOGIC
  ------------
  This file contains pure functions to manage the game state.
  It is used by both Client (display/prediction) and Server (validation/tests).
*/


/* Wall Kick Data (SRS - Super Rotation System)
Offsets to try when a rotation fails (e.g. against a wall) */
const JLSTZ_KICKS = {
  "0>1": [[0,0], [-1,0], [-1,-1], [0,2], [-1,2]],
  "1>0": [[0,0], [1,0], [1,1], [0,-2], [1,-2]],

  "1>2": [[0,0], [1,0], [1,1], [0,-2], [1,-2]],
  "2>1": [[0,0], [-1,0], [-1,-1], [0,2], [-1,2]],

  "2>3": [[0,0], [1,0], [1,-1], [0,2], [1,2]],
  "3>2": [[0,0], [-1,0], [-1,1], [0,-2], [-1,-2]],

  "3>0": [[0,0], [-1,0], [-1,1], [0,-2], [-1,-2]],
  "0>3": [[0,0], [1,0], [1,-1], [0,2], [1,2]],
};

const I_KICKS = {
  "0>1": [[0,0], [-2,0], [1,0], [-2,1], [1,-2]],
  "1>0": [[0,0], [2,0], [-1,0], [2,-1], [-1,2]],

  "1>2": [[0,0], [-1,0], [2,0], [-1,-2], [2,1]],
  "2>1": [[0,0], [1,0], [-2,0], [1,2], [-2,-1]],

  "2>3": [[0,0], [2,0], [-1,0], [2,-1], [-1,2]],
  "3>2": [[0,0], [-2,0], [1,0], [-2,1], [1,-2]],

  "3>0": [[0,0], [1,0], [-2,0], [1,2], [-2,-1]],
  "0>3": [[0,0], [-1,0], [2,0], [-1,-2], [2,1]],
};


/**
 * Creates a new empty game board (20 rows x 10 cols).
 * Filled with 0s.
 */
export function createEmptyBoard() {
	return Array.from({ length: BOARD_HEIGHT }, () =>
		Array(BOARD_WIDTH).fill(0)
	);
}

/**
 * Creates a piece object with position and shape.
 */
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
		rot: 0,
	};
}

/**
 * Detects if a piece collides with walls, floor, or existing blocks.
 * @param {Array} board - The game grid
 * @param {Object} piece - The piece to check
 * @param {Number} offsetX - Potential X movement
 * @param {Number} offsetY - Potential Y movement
 * @returns {Boolean} - True if collision detected
 */
export function hasCollision(board, piece, offsetX = 0, offsetY = 0) {
	const { shape, x, y } = piece;

	for (let row = 0; row < shape.length; row++) {
		for (let col = 0; col < shape[row].length; col++) {
			if (!shape[row][col])
				continue;
			
			const newX = x + col + offsetX;
			const newY = y + row + offsetY;

			// 1. Check Boundaries (Walls/Floor)
			if (
				newX < 0 			||
				newX >= BOARD_WIDTH ||
				newY >= BOARD_HEIGHT
			) {
				return true;
			}

			// 2. Check Existing Blocks
            // Note: We ignore negative Y (sky) to allow spawning
			if (newY >= 0 && board[newY][newX]) {
				return true;
			}
		}
	}
	return false;
}

/**
 * Moves a piece if no collision occurs.
 */
export function movePiece(board, piece, dx, dy) {
	if (!piece) return null;
	const newPiece = { ...piece, x: piece.x + dx, y: piece.y + dy};
	return hasCollision(board, newPiece, 0, 0) ? piece : newPiece;
}

/**
 * Normal drop
 */
export function softDrop(board, piece) {
	return movePiece(board, piece, 0, 1);
}

/**
 * Instantly drops the piece to the lowest valid position (Spacebar action).
 */
export function hardDrop(board, piece) {
	if (!piece) return null;
	let current = piece;
	while (!hasCollision(board, current, 0, 1)) {
		current = movePiece(board, current, 0, 1);
	}
	return current;
}

// Helper: Rotates a 2D matrix 90 degrees clockwise
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

/**
 * Rotates a piece using Wall Kick data if a basic rotation fails.
 */
export function rotatePiece(board, piece) {
	if (!piece) return null;

	if (piece.type === 'O') return piece;

	const fromRot = piece.rot ?? 0;
	const toRot = (fromRot + 1) % 4;
	const key = `${fromRot}>${toRot}`;

	const newShape = rotateMatrixCW(piece.shape);
	const candidate = { ...piece, shape: newShape, rot: toRot };

	// Select appropriate kick table
	const kicks = piece.type === 'I' ? I_KICKS[key] : JLSTZ_KICKS[key];
	if (!kicks) {
		return hasCollision(board, candidate, 0,0) ? piece : candidate;
	}
	// Try original position, then try all kick offsets
	for (const [ox, oy] of kicks) {
		if (!hasCollision(board, candidate, ox, oy)) {
			return { ...candidate, x: candidate.x + ox, y: candidate.y + oy };
		}
	}

	// All attempts failed, return original piece
	return piece;
}

/**
 * Locks the piece into the board (merges matrices).
 */
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

/**
 * Scans the board for full lines, removes them, and adds new empty lines on top.
 * Also detects "Garbage Lines" (indestructible lines).
 */
export function clearLines(board) {
	const newBoard = [];
	let cleared = 0;

	for (let y = 0; y < BOARD_HEIGHT; y++) {
		const row = board[y];
		const isGarbageRow = row.includes("G");
		const isFull = row.every((cell) => cell !== 0);

		// Garbage rows are skipped (kept as is) but don't count as clearable
		if (isGarbageRow) {
			newBoard.push([...row]);
			continue;
		}

		// Full line ? Don't add it to newBoard (delete it)
		if (isFull) {
			cleared++;
			continue;
		}

		newBoard.push([...row]);
	}

	// Pad the top with empty lines to maintain board height
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

/**
 * Calculates where the piece will land (for the Ghost Piece display).
 */
export function getGhostPiece(board, piece) {
	if (!piece) return null;
	let ghost = { ...piece };

	while (!hasCollision(board, ghost, 0, 1)) {
		ghost = { ...ghost, y: ghost.y + 1};
	}
	return ghost;
}

/**
 * Adds Penalty Lines (Garbage) to the bottom of the board.
 * Returns null if this action causes a Game Over (player pushed out of bounds).
 */
export function addGarbageLines(board, count) {
	if (count <= 0)
		return board;

	const cols = board[0].length;
	const newBoard = board.map((row) => [...row]);

	for (let i = 0; i < count; i++) {
		// If top line is not empty, player dies
		if (newBoard[0].some(cell => cell !== 0))
			return null;

		newBoard.shift(); // Remove top line
		const garbageRow = Array(cols).fill("G");

		console.log("Garbage row added:", garbageRow); // DEBUG
		newBoard.push(garbageRow);
	}

	return newBoard;
}

/**
 * Generates a "Height Map" of the board for the opponents' view (Spectrum).
 */
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
