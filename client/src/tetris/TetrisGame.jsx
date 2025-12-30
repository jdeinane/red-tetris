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

/* GAME STATE
    ----------
    We use Refs for mutable game state (board, piece, timers) inside the game loop 
    to avoid closure staleness issues with setInterval/requestAnimationFrame.
    We use useState only for triggering re-renders (syncBoard, syncPiece).
  */

  const [board, setBoard] = useState(createEmptyBoard());
  const [activePiece, setActivePiece] = useState(null);
  const [index, setIndex] = useState(0);

  const [isGameOver, setIsGameOver] = useState(false);
  const [holdType, setHoldType] = useState(null);

  const [score, setScore] = useState(0);

  // Refs for logic loop access
  const boardRef = useRef(board);
  const pieceRef = useRef(null);
  const indexRef = useRef(0);
  const isGameOverRef = useRef(false);
  const holdTypeRef = useRef(null);
  const canHoldRef = useRef(true); // Prevent infinite holding in one turn

  // Lock Delay Logic (allows sliding piece before lock)
  const lockStartRef = useRef(null);
  const lockResetRef = useRef(0);
  const MAX_LOCK_RESETS = 15;

  // Input Handling
  const keyStateRef = useRef({
    left: false,
    right: false,
    down: false,
    rotateHeld: false,
  });

  const moveTimeoutRef = useRef(null);  // DAS (Delayed Auto Shift)
  const moveRepeatRef = useRef(null);   // ARR (Auto Repeat Rate)

  const rafRef = useRef(null);          // Request Animation Frame ID

  const fallInterval = 500;             // Gravity speed (ms)
  const lockDelay = 500;                // Time before piece locks on floor

  const garbageRef = useRef(0);         // Incoming garbage buffer


	/* Helpers */

  // Syncs Ref (logic) with State (render)
  function syncBoard(newBoard) {
    boardRef.current = newBoard;
    setBoard(newBoard.map((r) => [...r]));
  }

  function syncPiece(p) {
    pieceRef.current = p;
    setActivePiece(p);
  }

  const addScore = (lines) => {
	if (lines === 0)
		return;

	const points = [0, 100, 300, 500, 800];
	setScore(prev => prev + (points[lines] || 0));
  };

  /* GAME LOGIC */

  // Spawns the next piece from the sequence
  function spawnPiece() {
    if (!sequence || isGameOverRef.current) return;

    // Check if we ran out of pieces
    if (indexRef.current >= sequence.length) {
      isGameOverRef.current = true;
      setIsGameOver(true);
      return;
    }

    const type = sequence[indexRef.current];
    indexRef.current += 1;
    setIndex(indexRef.current);

    let newPiece = createPiece(type, spawn);

    // Immediate collision on spawn = Game Over
    if (hasCollision(boardRef.current, newPiece)) {
	  const liftedPiece = { ...newPiece, y: newPiece.y - 1 };
		if (hasCollision(boardRef.current, liftedPiece)) {
			isGameOverRef.current = true;
			setIsGameOver(true);
			notifyGameOver();
			return;
		} else {
			newPiece = liftedPiece;
		}
    }

    syncPiece(newPiece);
    lockStartRef.current = null;
    lockResetRef.current = 0;
    }

/* SERVER COMMUNICATION */

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
    if (!socket || !room || !player) return;

    console.log("Sending Game Over for:", player, "in room:", room);
    socket.emit("player-game-over", {
      room,
      player,
    });
  }

  // --- HOLD MECHANIC ---
  function handleHold() {
    if (!pieceRef.current || !canHoldRef.current || isGameOverRef.current)
      return;
    if (holdTypeRef.current === null) {
      // First hold: Store piece, spawn next
      holdTypeRef.current = pieceRef.current.type;
      setHoldType(holdTypeRef.current);
      syncPiece(null); // will trigger spawn in loop
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

    // Calculate drop position
    const dropped = hardDrop(boardRef.current, pieceRef.current);
    const withPiece = mergePiece(boardRef.current, dropped);

    // Clear lines
    const clearResult = clearLines(withPiece);
    const cleaned = clearResult.board;
    const clearedLines = clearResult.clearedLines || 0;

    // Send malus
    notifyLinesCleared(clearedLines);
	addScore(clearedLines);

    // Update game state
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

  /* INPUT HANDLING (DAS/ARR) */
  // Allows smooth movement when holding a key
  function startAutoMove(direction) {
    if (!pieceRef.current)
      return;

    clearTimeout(moveTimeoutRef.current);
    clearInterval(moveRepeatRef.current);

    // Initial move
    const initial = movePiece(boardRef.current, pieceRef.current, direction, 0);
    if (initial !== pieceRef.current) {
      syncPiece(initial);
      resetLockTimer();
    }

    // Start auto-repeat after delay
    moveTimeoutRef.current = setTimeout(() => {
      moveRepeatRef.current = setInterval(() => {
        const moved = movePiece(boardRef.current, pieceRef.current, direction, 0);
        if (moved !== pieceRef.current) {
          syncPiece(moved);
          resetLockTimer();
        }
      }, 50); // Speed of repetition
    }, 150);  // Delay before repetition
  }


  /* KEY LISTENERS */
  useEffect(() => {
    function rotateOnce() {
      if (!pieceRef.current || isGameOverRef.current) return;
      const p = pieceRef.current;
      // rotatePiece handles Wall Kicks internally
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


  /* MAIN GAME LOOP (GRAVITY) */
  useEffect(() => {
    if (!sequence || isGameOverRef.current) return;

    let lastFall = performance.now();

    function loop() {
      if (isGameOverRef.current) return;

      if (!pieceRef.current) spawnPiece();

      const now = performance.now();
      const p = pieceRef.current;

      // Gravity Fall
      if (p && now - lastFall >= fallInterval) {
        lastFall = now;
        const moved = movePiece(boardRef.current, p, 0, 1);
        if (moved !== p) {
          syncPiece(moved);
          lockStartRef.current = null; // Reset lock if fell
        }
      }

      // Lock Logic (if collision below)
      if (p && hasCollision(boardRef.current, p, 0, 1)) {
        if (lockStartRef.current === null) {
            lockStartRef.current = now; // Start lock timer
        } 
        
        else if (now - lockStartRef.current >= lockDelay) {
            // Timer expired -> Lock Piece
            const merged = mergePiece(boardRef.current, p);
            const clearResult = clearLines(merged);
            const cleaned = clearResult.board;
            const clearedLines = clearResult.clearedLines || 0;

            notifyLinesCleared(clearedLines);
			addScore(clearedLines);

            syncBoard(cleaned);
            syncPiece(null);
            canHoldRef.current = true;
            lockStartRef.current = null;
        }
      } else {
        // No collision below, reset lock timer
        if (lockStartRef.current !== null) {
            lockStartRef.current = null;
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [sequence, isGameOver, socket, room, player]);


  /* GARBAGE HANDLING */
  // Receives garbage via custom event (from GamePage socket listener)
  useEffect(() => {
    function handleGarbage(e) {
      garbageRef.current += e.detail;
    }

    window.addEventListener("add-garbage", handleGarbage);
    return () => window.removeEventListener("add-garbage", handleGarbage);
  }, []);

  // Apply garbage periodically (not instantly to avoid weird glitches)
  useEffect(() => {
    const id = setInterval(() => {
      if (garbageRef.current > 0 && !isGameOverRef.current) {
        const linesToAdd = garbageRef.current;
        const updated = addGarbageLines(
          boardRef.current,
          linesToAdd
        );

        if (updated === null) {
          // Garbage pushed player out of bounds -> Loss
          garbageRef.current = 0;
          isGameOverRef.current = true;
          setIsGameOver(true);
          notifyGameOver();
          return;
        }
  
        // Adjust active piece Y position if board moved up
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


  /* SPECTRUM UPDATE */
  // Send board state to server periodically
  useEffect(() => {
    const id = setInterval(() => {
      if (!socket || isGameOverRef.current) return;

      const spectrum = getSpectrum(boardRef.current);

      socket.emit("spectrum-update", {
        room,
        player,
        spectrum,
      });
    }, 300); // 3 times per second

    return () => clearInterval(id);
  }, [socket, room, player]);


  // Force stop if game ended externally (multiplayer result)
	useEffect(() => {
	if (endGame) {
		isGameOverRef.current = true;
		cancelAnimationFrame(rafRef.current);
	}
	}, [endGame]);


  //* RESTART LOGIC (SOLO) */
  function restartGame() {
    if (onRestart) {
      onRestart();
      return;
    }
  
    // Local restart
    const empty = createEmptyBoard();
    syncBoard(empty);
    syncPiece(null);
    indexRef.current = 0;
    setIndex(0);
    holdTypeRef.current = null;
    setHoldType(null);
    canHoldRef.current = true;
    lockStartRef.current = null;
    lockResetRef.current = 0;
    isGameOverRef.current = false;
    setIsGameOver(false);
    keyStateRef.current = {
      left: false,
      right: false,
      down: false,
      rotateHeld: false,
    };
  }

  // --- RENDER ---
const nextType =
  sequence && indexRef.current < sequence.length
    ? sequence[indexRef.current]
    : null;

const safeSpectrums = spectrums || {};

// --- COMMON STYLES ---
  const columnStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    alignItems: "center",
    width: "220px",
    minWidth: "220px",
  };

  const boxStyle = {
    width: "100%", 
    background: "rgba(0, 0, 0, 0.3)",
    padding: "15px",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "flex-start",
        gap: "40px",
        position: "relative",
        marginTop: "20px"
      }}
    >

      {/* --- LEFT COLUMN (HOLD + SPECTERS) --- */}
      <div style={columnStyle}>
        
        {/* HOLD PIECE */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
            <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", letterSpacing: "2px" }}>HOLD</span>
            <HoldPiece type={holdType} />
        </div>

        {/* SPECTRUMS */}
        {Object.keys(safeSpectrums).length > 0 && (
            <div style={boxStyle}>
                <h3 style={{ 
                    color: "rgba(255,255,255,0.7)", 
                    fontSize: "0.9rem", 
                    margin: 0,
                    textTransform: "uppercase",
                    letterSpacing: "2px",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                    paddingBottom: "5px",
                    width: "100%",
                    textAlign: "center"
                }}>
                    Opponents
                </h3>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "15px", width: "100%", alignItems: "center" }}>
                  {Object.entries(safeSpectrums).map(([name, spect]) => (
                    <SpectrumView key={name} name={name} spectrum={spect} />
                  ))}
                </div>
            </div>
        )}

      </div>

      {/* --- CENTER (BOARD) --- */}
      <div style={{ boxShadow: "0 0 40px rgba(0,0,0,0.5)" }}>
        <Board
          board={board}
          activePiece={activePiece}
          ghostPiece={
            activePiece ? getGhostPiece(board, activePiece) : null
          }
        />
      </div>

      {/* --- RIGHT COLUMN (NEXT + SCORE) --- */}
      <div style={columnStyle}>
        
        {/* NEXT PIECE */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
            <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", letterSpacing: "2px" }}>NEXT</span>
            <NextPiece type={nextType} />
        </div>

        {/* SCORE DISPLAY */}
        <div style={boxStyle}>
            <h2 style={{ 
                margin: 0, 
                fontSize: "1rem", 
                color: "rgba(255,255,255,0.7)",
                letterSpacing: "2px"
            }}>SCORE</h2>
            
            <p style={{ 
                margin: 0, 
                fontSize: "2rem", 
                fontWeight: "bold",
                color: "#3ee09d",
                textShadow: "0 0 15px rgba(62, 224, 157, 0.4)",
                fontFamily: "var(--font-tetris)"
            }}>
                {score}
            </p>
        </div>
      </div>

      {/* --- MODALES --- */}
      {endGame && (
        <GameOverModal 
          result={endGame.result}
          winner={endGame.winner}
          onConfirm={onRestart}
          onQuit={onExit}
        />
      )}

      {isGameOver && !endGame && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h1 style={{ 
              color: isSolo ? "var(--Z)" : "var(--text-primary)", 
              fontSize: "2.5rem", 
              marginBottom: "1rem",
              textShadow: "0 0 15px currentColor"
            }}>
              {isSolo ? "GAME OVER" : "ELIMINATED"}
            </h1>
            
            {!isSolo && (
              <div style={{ marginBottom: "20px" }}>
                  <p className="loader" style={{ marginBottom: "10px", color: "var(--text-secondary)" }}>
                      Waiting for winner...
                  </p>
                  <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", fontStyle: "italic" }}>
                      Watch the spectrums on the left!
                  </p>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              {isSolo ? (
                  <>
                      <button className="btn" onClick={restartGame}>
                          RETRY
                      </button>
                      <button
                          className="btn"
                          onClick={onExit}
                          style={{ 
                              background: "transparent", 
                              border: "1px solid var(--glass-border)", 
                              opacity: 0.8 
                          }}
                      >
                          MAIN MENU
                      </button>
                  </>
              ) : (
                  <>
                      <button className="btn" onClick={onRestart}>
                          Leave to Lobby
                      </button>
                      <button
                          className="btn"
                          onClick={onExit}
                          style={{ 
                              background: "transparent", 
                              border: "none", 
                              fontSize: "0.8rem", 
                              opacity: 0.7 
                          }}
                      >
                          Quit to Main Menu
                      </button>
                  </>
              )}
            </div>
          </div>
        </div>
      )}
    </div> 
  );
}