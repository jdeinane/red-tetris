import React from "react";

export default function GameOverModal({ result, winner, onConfirm }) {
	return (
		<div style={styles.backdrop}>
			<div style={styles.modal}>
				<h1 style={styles.title}>
					{result === "win" ? "YOU WIN!" : "GAME OVER"}
				</h1>

				{winner && (
					<p style={styles.subtitle}>
						Winner: <span style={{ color: "00eaff"}}>{winner}</span>
					</p>
				)}

				<button style={styles.button} onClick={onConfirm}>
					OK
				</button>
			</div>
		</div>
	)
}


const styles = {
  backdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    backdropFilter: "blur(4px)",
  },
  modal: {
    background: "rgba(20,20,35,0.9)",
    padding: "40px 50px",
    borderRadius: "16px",
    textAlign: "center",
    color: "white",
    border: "2px solid rgba(255,0,255,0.5)",
    boxShadow: "0 0 30px rgba(255,0,255,0.4)",
    minWidth: "300px",
  },
  title: {
    fontSize: "40px",
    marginBottom: "15px",
    textShadow: "0 0 15px #ff00ff",
  },
  subtitle: {
    fontSize: "18px",
    marginBottom: "20px",
    opacity: 0.8,
  },
  button: {
    padding: "12px 28px",
    fontSize: "18px",
    borderRadius: "10px",
    background: "linear-gradient(90deg, #ff00ff, #00eaff)",
    color: "white",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 0 10px rgba(255,0,255,0.5)",
  },
};
