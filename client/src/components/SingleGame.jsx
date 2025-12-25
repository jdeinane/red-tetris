import TetrisGame from "../tetris/TetrisGame";
import { generateSequence } from "../../../shared/pieces.js";
import { useNavigate } from "react-router-dom";
import { useState } from "react"

export default function SingleGame() {
  const navigate = useNavigate();
  const [gameId, setGameId] = useState(0);
  const sequence = generateSequence(10000);
  const handleRestart = () => {
    setGameId((prev) => prev + 1);
  };

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      width: "100%" 
    }}>
      <h1 className="title" style={{ marginBottom: "20px" }}>Solo Game</h1>
      
      <TetrisGame
        key={gameId}
        sequence={sequence}
        isSolo={true}
        onRestart={handleRestart}
        onExit={() => navigate("/")}
      />
    </div>
  );
}