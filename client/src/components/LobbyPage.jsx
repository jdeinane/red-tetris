import { useParams } from "react-router-dom";

export default function LobbyPage({ socket, players, gameRunning }) {
  const { room, player } = useParams();

  const me = players.find(p => p.username === player);
  const isHost = me?.isHost;

  return (
    <div className="page-container">
      <div className="content-box">
        <h1 className="title">Lobby : {room}</h1>
        
        <div style={{ marginBottom: "20px", color: "var(--text-secondary)" }}>
           You are: <strong style={{ color: "white" }}>{player}</strong> {isHost && "(HOST)"}
        </div>

        <h3 style={{ alignSelf: "flex-start", fontSize: "1rem" }}>Players ({players.length})</h3>
        
        <ul>
          {players.map((p) => (
            <li key={p.id}>
              <span>{p.username}</span>
              {p.isHost && <span style={{ opacity: 0.5, fontSize: "0.8em" }}>👑 HOST</span>}
            </li>
          ))}
        </ul>

        <div style={{ marginTop: "20px", width: "100%" }}>
          {isHost && (
            gameRunning ? (
              <button className="form-button" disabled style={{ opacity: 0.5, cursor: "wait" }}>
                Game in progress...
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
                START GAME
              </button>
            )
          )}

          {!isHost && (
             <p style={{ marginTop: "15px", fontStyle: "italic", opacity: 0.7 }}>
                {gameRunning ? "Game is running..." : "Waiting for host to start..."}
             </p>
          )}
        </div>
      </div>
    </div>
  );
}
