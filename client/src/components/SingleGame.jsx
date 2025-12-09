import TetrisGame from "../tetris/TetrisGame";
import { generateSequence } from "../../../shared/pieces.js";
import { useNavigate } from "react-router-dom";

export default function SingleGame() {
  const navigate = useNavigate();
  const sequence = generateSequence(10000);

  return (
    <div>
      <h1>Singleplayer</h1>
      <TetrisGame 
        sequence={sequence}
        isSolo={true}
        onExit={() => navigate("/")}
      />
    </div>
  );
}
