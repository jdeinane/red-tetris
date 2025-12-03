import { useEffect, useState, useRef } from "react";
import Board from "./Board";
import NextPiece from "./NextPiece";
import HoldPiece from "./HoldPiece";
import SpectrumView from "../components/SpectrumView.jsx";

import {
  createEmptyBoard,
  createPiece,
  movePiece,
  rotatePiece,
  hardDrop,
  getGhostPiece,
  mergePiece,
  clearLines,
  addGarbageLines,
  getSpectrum,
} from "../../../shared/tetris.js";

export default function TetrisGame({ sequence, spectrums = {} }) {
  const [board, setBoard] = useState(createEmptyBoard());
  const [activePiece, setActivePiece] = useState(null);
  const [index, setIndex] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [holdType, setHoldType] = useState(null);

  const boardRef = useRef(board);
  const pieceRef = useRef(null);
  const indexRef = useRef(0);
  const isGameOverRef = useRef(false);
  const holdTypeRef = useRef(null);
  const canHoldRef = useRef(true);
  const lockStartRef = useRef(null);

  const keyStateRef = useRef({
    left: false,
    right: false,
    down: false,
    rotateHeld: false,
  });

  const rotateTimeoutRef = useRef(null);
  const rotateRepeatRef = useRef(null);

  const moveTimeoutRef = useRef(null);
  const moveRepeatRef = useRef(null);

  const rafRef = useRef(null);
  const fallInterval = 500;
  const lockDelay = 350;

  const garbageRef = useRef(0);

  function syncBoard(newBoard) {
    boardRef.current = newBoard;
    setBoard(newBoard.map((r) => [...r]));
  }

  function syncPiece(p) {
    pieceRef.current = p;
    setActivePiece(p);
  }

  function collision(board, piece) {
    const { shape, x, y } = piece;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const nx = x + c;
        const ny = y + r;
        if (nx < 0 || nx >= board[0].length || ny < 0 || ny >= board.length)
          return true;
        if (board[ny][nx]) return true;
      }
    }
    return false;
  }

  function tryRotate(board, piece) {
    const rotated = rotatePiece(board, piece);
    if (rotated === piece) return piece;
    if (!collision(board, rotated)) return rotated;
    const right = { ...rotated, x: rotated.x + 1 };
    if (!collision(board, right)) return right;
    const left = { ...rotated, x: rotated.x - 1 };
    if (!collision(board, left)) return left;
    return piece;
  }

  function spawnPiece() {
    if (!sequence || isGameOverRef.current) return;
    if (indexRef.current >= sequence.length) {
      isGameOverRef.current = true;
      setIsGameOver(true);
      return;
    }
    const type = sequence[indexRef.current];
    indexRef.current += 1;
    setIndex(indexRef.current);
    syncPiece(createPiece(type));
    lockStartRef.current = null;
  }


  function notifyLinesCleared(clearedLines) {
    if (!clearedLines) return;
    if (!window.socket) return;

    window.socket.emit("lines-cleared", {
      room: window.currentRoom,
      player: window.currentPlayer,
      count: clearedLines,
    });
  }

  function notifyGameOver() {
    if (!window.socket) return;

    window.socket.emit("player-game-over", {
      room: window.currentRoom,
      player: window.currentPlayer,
    });
  }

  // --- HOLD ---

  function handleHold() {
    if (!pieceRef.current || !canHoldRef.current || isGameOverRef.current)
      return;
    if (holdTypeRef.current === null) {
      holdTypeRef.current = pieceRef.current.type;
      setHoldType(holdTypeRef.current);
      syncPiece(null);
      canHoldRef.current = false;
      lockStartRef.current = null;
      return;
    }
    const swapped = createPiece(holdTypeRef.current);
    holdTypeRef.current = pieceRef.current.type;
    setHoldType(holdTypeRef.current);
    syncPiece(swapped);
    canHoldRef.current = false;
    lockStartRef.current = null;
  }

  // --- HARD DROP ---

  function handleHardDrop() {
    if (!pieceRef.current || isGameOverRef.current) return;

    const dropped = hardDrop(boardRef.current, pieceRef.current);
    const withPiece = mergePiece(boardRef.current, dropped);

    const clearResult = clearLines(withPiece);
    const cleaned = clearResult.board;
    const clearedLines = clearResult.clearedLines || 0;

    notifyLinesCleared(clearedLines);

    syncBoard(cleaned);
    syncPiece(null);
    canHoldRef.current = true;
    lockStartRef.current = null;

    if (cleaned[0].some((c) => c !== 0)) {
      isGameOverRef.current = true;
      setIsGameOver(true);
      notifyGameOver();
    }
  }

  // --- AUTO MOVE gauche/droite ---

  function startAutoMove(direction) {
    clearTimeout(moveTimeoutRef.current);
    clearInterval(moveRepeatRef.current);

    const initial = movePiece(boardRef.current, pieceRef.current, direction, 0);
    if (initial !== pieceRef.current) {
      syncPiece(initial);
      lockStartRef.current = null;
    }

    moveTimeoutRef.current = setTimeout(() => {
      moveRepeatRef.current = setInterval(() => {
        const moved = movePiece(boardRef.current, pieceRef.current, direction, 0);
        if (moved !== pieceRef.current) {
          syncPiece(moved);
          lockStartRef.current = null;
        }
      }, 50);
    }, 150);
  }

  useEffect(() => {
    function rotateOnce() {
      if (!pieceRef.current || isGameOverRef.current) return;
      const p = pieceRef.current;
      const rotated = tryRotate(boardRef.current, p);
      if (rotated !== p) {
        syncPiece(rotated);
        lockStartRef.current = null;
      }
    }

    function startRotateDelay() {
      rotateTimeoutRef.current = setTimeout(() => {
        rotateRepeatRef.current = setInterval(() => {
          if (!keyStateRef.current.rotateHeld) return;
          rotateOnce();
        }, 90);
      }, 150);
    }

    function onKeyDown(e) {
      if (isGameOverRef.current || !pieceRef.current) return;

      if (e.key === "ArrowLeft") {
        keyStateRef.current.left = true;
        startAutoMove(-1);
      } else if (e.key === "ArrowRight") {
        keyStateRef.current.right = true;
        startAutoMove(1);
      } else if (e.key === "ArrowDown") {
        keyStateRef.current.down = true;
        const moved = movePiece(boardRef.current, pieceRef.current, 0, 1);
        if (moved !== pieceRef.current) {
          syncPiece(moved);
          lockStartRef.current = null;
        }
      } else if (e.key === "ArrowUp") {
        if (!keyStateRef.current.rotateHeld) {
          rotateOnce();
          startRotateDelay();
        }
        keyStateRef.current.rotateHeld = true;
      } else if (e.code === "Space") {
        handleHardDrop();
      } else if (e.key === "Shift") {
        handleHold();
      }
    }

    function onKeyUp(e) {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        if (e.key === "ArrowLeft") keyStateRef.current.left = false;
        if (e.key === "ArrowRight") keyStateRef.current.right = false;
        clearTimeout(moveTimeoutRef.current);
        clearInterval(moveRepeatRef.current);
      } else if (e.key === "ArrowDown") {
        keyStateRef.current.down = false;
      } else if (e.key === "ArrowUp") {
        keyStateRef.current.rotateHeld = false;
        clearTimeout(rotateTimeoutRef.current);
        clearInterval(rotateRepeatRef.current);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);


  useEffect(() => {
    if (!sequence || isGameOverRef.current) return;

    let lastFall = performance.now();

    function loop() {
      if (isGameOverRef.current) return;

      if (!pieceRef.current) spawnPiece();

      const now = performance.now();
      const p = pieceRef.current;

      if (p && now - lastFall >= fallInterval) {
        lastFall = now;

        const moved = movePiece(boardRef.current, p, 0, 1);

        if (moved === p) {
          if (lockStartRef.current === null) lockStartRef.current = now;
          else if (now - lockStartRef.current >= lockDelay) {
            const merged = mergePiece(boardRef.current, p);
            const clearResult = clearLines(merged);
            const cleaned = clearResult.board;
            const clearedLines = clearResult.clearedLines || 0;

            notifyLinesCleared(clearedLines);

            syncBoard(cleaned);
            syncPiece(null);
            canHoldRef.current = true;
            lockStartRef.current = null;

            if (cleaned[0].some((c) => c !== 0)) {
              isGameOverRef.current = true;
              setIsGameOver(true);
              notifyGameOver();
            }
          }
        } else {
          syncPiece(moved);
          lockStartRef.current = null;
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [sequence, isGameOver]);


  useEffect(() => {
    function handleGarbage(e) {
      garbageRef.current += e.detail;
    }

    window.addEventListener("add-garbage", handleGarbage);
    return () => window.removeEventListener("add-garbage", handleGarbage);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (garbageRef.current > 0) {
        const updated = addGarbageLines(
          boardRef.current,
          garbageRef.current
        );
        garbageRef.current = 0;
        syncBoard(updated);
      }
    }, 50);

    return () => clearInterval(id);
  }, []);


  useEffect(() => {
    const id = setInterval(() => {
      if (!window.socket || isGameOverRef.current) return;

      const spectrum = getSpectrum(boardRef.current);

      window.socket.emit("spectrum-update", {
        room: window.currentRoom,
        player: window.currentPlayer,
        spectrum,
      });
    }, 300);

    return () => clearInterval(id);
  }, []);


  function restartGame() {
    const empty = createEmptyBoard();
    syncBoard(empty);
    syncPiece(null);
    indexRef.current = 0;
    setIndex(0);
    holdTypeRef.current = null;
    setHoldType(null);
    canHoldRef.current = true;
    lockStartRef.current = null;
    isGameOverRef.current = false;
    setIsGameOver(false);
    keyStateRef.current = {
      left: false,
      right: false,
      down: false,
      rotateHeld: false,
    };
  }

  const nextType =
    sequence && indexRef.current < sequence.length
      ? sequence[indexRef.current]
      : null;

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
        ghostPiece={
          activePiece ? getGhostPiece(board, activePiece) : null
        }
      />

      {/* NEXT */}
      <NextPiece type={nextType} />

      {/* SPECTRUM (autres joueurs) */}
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
