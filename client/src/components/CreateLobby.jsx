import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateLobby() {
  const [lobbyName, setLobbyName] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(2);

  const navigate = useNavigate();

  return (
    <div className="page-container">
      <div className="content-box">

        <h1 className="title">Create Lobby</h1>

        {/* Lobby Name */}
        <input
          className="form-input"
          placeholder="Lobby name"
          value={lobbyName}
          onChange={(e) => setLobbyName(e.target.value)}
        />

        {/* Player Name */}
        <input
          className="form-input"
          placeholder="Your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />

        {/* Max Players */}
        <div className="max-players-group">
          <p>Max players:</p>
          <div className="max-players-buttons">
            {[2, 3, 4].map((num) => (
              <button
                key={num}
                className="form-button"
                onClick={() => setMaxPlayers(num)}
                style={{
                  opacity: maxPlayers === num ? 1 : 0.5
                }}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Create Button */}
        <button
          className="form-button"
          disabled={!lobbyName || !playerName}
          onClick={() => navigate(`/${lobbyName}/${playerName}`)}
        >
          CREATE
        </button>

      </div>
    </div>
  );
}
