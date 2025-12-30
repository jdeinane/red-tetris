import { useEffect, useState, useRef } from "react";
import Board from "./Board";
import NextPiece from "./NextPiece";
import HoldPiece from "./HoldPiece";
import SpectrumView from "../components/SpectrumView.jsx";
import GameOverModal from "../components/GameOverModal.jsx";

import { playSound, playBackgroundMusic, stopBackgroundMusic } from "../utils/audio";

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

  /* GAME STATE */
  const [board, setBoard] = useState(createEmptyBoard());
  const [activePiece, setActivePiece] = useState(null);
  const [index, setIndex] = useState(0);

  const [isGameOver, setIsGameOver] = useState(false);
  const [holdType, setHoldType] = useState(null);
  const [score, setScore] = useState(0);
  const [boardAnim, setBoardAnim] = useState("");

  const boardRef = useRef(board);
  const pieceRef = useRef(null);
  const indexRef = useRef(0);
  const isGameOverRef = useRef(false);
  const holdTypeRef = useRef(null);
  const canHoldRef = useRef(true); 

  const lockStartRef = useRef(null);
  const lockResetRef = useRef(0);
  const MAX_LOCK_RESETS = 15;

  const keyStateRef = useRef({ left: false, right: false, down: false, rotateHeld: false });
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

  const addScore = (lines) => {
    if (lines === 0) return;
    const points = [0, 100, 300, 500, 800];
    setScore(prev => prev + (points[lines] || 0));
  };

  const triggerBoardAnim = (type) => {
    setBoardAnim(type);
    setTimeout(() => setBoardAnim(""), 500); 
  };

  const handleLockFx = (linesCleared) => {
    if (linesCleared === 4) {
      playSound("tetris", 0.6); 
      triggerBoardAnim("flash");
    } else if (linesCleared > 0) {
      playSound("clear", 0.5);
      triggerBoardAnim("pulse");
    }
  };

  /* GAME LOGIC */
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

    let newPiece = createPiece(type, spawn);

    // Collision Check (Immediate Loss)
    if (hasCollision(boardRef.current, newPiece)) {
      const liftedPiece = { ...newPiece, y: newPiece.y - 1 };
      if (hasCollision(boardRef.current, liftedPiece)) {
        // [NEW] LOSE SOUND (Immediate Death)
        playSound("lose");
        
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

  function notifyLinesCleared(clearedLines) {
    if (!clearedLines || !socket) return;
    socket.emit("lines-cleared", { room, player, count: clearedLines });
  }

  function notifyGameOver() {
    if (!socket || !room || !player) return;
    socket.emit("player-game-over", { room, player });
  }

  function handleHold() {
    if (!pieceRef.current || !canHoldRef.current || isGameOverRef.current) return;
    playSound("click");

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

  function handleHardDrop() {
    if (!pieceRef.current || isGameOverRef.current) return;

    const dropped = hardDrop(boardRef.current, pieceRef.current);
    const withPiece = mergePiece(boardRef.current, dropped);
    const clearResult = clearLines(withPiece);
    const cleaned = clearResult.board;
    const clearedLines = clearResult.clearedLines || 0;

    notifyLinesCleared(clearedLines);
    addScore(clearedLines);
    handleLockFx(clearedLines);

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

  function startAutoMove(direction) {
    if (!pieceRef.current) return;
    clearTimeout(moveTimeoutRef.current);
    clearInterval(moveRepeatRef.current);
    playSound("move", 0.3);

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

  useEffect(() => {
    function rotateOnce() {
      if (!pieceRef.current || isGameOverRef.current) return;
      const p = pieceRef.current;
      const rotated = rotatePiece(boardRef.current, p);
      if (rotated !== p) {
        playSound("rotate", 0.4);
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
        if (!keyStateRef.current.rotateHeld) rotateOnce();
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
        } else if (now - lockStartRef.current >= lockDelay) {
            const merged = mergePiece(boardRef.current, p);
            const clearResult = clearLines(merged);
            const cleaned = clearResult.board;
            const clearedLines = clearResult.clearedLines || 0;

            notifyLinesCleared(clearedLines);
            addScore(clearedLines);
            handleLockFx(clearedLines);

            syncBoard(cleaned);
            syncPiece(null);
            canHoldRef.current = true;
            lockStartRef.current = null;
        }
      } else {
        if (lockStartRef.current !== null) lockStartRef.current = null;
      }
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [sequence, isGameOver, socket, room, player]);

  useEffect(() => {
    function handleGarbage(e) { garbageRef.current += e.detail; }
    window.addEventListener("add-garbage", handleGarbage);
    return () => window.removeEventListener("add-garbage", handleGarbage);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (garbageRef.current > 0 && !isGameOverRef.current) {
        const linesToAdd = garbageRef.current;
        const updated = addGarbageLines(boardRef.current, linesToAdd);

        if (updated === null) {
          // [NEW] LOSE SOUND (Garbage Death)
          playSound("lose");

          garbageRef.current = 0;
          isGameOverRef.current = true;
          setIsGameOver(true);
          notifyGameOver();
          return;
        }
        if (pieceRef.current) {
          const adjustedPiece = { ...pieceRef.current, y: pieceRef.current.y - linesToAdd };
          syncPiece(adjustedPiece);
        }
        garbageRef.current = 0;
        syncBoard(updated);
        triggerBoardAnim("shake");
      }
    }, 50);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (!socket || isGameOverRef.current) return;
      const spectrum = getSpectrum(boardRef.current);
      socket.emit("spectrum-update", { room, player, spectrum });
    }, 300);
    return () => clearInterval(id);
  }, [socket, room, player]);

  // BACKGROUND MUSIC
  useEffect(() => {
    if (!isGameOver) {
      playBackgroundMusic(0.3);
    } else {
      stopBackgroundMusic();
    }
    return () => stopBackgroundMusic();
  }, [sequence, isGameOver]);

  // GAME END (Server Result)
  useEffect(() => {
    if (endGame) {
      isGameOverRef.current = true;
      cancelAnimationFrame(rafRef.current);
      
      // [FIX] ONLY PLAY WIN SOUND IF I AM THE WINNER
      // Check if the winner's name matches my player name
      // (Assuming 'player' prop is your nickname and 'endGame.winner' is the winner's nickname)
      
      const amIWinner = endGame.winner === player; // Or endGame.winner.name === player (depending on your server object)

      if (amIWinner) {
          playSound("win");
      } else {
          playSound("lose"); 
      }
    }
  }, [endGame, player]); // Added 'player' to dependencies

  function restartGame() {
    if (onRestart) { onRestart(); return; }
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
    keyStateRef.current = { left: false, right: false, down: false, rotateHeld: false };
    playBackgroundMusic();
  }

  // --- RENDER ---
  const nextType = sequence && indexRef.current < sequence.length ? sequence[indexRef.current] : null;
  const safeSpectrums = spectrums || {};

  return (
    <>
      <div style={{ display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "flex-start", gap: "40px", position: "relative", marginTop: "20px" }}>
        <HoldPiece type={holdType} />
        <div>
          <Board board={board} activePiece={activePiece} ghostPiece={activePiece ? getGhostPiece(board, activePiece) : null} animationClass={boardAnim} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "30px", alignItems: "center" }}>
          <NextPiece type={nextType} />
          <div style={{ color: "white", fontFamily: "var(--font-tetris)", textAlign: "center", background: "rgba(0, 0, 0, 0.3)", padding: "15px", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.1)", minWidth: "100px" }}>
            <h2 style={{ margin: "0 0 10px 0", fontSize: "1.2rem", opacity: 0.8 }}>SCORE</h2>
            <p style={{ margin: 0, fontSize: "1.8rem", fontWeight: "bold", color: "#3ee09dff", textShadow: "0 0 10px rgba(167, 46, 116, 0.5)" }}>{score}</p>
          </div>
        </div>
        <div style={{ position: "absolute", right: "-150px", top: "20px", display: "flex", flexDirection: "column", gap: "12px", zIndex: 50 }}>
          {Object.entries(safeSpectrums).map(([name, spect]) => (
            <SpectrumView key={name} name={name} spectrum={spect} />
          ))}
        </div>
        {endGame && (<GameOverModal result={endGame.result} winner={endGame.winner} onConfirm={onRestart} onQuit={onExit} />)}
        {isGameOver && !endGame && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h1 style={{ color: isSolo ? "var(--Z)" : "var(--text-primary)", fontSize: "2.5rem", marginBottom: "1rem", textShadow: "0 0 15px currentColor" }}>{isSolo ? "GAME OVER" : "ELIMINATED"}</h1>
              {!isSolo && (<div style={{ marginBottom: "20px" }}><p className="loader" style={{ marginBottom: "10px", color: "var(--text-secondary)" }}>Waiting for winner...</p><p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", fontStyle: "italic" }}>Watch the spectrums on the right!</p></div>)}
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {isSolo ? (<><button className="btn" onClick={restartGame}>RETRY</button><button className="btn" onClick={onExit} style={{ background: "transparent", border: "1px solid var(--glass-border)", opacity: 0.8 }}>MAIN MENU</button></>) : (<><button className="btn" onClick={onRestart}>Leave to Lobby</button><button className="btn" onClick={onExit} style={{ background: "transparent", border: "none", fontSize: "0.8rem", opacity: 0.7 }}>Quit to Main Menu</button></>)}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}