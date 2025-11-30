import React from "react";

export default function Spectrum({ name }) {
  const mockBars = Array.from({ length: 10 }, () =>
    Math.floor(Math.random() * 20)
  );

  return (
    <div className="spectrum-container">
      <h4>{name}</h4>
      <div className="spectrum-bars">
        {mockBars.map((height, i) => (
          <div
            key={i}
            className="spectrum-bar"
            style={{ height: `${height * 5}px` }}
          />
        ))}
      </div>
    </div>
  );
}