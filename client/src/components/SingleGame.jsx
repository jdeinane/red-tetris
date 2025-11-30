import TetrisGame from "../tetris/TetrisGame";
import { generateSequence } from "../../../shared/pieces.js";

export default function SingleGame() {
  const sequence = generateSequence(200);

  return (
    <div>
      <h1>Singleplayer</h1>
      <TetrisGame sequence={sequence} />
    </div>
  );
}
