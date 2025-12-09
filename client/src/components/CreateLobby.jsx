import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateLobby() {
  const [lobbyName, setLobbyName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [playerName, setPlayerName] = useState("");
  const navigate = useNavigate();

  function handleCreate() {
    localStorage.setItem("maxPlayers", maxPlayers);
    navigate(`/${lobbyName}/${playerName}`);
  }

  return (
    <div className="page-container">
      <div className="content-box">
        <h1 className="title">Create Lobby</h1>

        <input
          className="form-input"
          placeholder="Lobby name"
          value={lobbyName}
          onChange={(e) => setLobbyName(e.target.value)}
        />

        <p style={{ marginTop: "15px" }}>Max players:</p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          {[2, 3, 4].map((num) => (
            <button
              key={num}
              className="form-button"
              onClick={() => setMaxPlayers(num)}
            >
              {num}
            </button>
          ))}
        </div>

        <input
          className="form-input"
          placeholder="Your name"
          maxLength={12}
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />

        <button
          className="form-button"
          disabled={!lobbyName || !playerName}
          onClick={handleCreate}
        >
          CREATE
        </button>
      </div>
    </div>
  );
}
