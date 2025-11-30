import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function LobbyPage({ socket, players }) {
  const { room, player } = useParams();
  const navigate = useNavigate();

  const me = players.find(p => p.username === player);
  const isHost = me?.isHost;

  return (
    <div>
      <h1>Lobby — Room: {room}</h1>
      <h2>Player: {player} {isHost && "(HOST)"}</h2>

      <h3>Players:</h3>
      <ul>
        {players.map((p) => (
          <li key={p.id}>
            {p.username} {p.isHost ? "(HOST)" : ""}
          </li>
        ))}
      </ul>

      {isHost && (
        <button onClick={() => socket.emit("start-game", { room })}>
          Start Game
        </button>
      )}
    </div>
  );
}
