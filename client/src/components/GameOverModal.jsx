import React from "react";

export default function GameOverModal({ isWinner, onRestart, onHome }) {
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>{isWinner ? "YOU WIN!" : "GAME OVER"}</h2>

        <div className="modal-buttons">
          <button onClick={onRestart}>Restart</button>
          <button onClick={onHome}>Home</button>
        </div>
      </div>
    </div>
  );
}
