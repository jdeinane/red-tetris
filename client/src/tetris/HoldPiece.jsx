import "./nextpiece.css";
import { PIECE_SHAPES } from "../../../shared/pieces.js";

export default function HoldPiece({ type }) {
  if (!type) {
    return (
      <div className="next-container">
        <h3>Hold</h3>
        <div className="next-grid">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="next-cell next-empty" />
          ))}
        </div>
      </div>
    );
  }

  const shape = PIECE_SHAPES[type];

  const grid = Array.from({ length: 4 }, () => Array(4).fill(0));

  const offsetX = Math.floor((4 - shape[0].length) / 2);
  const offsetY = Math.floor((4 - shape.length) / 2);

  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x]) {
        grid[y + offsetY][x + offsetX] = type;
      }
    }
  }

  return (
    <div className="next-container">
      <h3>Hold</h3>
      <div className="next-grid">
        {grid.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              className={`next-cell next-${cell || "empty"}`}
            />
          ))
        )}
      </div>
    </div>
  );
}
