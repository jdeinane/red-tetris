import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function BackButton() {
	const navigate = useNavigate();
	const location = useLocation();

	if (location.pathname === "/")
		return null;

	return (
    <button
      onClick={() => navigate(-1)}
      style={{
        position: "fixed",
        top: "20px",
        left: "20px",
        zIndex: 100,
        width: "50px",
        height: "50px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        background: "rgba(255, 255, 255, 0.1)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        cursor: "pointer",
        backdropFilter: "blur(5px)",
        transition: "all 0.3s ease",
        color: "white"
      }}
      onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.25)";
          e.currentTarget.style.transform = "scale(1.1)";
      }}
      onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
          e.currentTarget.style.transform = "scale(1)";
      }}
    >
      <span style={{ fontSize: "2rem", lineHeight: "1", paddingBottom: "4px" }}>
		&#8592;
	  </span>
    </button>
  );
}
