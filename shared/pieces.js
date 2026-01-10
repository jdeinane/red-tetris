/* 	Generates the Tetris pieces, gives the same sequence to all players. */

export const TETROMINOS = ["I", "O", "T", "S", "Z", "J", "L"];

export const PIECE_SHAPES = {
	I: [
		[0, 0, 0, 0],
		[1, 1, 1, 1],
		[0, 0, 0, 0],
		[0, 0, 0, 0],
	],
	O: [
		[1, 1],
		[1, 1],
	],
	T: [
		[0, 1, 0],
		[1, 1, 1],
		[0, 0, 0],
	],
	S: [
		[0, 1, 1],
		[1, 1, 0],
		[0, 0, 0],
	],
	Z: [
		[1, 1, 0],
		[0, 1, 1],
		[0, 0, 0],
	],
	J: [
		[1, 0, 0],
		[1, 1, 1],
		[0, 0, 0],
	],
	L: [
		[0, 0, 1],
		[1, 1, 1],
		[0, 0, 0],
	],
};

export function generateBag() {
	const bag = [...TETROMINOS];
	for (let i = bag.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[bag[i], bag[j]] = [bag[j], bag[i]];
	}
	return bag;
}

export function generateSequence(size = 100) {
	let seq = [];
	while (seq.length < size) {
		seq = seq.concat(generateBag());
	}
	return seq.slice(0, size);
}
