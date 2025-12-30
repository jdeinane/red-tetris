import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { io } from "socket.io-client";

import Home from "./components/Home";
import Play from "./components/Play";
import Multiplayer from "./components/Multiplayer";
import CreateLobby from "./components/CreateLobby";
import JoinLobby from "./components/JoinLobby";
import JoinName from "./components/JoinName";
import GamePage from "./components/GamePage";
import SingleGame from "./components/SingleGame";

const socket = io("http://localhost:3000");

export default function App() {
  const [player, setPlayer] = useState("");

return (
    <>
      <video
        autoPlay
        loop
        muted
        playsInline
        className="video-bg"
      >
        <source src="/gradient.mp4" type="video/mp4" />
      </video>
      <Routes>
        <Route 
          path="/" 
          element={
            <Home 
              socket={socket} 
              player={player} 
              setPlayer={setPlayer} 
            />
          } 
        />
        
        <Route path="/play" element={<Play />} />
        
        <Route 
          path="/game" 
          element={
            <SingleGame 
              socket={socket} 
              player={player} 
            />
          } 
        />
        
        <Route path="/multi" element={<Multiplayer />} />
        <Route path="/multi/create" element={<CreateLobby />} />
        <Route path="/multi/join" element={<JoinLobby />} />
        <Route path="/multi/join/:room" element={<JoinName />} />
        
        <Route 
          path="/:room/:player" 
          element={
            <GamePage 
              socket={socket} 
            />
          } 
        />
      </Routes>
    </>
  );
}
