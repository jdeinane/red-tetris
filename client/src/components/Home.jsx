import React from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <div className="content-box">
        <h1 className="title">pink tetris</h1>
        <button className="form-button" onClick={() => navigate("/play")}>
          Play !
        </button>
      </div>
    </div>
  );
}
