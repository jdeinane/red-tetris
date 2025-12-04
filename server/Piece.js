export default class Piece {
	constructor(type) {
		this.type = type;
		this.createdAt = Date.now();
	}

	getInfo() {
		return {
			type: this.type,
			createdAt: this.createdAt
		};
	}
}
