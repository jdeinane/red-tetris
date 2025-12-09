import React from "react";

export default function GameOverModal({ result, winner, onConfirm, onQuit }) {
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

        <div styles={styles.buttonContainer}>
          <button style={styles.button} onClick={onConfirm}>
            Back to Lobby
          </button>

          <button style={styles.button} onClick={onQuit}>
            Main Menu
          </button>
        </div>
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
    background: "rgba(20,20,35,0.95)",
    padding: "40px 50px",
    borderRadius: "16px",
    textAlign: "center",
    color: "white",
    border: "2px solid rgba(255,0,255,0.5)",
    boxShadow: "0 0 30px rgba(255,0,255,0.4)",
    minWidth: "350px",
  },
  title: {
    fontSize: "40px",
    marginBottom: "15px",
    textShadow: "0 0 15px #ff00ff",
  },
  subtitle: {
    fontSize: "18px",
    marginBottom: "30px",
    opacity: 0.8,
  },
  buttonContainer: {
    display: "flex",
    gap: "20px",
    justifyContent: "center",
  },
  button: {
    padding: "12px 24px",
    fontSize: "16px",
    borderRadius: "8px",
    background: "linear-gradient(90deg, #ff00ff, #00eaff)",
    color: "white",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 0 10px rgba(255,0,255,0.5)",
    fontWeight: "bold",
    flex: 1,
  },
  quitButton: {
    padding: "12px 24px",
    fontSize: "16px",
    borderRadius: "8px",
    background: "transparent",
    color: "#aaa",
    border: "2px solid #555",
    cursor: "pointer",
    fontWeight: "bold",
    flex: 1,
    transition: "0.2s",
  },
};