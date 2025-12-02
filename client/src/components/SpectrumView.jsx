export default function SpectrumView({ name, spectrum }) {
	if (!spectrum)
		return null;

  return (
    <div style={{
      textAlign: "center",
      marginBottom: "15px",
      padding: "8px 12px",
      background: "rgba(0,0,0,0.4)",
      borderRadius: "8px",
      backdropFilter: "blur(4px)",
      border: "1px solid rgba(255,255,255,0.15)",
    }}>
      <h4 style={{
        color: "white",
        margin: 0,
        fontSize: "14px",
        marginBottom: "6px",
        textShadow: "0 0 5px rgba(255,255,255,0.4)",
      }}>
        {name}
      </h4>

      <div style={{
        display: "flex",
        gap: "3px",
        height: "80px",
        alignItems: "flex-end",
      }}>
        {spectrum.map((h, i) => {

          const pct = h / 20;
          let color = "#34ff5a";
          if (pct > 0.5) color = "#ffd23f";
          if (pct > 0.75) color = "#ff6961";

          return (
            <div
              key={i}
              style={{
                width: "8px",
                height: `${h * 4}px`,
                background: color,
                borderRadius: "2px",
                transition: "height 0.15s ease, background 0.2s ease",
                boxShadow:
                  pct > 0.75
                    ? "0 0 8px rgba(255,0,0,0.7)"
                    : pct > 0.5
                    ? "0 0 6px rgba(255,200,0,0.5)"
                    : "none",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
