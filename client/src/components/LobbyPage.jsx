import { useParams } from "react-router-dom";

export default function LobbyPage({ socket, players, gameRunning }) {
  const { room, player } = useParams();

  const me = players.find(p => p.username === player);
  const isHost = me?.isHost;
  const allReady = players.every(p => p.ready);
  const canStart = players.length >= 2 && allReady;

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
              <span>
                {p.username}
                {!p.ready && <span style={{fontSize: "0.8em", color: "orange", marginLeft: "10px"}}>(In Results...)</span>}
                {p.ready && <span style={{fontSize: "0.8em", color: "#4ade80", marginLeft: "10px"}}>✓</span>}
              </span>
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
            ) : !canStart ? (
              <button className="form-button" disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>
                {players.length < 2 ? "Waiting for players..." : "Waiting for everyone..."}
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
