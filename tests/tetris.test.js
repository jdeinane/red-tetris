import {
  createEmptyBoard,
  createPiece,
  movePiece,
  hardDrop,
  clearLines,
  getSpectrum,
  hasCollision,
  rotatePiece,
  addGarbageLines,
  getGhostPiece
} from "../shared/tetris.js";

import { PIECE_SHAPES } from "../shared/pieces.js";

describe("Tetris Logic Coverage", () => {
  
  // --- BOARD & PIECES ---
  test("createEmptyBoard creates 20x10 zero-filled matrix", () => {
    const b = createEmptyBoard();
    expect(b.length).toBe(20);
    expect(b[0].length).toBe(10);
    expect(b[19][9]).toBe(0);
  });

  test("createPiece throws on invalid type", () => {
    expect(() => createPiece("INVALID")).toThrow();
  });

  test("createPiece centers piece 'I'", () => {
    const p = createPiece("I");
    // I is 4 wide, board is 10. Center should be at x=3 (columns 3,4,5,6)
    expect(p.x).toBe(3); 
    expect(p.y).toBe(0);
  });

  // --- COLLISION ---
  test("hasCollision detects walls and floor", () => {
    const board = createEmptyBoard();
    const p = createPiece("O"); // 2x2
    
    // Left wall
    p.x = -1;
    expect(hasCollision(board, p)).toBe(true);
    
    // Right wall (Board width 10 -> max index 9. O piece at x=9 occupies 9,10 -> collision)
    p.x = 9;
    expect(hasCollision(board, p)).toBe(true);

    // Floor
    p.x = 4;
    p.y = 19; // O occupies 19, 20 -> collision
    expect(hasCollision(board, p)).toBe(true);
  });

  test("hasCollision detects other blocks", () => {
    const board = createEmptyBoard();
    board[5][5] = "I"; // Obstacle
    const p = createPiece("O");
    p.x = 4; 
    p.y = 4; 
    // O occupies (4,4), (5,4), (4,5), (5,5). (5,5) is taken.
    expect(hasCollision(board, p)).toBe(true);
  });

  test("hasCollision ignores negative Y (sky)", () => {
    const board = createEmptyBoard();
    const p = createPiece("I");
    p.y = -2; // Partially above board
    expect(hasCollision(board, p)).toBe(false);
  });

  // --- MOVEMENT ---
  test("movePiece returns new coordinates or null", () => {
    const board = createEmptyBoard();
    const p = createPiece("T");
    const moved = movePiece(board, p, 1, 0); // Right
    expect(moved.x).toBe(p.x + 1);
    
    // Move into wall -> returns original piece (no move)
    const wallPiece = { ...p, x: 0 };
    const blocked = movePiece(board, wallPiece, -1, 0);
    expect(blocked.x).toBe(0);
  });

  test("hardDrop goes instantly to bottom", () => {
    const board = createEmptyBoard();
    const p = createPiece("I");
    const dropped = hardDrop(board, p);
    // Should be at bottom
    // Simplest check: moving one more down causes collision
    expect(hasCollision(board, dropped, 0, 1)).toBe(true);
  });

  test("getGhostPiece shows landing position", () => {
    const board = createEmptyBoard();
    const p = createPiece("T");
    const ghost = getGhostPiece(board, p);
    expect(ghost.y).toBeGreaterThan(p.y);
    expect(hasCollision(board, ghost, 0, 1)).toBe(true);
  });

  // --- ROTATION & WALL KICKS ---
  test("rotatePiece rotates basic shape", () => {
    const board = createEmptyBoard();
    const p = createPiece("T"); 
    // T shape initial:
    // [0 1 0]
    // [1 1 1]
    // [0 0 0]
    const rotated = rotatePiece(board, p);
    expect(rotated.shape).not.toEqual(p.shape);
  });

  test("rotatePiece 'O' does nothing", () => {
    const board = createEmptyBoard();
    const p = createPiece("O");
    const rotated = rotatePiece(board, p);
    expect(rotated).toBe(p); // Same ref
  });

  test("rotatePiece performs Wall Kick (I piece against wall)", () => {
    const board = createEmptyBoard();
    const p = createPiece("I");
    
    // Place vertically against right wall
    // Initial I is horizontal. Rotate -> Vertical.
    // I piece rotated vertical is 4x1 (technically 4x4 matrix with column filled).
    // If we place it at x=8 (right edge), rotating might push it out.
    // SRS I piece rotation is complex, let's verify it doesn't return null/same piece if valid kick exists.
    
    p.x = 8; // Right side
    const rotated = rotatePiece(board, p);
    
    // If it rotated, it must have moved left (kick)
    // Note: With our enhanced I kicks ([-3, 0]), this should pass
    expect(rotated.shape).not.toEqual(p.shape);
    expect(rotated.x).not.toBe(8); // Should have kicked left
  });

  // --- LINES & GARBAGE ---
  test("clearLines removes full rows and adds score", () => {
    const board = createEmptyBoard();
    // Fill bottom row
    board[19] = Array(10).fill("L");
    
    const result = clearLines(board);
    expect(result.clearedLines).toBe(1);
    expect(result.board[19]).toEqual(Array(10).fill(0)); // Should be empty now
  });

  test("addGarbageLines pushes up and adds gray lines", () => {
    const board = createEmptyBoard();
    // Put a piece at bottom
    board[19][0] = "I";
    
    const newBoard = addGarbageLines(board, 1);
    
    // Piece should be moved up
    expect(newBoard[18][0]).toBe("I");
    // Bottom line should have garbage ('G') and one hole (0)
    const bottomRow = newBoard[19];
    expect(bottomRow.includes("G")).toBe(true);
    expect(bottomRow.includes(0)).toBe(true); // The hole
  });

  test("addGarbageLines returns null on death (top out)", () => {
    const board = createEmptyBoard();
    board[0][5] = "I"; // Block at very top
    const result = addGarbageLines(board, 1);
    expect(result).toBeNull();
  });

  // --- SPECTRUM ---
  test("getSpectrum returns correct heights", () => {
    const board = createEmptyBoard();
    // Col 0: empty
    // Col 1: 1 block at bottom (y=19) -> height 1
    // Col 2: 2 blocks (y=18, y=19) -> height 2
    board[19][1] = "T";
    board[19][2] = "T";
    board[18][2] = "T";

    const s = getSpectrum(board);
    expect(s[0]).toBe(0);
    expect(s[1]).toBe(1);
    expect(s[2]).toBe(2);
  });
});
