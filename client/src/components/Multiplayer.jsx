import React from "react";
import { useNavigate } from "react-router-dom";

export default function Multiplayer() {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <div className="content-box">
        <h1 className="title">Multiplayer</h1>

        <button className="form-button" onClick={() => navigate("/multi/create")}>
          Create a Lobby
        </button>

        <button className="form-button" onClick={() => navigate("/multi/join")}>
          Join a Lobby
        </button>
      </div>
    </div>
  );
}
