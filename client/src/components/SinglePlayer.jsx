import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Singleplayer() {
  const [name, setName] = useState("");
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <div className="content-box">
        <h1 className="title">Singleplayer</h1>

        <input
          className="form-input"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button
          className="form-button"
          disabled={!name}
          onClick={() => navigate("/game")}
        >
          GO!
        </button>
      </div>
    </div>
  );
}
