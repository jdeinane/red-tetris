import React from "react";
import { useNavigate } from "react-router-dom";

export default function JoinLobby() {
  const navigate = useNavigate();

  // Dummy sample lobbies
  const lobbies = [
    { name: "SnowTetris", current: 1, max: 4 },
    { name: "WinterRoom", current: 3, max: 3 },
    { name: "HolidayFun", current: 2, max: 4 },
  ];

  return (
    <div className="page-container">
      <div className="content-box">
        <h1 className="title">Join a Lobby</h1>

        {lobbies.map((lob) => (
          <div key={lob.name} style={{ marginBottom: "15px" }}>
            <p>
              ❄ {lob.name} — {lob.current}/{lob.max}
            </p>

            {lob.current < lob.max ? (
              <button
                className="form-button"
                onClick={() => navigate(`/multi/join/${lob.name}`)}
              >
                JOIN
              </button>
            ) : (
              <button className="form-button" disabled>
                FULL
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
