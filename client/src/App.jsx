import React from "react";
import { Routes, Route } from "react-router-dom";

import Home from "./components/Home";
import Play from "./components/Play";
import Multiplayer from "./components/Multiplayer";
import CreateLobby from "./components/CreateLobby";
import JoinLobby from "./components/JoinLobby";
import JoinName from "./components/JoinName";
import GamePage from "./components/GamePage";
import SingleGame from "./components/SingleGame";

export default function App() {
  return (
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
  );
}
