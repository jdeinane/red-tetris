import React from "react";

export default function SpectrumView({ name, spectrum }) {
  if (!spectrum) return null;

  return (
    <div className="glass-panel" style={{ padding: "15px", marginBottom: "15px", minWidth: "120px" }}>
      <h4 style={{
        margin: "0 0 10px 0",
        fontSize: "0.9rem",
        color: "var(--text-secondary)",
        letterSpacing: "1px",
        textTransform: "uppercase"
      }}>
        {name}
      </h4>

      <div style={{
        display: "flex",
        gap: "4px",
        height: "80px",
        alignItems: "flex-end",
        justifyContent: "center"
      }}>
        {spectrum.map((h, i) => {
          const pct = h / 20;
          let bg = "var(--S)"; 
          if (pct > 0.5) bg = "var(--O)";
          if (pct > 0.75) bg = "var(--Z)";

          return (
            <div
              key={i}
              style={{
                width: "8px",
                height: `${Math.min(h * 4, 80)}px`,
                background: bg,
                borderRadius: "2px",
                transition: "all 0.3s ease",
                boxShadow: pct > 0.5 ? `0 0 8px ${bg}` : "none",
                opacity: 0.9
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
