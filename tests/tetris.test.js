import {
  createEmptyBoard,
  createPiece,
  movePiece,
  hardDrop,
  clearLines,
  getSpectrum
} from "../shared/tetris.js";

describe("Tetris shared logic", () => {
  test("createEmptyBoard generates a 20x10 grid", () => {
    const b = createEmptyBoard();
    expect(b.length).toBe(20);
    expect(b[0].length).toBe(10);
  });

  test("createPiece places piece at center spawn", () => {
    const p = createPiece("I");
    expect(p.x).toBeGreaterThanOrEqual(3);
  });

  test("movePiece moves correctly", () => {
    const b = createEmptyBoard();
    const p = createPiece("T");
    const moved = movePiece(b, p, 1, 0);
    expect(moved.x).toBe(p.x + 1);
  });

  test("hardDrop should reach lowest point", () => {
    const b = createEmptyBoard();
    const p = createPiece("O");
    const d = hardDrop(b, p);
    expect(d.y).toBeGreaterThan(10);
  });

  test("clearLines removes full rows", () => {
    let b = createEmptyBoard();
    b[19] = Array(10).fill("T");

    const { clearedLines } = clearLines(b);
    expect(clearedLines).toBe(1);
  });

  test("getSpectrum works", () => {
    let b = createEmptyBoard();
    b[19][0] = "T";
    const s = getSpectrum(b);
    expect(s[0]).toBe(1);
  });
});
