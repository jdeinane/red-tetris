import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { playSound, preloadSounds } from "./utils/audio";

import Home from "./components/Home";
import Play from "./components/Play";
import Multiplayer from "./components/Multiplayer";
import CreateLobby from "./components/CreateLobby";
import JoinLobby from "./components/JoinLobby";
import JoinName from "./components/JoinName";
import GamePage from "./components/GamePage";
import SingleGame from "./components/SingleGame";

export default function App() {

  useEffect(() => {
    preloadSounds();

    // Listen for ALL button clicks
    const handleGlobalClick = (e) => {
      if (e.target.closest("button") || e.target.closest("a")) {
        playSound("click", 0.4);
      }
    };

    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  return (
    <>
      {/* Video tag removed here */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/play" element={<Play />} />
        <Route path="/game" element={<SingleGame />} />
        <Route path="/multi" element={<Multiplayer />} />
        <Route path="/multi/create" element={<CreateLobby />} />
        <Route path="/multi/join" element={<JoinLobby />} />
        <Route path="/multi/join/:room" element={<JoinName />} />
        <Route path="/:room/:player" element={<GamePage />} />
      </Routes>
    </>
  );
}