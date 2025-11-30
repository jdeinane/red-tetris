import React from "react";
import { useNavigate } from "react-router-dom";

export default function Play() {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <div className="content-box">
        <h1 className="title">Play</h1>

        <button className="form-button" onClick={() => navigate("/single")}>
          SINGLEPLAYER
        </button>

        <button className="form-button" onClick={() => navigate("/multi")}>
          MULTIPLAYER
        </button>
      </div>
    </div>
  );
}
