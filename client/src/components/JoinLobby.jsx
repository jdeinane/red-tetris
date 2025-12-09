import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

let socket;

export default function JoinLobby() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    if (!socket)
      socket = io(import.meta.env.VITE_SERVER_URL);

    socket.on("rooms-list", (list) => {
      console.log("ROOMS:", list);
      setRooms(list);
    });

    return () => {
      socket.off("rooms-list");
    };
  }, []);

  return (
    <div className="page-container">
      <div className="content-box">
        <h1 className="title">Join a Lobby</h1>

        {rooms.length === 0 && (
          <p style={{ opacity: 0.7 }}>No rooms available yet…</p>
        )}

        {rooms.map((room) => (
          <div key={room.name} style={{ marginBottom: "15px" }}>
            <p>
              ❄ {room.name} — {room.current}/{room.max}
            </p>

        {room.isPlaying ? (
            <button className="form-button" disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>
              Game Running
            </button>
          ) : room.current >= room.max ? (
            <button className="form-button" disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>
              Full
            </button>
          ) : (
            <button
              className="form-button"
              onClick={() => navigate(`/multi/join/${room.name}`)}
            >
              REJOINDRE
            </button>
          )}
        </div>
        ))}
      </div>
    </div>
  );
}
