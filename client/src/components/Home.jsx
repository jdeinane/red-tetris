import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import LeaderboardModal from "./LeaderboardModal";

export default function Home({ socket, player, setPlayer }) {
  const navigate = useNavigate();
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  return (
    <div className="page-container">
      <div className="content-box">
        <h1 className="title">pink tetris</h1>
        <button className="form-button" onClick={() => navigate("/play")}>
          Play !
        </button>

		<button 
            className="btn" 
            style={{ filter: 'hue-rotate(45deg)' }}
            onClick={() => setShowLeaderboard(true)}
          >
            🏆 Leaderboard
          </button>
      </div>
      {showLeaderboard && (
        <LeaderboardModal 
            socket={socket} 
            onClose={() => setShowLeaderboard(false)} 
        />
      )}
    </div>
  );
}
