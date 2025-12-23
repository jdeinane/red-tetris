import React from "react";

export default function GameOverModal({ result, winner, onConfirm, onQuit }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h1 style={{ 
          color: result === "win" ? "var(--S)" : "var(--Z)", // Vert si victoire, Rouge si défaite
          fontSize: "2.5rem", 
          marginBottom: "10px",
          textShadow: "0 0 15px currentColor"
        }}>
          {result === "win" ? "YOU WIN!" : "GAME OVER"}
        </h1>

        {winner && (
          <p style={{ fontSize: "1.1rem", marginBottom: "30px", color: "var(--text-secondary)" }}>
            Winner: <strong style={{ color: "var(--text-primary)" }}>{winner}</strong>
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {/* Bouton Principal */}
          <button className="btn" onClick={onConfirm}>
            Back to Lobby
          </button>

          {/* Bouton Secondaire (plus discret) */}
          <button 
            className="btn" 
            onClick={onQuit}
            style={{ 
              background: "transparent", 
              border: "1px solid var(--glass-border)", 
              opacity: 0.8 
            }}
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}
