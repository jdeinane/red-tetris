import React from "react";

export default function PlayerList({ players }) {
  return (
    <div className="player-list">
      <h3>Players in room:</h3>
      <ul>
        {players.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </div>
  );
}
