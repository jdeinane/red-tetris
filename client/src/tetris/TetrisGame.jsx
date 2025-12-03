import { useEffect, useState, useRef } from "react";
import Board from "./Board";
import NextPiece from "./NextPiece";
import HoldPiece from "./HoldPiece";
import { getSpectrum } from "../../../shared/tetris.js";
import SpectrumView from "../components/SpectrumView.jsx";

import {
  createEmptyBoard,
  createPiece,
  tick,
  movePiece,
  rotatePiece,
  hardDrop,
  getGhostPiece,
  addGarbageLines,
} from "../../../shared/tetris.js";

/* Main game loop */

export default function TetrisGame({ sequence, spectrums = {} }) {
  const [board, setBoard] = useState(createEmptyBoard());
  const [activePiece, setActivePiece] = useState(null);
  const [index, setIndex] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [inputLocked, setInputLocked] = useState(false);
  const garbageRef = useRef(0);

  // HOLD
  const [holdType, setHoldType] = useState(null);
  const [canHold, setCanHold] = useState(true);

  function spawnPiece() {
    if (!sequence) return;

    if (index >= sequence.length) {
      setIsGameOver(true);
      return;
    }

    const nextType = sequence[index];
    const newPiece = createPiece(nextType);

    setActivePiece(newPiece);
    setIndex((i) => i + 1);
  }

  useEffect(() => {
    if (!sequence || isGameOver) return;

    if (!activePiece) {
      spawnPiece();
    }
  }, [activePiece, sequence, isGameOver, index]);

  useEffect(() => {
    if (isGameOver) return;

    const interval = setInterval(() => {
      if (!activePiece) return;

      const result = tick(board, activePiece);

      if (result.locked) {
        const newBoard = result.board;

        if (result.clearedLines > 0 && window.socket) {
          window.socket.emit("lines-cleared", {
            room: window.currentRoom,
            player: window.currentPlayer,
            count: result.clearedLines,
          });
        }

        setBoard(newBoard);

        const topRowHasBlocks = newBoard[0].some((cell) => cell !== 0);
        if (topRowHasBlocks) {
          setIsGameOver(true);
          setActivePiece(null);

          if (window.socket) {
            window.socket.emit("player-game-over", {
              room: window.currentRoom,
              player: window.currentPlayer,
            });
          }

          return;
        }

        setInputLocked(true);
        setActivePiece(null);
        setTimeout(() => setInputLocked(false), 50);

        setCanHold(true);
      } else {
        setActivePiece(result.activePiece);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [activePiece, board, isGameOver]);

  useEffect(() => {
    const id = setInterval(() => {
      if (garbageRef.current > 0) {
        setBoard((prev) => addGarbageLines(prev, garbageRef.current));
        garbageRef.current = 0;
      }
    }, 50);

    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (!window.socket || isGameOver) return;

      const spectrum = getSpectrum(board);

      window.socket.emit("spectrum-update", {
        room: window.currentRoom,
        player: window.currentPlayer,
        spectrum,
      });
    }, 300);

    return () => clearInterval(id);
  }, [board, isGameOver]);

  useEffect(() => {
    function handleGarbage(e) {
      garbageRef.current += e.detail;
    }

    window.addEventListener("add-garbage", handleGarbage);
    return () => window.removeEventListener("add-garbage", handleGarbage);
  }, []);

  // HOLD
  function handleHold() {
    if (!activePiece || !canHold || isGameOver) return;

    setCanHold(false);

    if (holdType === null) {
      setHoldType(activePiece.type);
      setActivePiece(null);
      spawnPiece();
      return;
    }

    const swappedPiece = createPiece(holdType);

    setHoldType(activePiece.type);
    setActivePiece(swappedPiece);
  }

  useEffect(() => {
    function handleKey(e) {
      if (inputLocked || !activePiece || isGameOver) return;

      if (e.key === "ArrowLeft") {
        setActivePiece((p) => (p ? movePiece(board, p, -1, 0) : p));
      } else if (e.key === "ArrowRight") {
        setActivePiece((p) => (p ? movePiece(board, p, 1, 0) : p));
      } else if (e.key === "ArrowDown") {
        setActivePiece((p) => (p ? movePiece(board, p, 0, 1) : p));
      } else if (e.key === "ArrowUp") {
        setActivePiece((p) => (p ? rotatePiece(board, p) : p));
      } else if (e.code === "Space") {
        setActivePiece((p) => (p ? hardDrop(board, p) : p));
      } else if (e.key === "Shift") {
        handleHold();
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [board, activePiece, isGameOver, inputLocked, canHold, holdType]);

  function restartGame() {
    setBoard(createEmptyBoard());
    setActivePiece(null);
    setIndex(0);
    setHoldType(null);
    setCanHold(true);
    setIsGameOver(false);
    setInputLocked(false);
  }

  const nextType = index < sequence.length ? sequence[index] : null;
  const safeSpectrums = spectrums || {};

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
      {/* HOLD */}
      <HoldPiece type={holdType} />

      {/* BOARD */}
      <Board
        board={board}
        activePiece={activePiece}
        ghostPiece={activePiece ? getGhostPiece(board, activePiece) : null}
      />

      {/* NEXT */}
      <NextPiece type={nextType} />

      {/* SPECTRUM */}
      <div
        style={{
          position: "absolute",
          right: "-150px",
          top: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {Object.entries(safeSpectrums).map(([name, spect]) => (
          <SpectrumView key={name} name={name} spectrum={spect} />
        ))}
      </div>

      {/* GAME OVER UI */}
      {isGameOver && (
        <div
          style={{
            position: "absolute",
            top: "35%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(0, 0, 0, 0.85)",
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
