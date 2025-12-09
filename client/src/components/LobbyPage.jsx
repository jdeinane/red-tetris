import { useParams } from "react-router-dom";

export default function LobbyPage({ socket, players, gameRunning }) {
  const { room, player } = useParams();

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
        gameRunning ? (
          <button className="form-button" disabled style={{ opacity: 0.5, cursor: "wait" }}>
            Game is still running...
          </button>
        ) : players.length < 2 ? (
          <button className="form-button" disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>
            Waiting for players...
          </button>
        ) : (
          <button 
            className="form-button"
            onClick={() => socket.emit("start-game", { room })}
          >
            Start Game
          </button>
        )
      )}

      {!isHost && gameRunning && (
          <p style={{ color: "#aaa", marginTop: "20px" }}>
              Waiting for game to finish...
          </p>
      )}
    </div>
  );
}