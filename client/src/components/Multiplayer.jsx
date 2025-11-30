import React from "react";
import { useNavigate } from "react-router-dom";

export default function Multiplayer() {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <div className="content-box">
        <h1 className="title">Multiplayer</h1>

        <button className="form-button" onClick={() => navigate("/multi/create")}>
          CREATE A LOBBY
        </button>

        <button className="form-button" onClick={() => navigate("/multi/join")}>
          JOIN A LOBBY
        </button>
      </div>
    </div>
  );
}
