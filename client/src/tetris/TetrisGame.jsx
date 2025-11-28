import { useEffect, useState } from "react";
import Board from "./Board";
import NextPiece from "./NextPiece";
import HoldPiece from "./HoldPiece";
import {
  createEmptyBoard,
  createPiece,
  tick,
  movePiece,
  rotatePiece,
  hardDrop,
  getGhostPiece,
} from "../../../shared/tetris.js";

/* Main game loop */

export default function TetrisGame({ sequence }) {
  const [board, setBoard] = useState(createEmptyBoard());
  const [activePiece, setActivePiece] = useState(null);
  const [index, setIndex] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  // HOLD
  const [holdType, setHoldType] = useState(null);
  const [canHold, setCanHold] = useState(true);

  // Spawn new piece
  function spawnPiece() {
    const nextType = sequence[index];
    const newPiece = createPiece(nextType);

    setActivePiece(newPiece);
    setIndex((i) => i + 1);
  }

  // Initial spawn
  useEffect(() => {
    if (!activePiece && sequence && !isGameOver) {
      spawnPiece();
    }
  }, [activePiece, sequence, isGameOver]);

  // Game loop
  useEffect(() => {
    if (isGameOver) return;

    const interval = setInterval(() => {
      if (!activePiece) return;

      const result = tick(board, activePiece);

      if (result.locked) {
        const newBoard = result.board;

        // GAME OVER
        const topRowHasBlocks = newBoard[0].some((cell) => cell !== 0);

        setBoard(newBoard);

        if (topRowHasBlocks) {
          setIsGameOver(true);
          setActivePiece(null);
          return;
        }

        setActivePiece(null);
        setCanHold(true);
      } else {
        setActivePiece(result.activePiece);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [activePiece, board, isGameOver]);

  // HOLD LOGIC
  function handleHold() {
    if (!activePiece || !canHold || isGameOver) return;

    setCanHold(false);

    if (holdType === null) {
      setHoldType(activePiece.type);
      spawnPiece();
      return;
    }

    const swappedPiece = createPiece(holdType);
    setHoldType(activePiece.type);
    setActivePiece(swappedPiece);
  }

  // Keyboard
  useEffect(() => {
    if (!activePiece || isGameOver) return;

    function handleKey(e) {
      if (e.key === "ArrowLeft")
        setActivePiece((p) => movePiece(board, p, -1, 0));

      if (e.key === "ArrowRight")
        setActivePiece((p) => movePiece(board, p, 1, 0));

      if (e.key === "ArrowDown")
        setActivePiece((p) => movePiece(board, p, 0, 1));

      if (e.key === "ArrowUp")
        setActivePiece((p) => rotatePiece(board, p));

      if (e.code === "Space")
        setActivePiece((p) => hardDrop(board, p));

      if (e.key === "Shift") handleHold();
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activePiece, board, isGameOver, canHold, holdType]);

  // Restart game
  function restartGame() {
    setBoard(createEmptyBoard());
    setActivePiece(null);
    setIndex(0);
    setHoldType(null);
    setCanHold(true);
    setIsGameOver(false);
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        gap: "40px",
        position: "relative",
      }}
    >
      <HoldPiece type={holdType} />

      <Board
        board={board}
        activePiece={activePiece}
        ghostPiece={activePiece ? getGhostPiece(board, activePiece) : null}
      />

      <NextPiece type={sequence[index]} />

      {isGameOver && (
        <div
          style={{
            position: "absolute",
            top: "35%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(0,0,0,0.85)",
            padding: "40px",
            color: "white",
            borderRadius: "12px",
            textAlign: "center",
            fontSize: "32px",
            width: "300px",
          }}
        >
          <h1>GAME OVER</h1>
          <button
            onClick={restartGame}
            style={{
              padding: "12px 25px",
              fontSize: "18px",
              cursor: "pointer",
              background: "#ff69b4",
              color: "white",
              border: "none",
              borderRadius: "8px",
            }}
          >
            Restart
          </button>
        </div>
      )}
    </div>
  );
}
