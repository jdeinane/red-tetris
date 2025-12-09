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

        <input
          className="form-input"
          placeholder="Your name"
          maxLength={12}
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />

        <p style={{ marginTop: "15px", marginBottom: "8px" }}>Max players:</p>
        
        <div className="max-players-row">
          {[2, 3, 4].map((num) => (
            <button
              key={num}
              type="button"
              className={
                "form-button max-player-button" +
                (maxPlayers === num ? " max-player-button-selected" : "")
              }
              onClick={() => setMaxPlayers(num)}
            >
              {num}
            </button>
          ))}
        </div>

        <button
          className="form-button"
          disabled={!lobbyName || !playerName}
          onClick={handleCreate}
          style={{ marginTop: "20px" }}
        >
          CREATE
        </button>
      </div>
    </div>
  );
}