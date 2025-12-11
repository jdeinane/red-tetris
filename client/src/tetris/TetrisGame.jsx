import { useEffect, useState, useRef } from "react";
import Board from "./Board";
import NextPiece from "./NextPiece";
import HoldPiece from "./HoldPiece";
import SpectrumView from "../components/SpectrumView.jsx";
import GameOverModal from "../components/GameOverModal.jsx";

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
  hasCollision,
} from "../../../shared/tetris.js";

export default function TetrisGame({
	sequence,
	spawn,
	spectrums = {},
	socket,
	room,
	player,
	endGame,
  onRestart,
  onExit,
  isSolo, }) {

	/* States and Refs */

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
  const lockResetRef = useRef(0);
  const MAX_LOCK_RESETS = 15;

  const keyStateRef = useRef({
    left: false,
    right: false,
    down: false,
    rotateHeld: false,
  });

  const moveTimeoutRef = useRef(null);
  const moveRepeatRef = useRef(null);

  const rafRef = useRef(null);

  const fallInterval = 500;
  const lockDelay = 500;

  const garbageRef = useRef(0);


	/* Helpers */

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

  // --- SPAWN PIECE ---

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
    const newPiece = createPiece(type, spawn);

	if (hasCollision(boardRef.current, newPiece)) {
		isGameOverRef.current = true;
		setIsGameOver(true);
		notifyGameOver();
		return;
	}

    syncPiece(newPiece);
    lockStartRef.current = null;
    lockResetRef.current = 0;
  }

  /* Server Events */

  function notifyLinesCleared(clearedLines) {
    if (!clearedLines) return;
    if (!socket) return;

    socket.emit("lines-cleared", {
      room,
      player,
      count: clearedLines,
    });
  }

  function notifyGameOver() {
    if (!socket) return;

    socket.emit("player-game-over", {
      room,
      player,
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

  }


  function resetLockTimer() {
    if (lockResetRef.current < MAX_LOCK_RESETS) {
      lockStartRef.current = null;
      lockResetRef.current++;
    }
  }

  // --- AUTO MOVE (DAS/ARR) ---

  function startAutoMove(direction) {
    if (!pieceRef.current)
      return;

    clearTimeout(moveTimeoutRef.current);
    clearInterval(moveRepeatRef.current);

    const initial = movePiece(boardRef.current, pieceRef.current, direction, 0);
    if (initial !== pieceRef.current) {
      syncPiece(initial);
      resetLockTimer();
    }

    moveTimeoutRef.current = setTimeout(() => {
      moveRepeatRef.current = setInterval(() => {
        const moved = movePiece(boardRef.current, pieceRef.current, direction, 0);
        if (moved !== pieceRef.current) {
          syncPiece(moved);
          resetLockTimer();
        }
      }, 50);
    }, 150);
  }

  /* Key Input */

  useEffect(() => {
    function rotateOnce() {
      if (!pieceRef.current || isGameOverRef.current) return;
      const p = pieceRef.current;
      const rotated = rotatePiece(boardRef.current, p);
      if (rotated !== p) {
        syncPiece(rotated);
        resetLockTimer();
      }
    }

    function onKeyDown(e) {
      if (isGameOverRef.current || !pieceRef.current) return;

      if (e.key === "ArrowLeft") {
        if (!pieceRef.current) return;
        keyStateRef.current.left = true;
        startAutoMove(-1);
      } else if (e.key === "ArrowRight") {
        if (!pieceRef.current) return;
        keyStateRef.current.right = true;
        startAutoMove(1);
      } else if (e.key === "ArrowDown") {
        if (!pieceRef.current) return;
        keyStateRef.current.down = true;
        const moved = movePiece(boardRef.current, pieceRef.current, 0, 1);
        if (moved !== pieceRef.current) {
          syncPiece(moved);
          resetLockTimer();
        }
      } else if (e.key === "ArrowUp") {
        if (!keyStateRef.current.rotateHeld) {
          rotateOnce();
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
      }
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // --- GRAVITY LOOP ---

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
        if (moved !== p) {
          syncPiece(moved);
          lockStartRef.current = null;
        }
      }

      if (p && hasCollision(boardRef.current, p, 0, 1)) {
        
        if (lockStartRef.current === null) {
            lockStartRef.current = now;
        } 
        
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
        if (lockStartRef.current !== null) {
            lockStartRef.current = null;
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [sequence, isGameOver]);

	// --- GARBAGE HANDLING ---

  useEffect(() => {
    function handleGarbage(e) {
      garbageRef.current += e.detail;
    }

    window.addEventListener("add-garbage", handleGarbage);
    return () => window.removeEventListener("add-garbage", handleGarbage);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (garbageRef.current > 0 && !isGameOverRef.current) {
        const linesToAdd = garbageRef.current;
        const updated = addGarbageLines(
          boardRef.current,
          linesToAdd
        );

        if (updated === null) {
          garbageRef.current = 0;
          isGameOverRef.current = true;
          setIsGameOver(true);
          notifyGameOver();
          return;
        }
  
        if (pieceRef.current) {
          const adjustedPiece = {
            ...pieceRef.current,
            y: pieceRef.current.y - linesToAdd
          };
          syncPiece(adjustedPiece);
        }

        garbageRef.current = 0;
        syncBoard(updated);
      }
    }, 50);

    return () => clearInterval(id);
  }, []);

    // --- SPECTRUM UPDATE ---

  useEffect(() => {
    const id = setInterval(() => {
      if (!socket || isGameOverRef.current) return;

      const spectrum = getSpectrum(boardRef.current);

      socket.emit("spectrum-update", {
        room,
        player,
        spectrum,
      });
    }, 300);

    return () => clearInterval(id);
  }, []);

    // --- STOP THE GAME AFTER WINNER ANNOUNCEMENT ---

	useEffect(() => {
	if (endGame) {
		isGameOverRef.current = true;
		cancelAnimationFrame(rafRef.current);
	}
	}, [endGame]);

  /* Restart */

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

	/* Next Piece */

  const nextType =
    sequence && indexRef.current < sequence.length
      ? sequence[indexRef.current]
      : null;

  const safeSpectrums = spectrums || {};


  /* Render */

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

      {/* GAME OVER UI (MODALE SERVEUR) */}
      {endGame && (
        <GameOverModal 
          result={endGame.result}
          winner={endGame.winner}
          onConfirm={onRestart}
          onQuit={onExit}
        />
      )}

      {/* LOCAL GAME OVER (ELIMINATED / SOLO) */}
      {isGameOver && !endGame && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(4px)",
            padding: "40px",
            color: "white",
            borderRadius: "12px",
            textAlign: "center",
            border: "1px solid rgba(255, 0, 0, 0.5)",
            width: "300px",
            zIndex: 10
          }}
        >
          <h1 style={{ 
            color: "#ff4444", 
            textShadow: "0 0 10px rgba(255,0,0,0.5)",
            fontSize: "28px",
            marginBottom: "10px"
          }}>
            {isSolo ? "GAME OVER" : "ELIMINATED"}
          </h1>
          
          {!isSolo && (
            <>
                <div className="loader" style={{ marginBottom: "20px", fontSize: "12px", opacity: 0.8 }}>
                    Waiting for winner...
                </div>
                <p style={{ fontSize: "11px", color: "#aaa", marginBottom: "20px" }}>
                    Watch the spectrums on the right!
                </p>
            </>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
            {isSolo ? (
                <>
                    <button
                        onClick={restartGame}
                        style={{
                            padding: "10px 20px",
                            fontSize: "16px",
                            cursor: "pointer",
                            background: "linear-gradient(90deg, #ff00ff, #00eaff)",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            width: "100%",
                            fontWeight: "bold"
                        }}
                    >
                        RETRY
                    </button>
                    <button
                        onClick={onExit}
                        style={{
                            padding: "8px 16px",
                            fontSize: "14px",
                            cursor: "pointer",
                            background: "transparent",
                            color: "#aaa",
                            border: "1px solid #555",
                            borderRadius: "6px",
                            width: "100%"
                        }}
                    >
                        MAIN MENU
                    </button>
                </>
            ) : (
                <>
                    <button
                        onClick={onRestart}
                        style={{
                            padding: "10px 20px",
                            fontSize: "14px",
                            cursor: "pointer",
                            background: "rgba(255, 255, 255, 0.1)",
                            color: "#ddd",
                            border: "1px solid #555",
                            borderRadius: "6px",
                            transition: "background 0.2s",
                            width: "100%"
                        }}
                        onMouseOver={(e) => e.target.style.background = "rgba(255, 0, 0, 0.3)"}
                        onMouseOut={(e) => e.target.style.background = "rgba(255, 255, 255, 0.1)"}
                    >
                        Leave to Lobby
                    </button>
                    <button
                        onClick={onExit}
                        style={{
                            padding: "8px 16px",
                            fontSize: "12px",
                            cursor: "pointer",
                            background: "transparent",
                            color: "#888",
                            border: "none",
                            textDecoration: "underline"
                        }}
                    >
                        Quit to Main Menu
                    </button>
                </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
