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
          <p style={{ opacity: 0.7, fontStyle: "italic" }}>No rooms available...</p>
        )}

        <ul>
          {rooms.map((room) => (
            <li key={room.name}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                 <span style={{ fontWeight: 'bold' }}>{room.name}</span>
                 <span style={{ fontSize: '0.8em', opacity: 0.6 }}>{room.current} / {room.max} players</span>
              </div>

              {room.isPlaying ? (
                <button className="form-button" disabled style={{ width: 'auto', padding: '8px 16px', fontSize: '0.8rem' }}>
                  Running
                </button>
              ) : room.current >= room.max ? (
                <button className="form-button" disabled style={{ width: 'auto', padding: '8px 16px', fontSize: '0.8rem' }}>
                  Full
                </button>
              ) : (
                <button
                  className="form-button"
                  onClick={() => navigate(`/multi/join/${room.name}`)}
                  style={{ width: 'auto', padding: '8px 16px', fontSize: '0.8rem' }}
                >
                  JOIN
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
