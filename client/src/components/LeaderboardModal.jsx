import React, { useEffect, useState } from 'react';

export default function LeaderboardModal({ socket, onClose }) {
  const [scores, setScores] = useState([]);

  useEffect(() => {
    if (!socket) return;

    socket.emit('request-leaderboard');

    socket.on('leaderboard-data', (data) => {
      setScores(data);
    });

    return () => {
      socket.off('leaderboard-data');
    };
  }, [socket]);

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ minWidth: '400px' }}>
        <h2 style={{ color: '#5bb7c7ff', textShadow: '0 0 10px #ff0055' }}>
          HALL OF FAME
        </h2>

        <div style={{ 
            margin: '20px 0', 
            maxHeight: '300px', 
            overflowY: 'auto',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
            padding: '10px'
        }}>
          {scores.length === 0 ? (
            <p>No records yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #444', color: '#888' }}>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Rank</th>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Player</th>
                  <th style={{ textAlign: 'right', padding: '8px' }}>Score</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((entry, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '8px', color: i < 3 ? '#ffcc00' : 'white' }}>
                        #{i + 1}
                    </td>
                    <td style={{ padding: '8px' }}>{entry.name}</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#3ee09d' }}>
                        {entry.score}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <button className="btn" onClick={onClose}>
          CLOSE
        </button>
      </div>
    </div>
  );
}
