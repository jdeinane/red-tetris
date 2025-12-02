export default function SpectrumView({ name, spectrum }) {
	if (!spectrum)
		return null;

	return (
		<div style={{ textAlign: "center", margin: "10px" }}>
		<h4 style={{ color: "white" }}>{name}</h4>

		<div style={{
			display: "flex",
			gap: "2px",
			height: "80px",
			alignItems: "flex-end",
		}}>
			{spectrum.map((h, i) => (
			<div
				key={i}
				style={{
				width: "6px",
				height: `${h * 4}px`,
				background: "#ff69b4",
				}}
			/>
			))}
		</div>
		</div>
	);
}
