import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function JoinName() {
  const { room } = useParams();
  const [playerName, setPlayerName] = useState("");
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <div className="content-box">

        <h1 className="title">Joining: {room}</h1>

        <input
          className="form-input"
          placeholder="Your name"
          maxLength={12}
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />

        <button
          className="form-button"
          disabled={!playerName}
          onClick={() => navigate(`/${room}/${playerName}`)}
        >
          JOIN LOBBY
        </button>

      </div>
    </div>
  );
}
