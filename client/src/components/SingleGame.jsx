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
    <div>
      <h1>Singleplayer</h1>
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
