"use strict";

var Automaton = {

	// Position.hash() -> BitBlock
	map: [],

	disposables: [],
	newNonEmpty: [],

	births: 0,
	deaths: 0,
	size: 0,
	generation: 0,

	listeners: [],

	render: function(cellRenderer) {
		for (var key in this.map) {
			var block = this.map[key];
			var matrix = block.matrix;
			if (matrix != 0) {
				var pos = block.position;
				var x = (pos.x << 2);
				var y = (pos.y << 2);
				var n = 0;
				do {
					if ((matrix & 1) != 0) {
						cellRenderer(x + (n & 3), y + (n >> 2));
					}
					n++;
				} while ((matrix >>>= 1) != 0);
			}
		}
	},

	step: function(steps) {
		for (var s = 0; s < steps; s++) {
			var stepBirths = 0;
			var stepDeaths = 0;

			// compute
			this.disposables = [];
			this.newNonEmpty = [];
			for (var key in this.map) {
				var block = this.map[key];

				if (block.isDisposable()) {
					this.disposables.push(block.position);
				} else {
					block.computeNext();
					stepBirths += block.births;
					stepDeaths += block.deaths;
					if (block.matrix == 0 && block.next != 0) {
						this.newNonEmpty.push(block.position);
					}
				}
			}

			// book-keeping and flip
			this.generation++;
			this.births = stepBirths;
			this.deaths = stepDeaths;
			this.size += (this.births - this.deaths);

			// remove disposable blocks
			var me = this;
			this.disposables.forEach( function(p) {
				var key = p.hash();
				me.map[key].dispose();
				delete me.map[key];
			});

			for (var key in this.map) {
				this.map[key].flip();
			}

			// always keep empty blocks around non-empty ones
			var neighbor = new Position();
			this.newNonEmpty.forEach( function(p) {
				for (var heading in Headings) {
					Headings[heading].toPosition(p, neighbor);
					if (!me.map[neighbor.hash()]) {
						me.map[neighbor.hash()] = new BitBlock(me.map, neighbor);
					}
				}
			});

		}
		this.stateChanged(true);
	},

	isSet: function(p) {
		var block = this.map[this.toMapPosition(p).hash()];
		if (block) {
			var n = this.toBlockIndex(p);
			return (block.matrix & (1 << n)) != 0;
		}
		return false;
	},

	set: function(p, state) {
		if (state) {
			// add
			var mapPosition = this.toMapPosition(p);
			var block = this.map[mapPosition.hash()];
			if (!block) {
				block = new BitBlock(this.map, mapPosition);
				this.map[mapPosition.hash()] = block;
			}
			var original = block.matrix;
			block.matrix |= (1 << this.toBlockIndex(p));
			if (original != block.matrix) {
				this.size++;
				// always keep empty blocks around non-empty ones
				for (var heading in Headings) {
					var neighborPosition = Headings[heading].toPosition(mapPosition);
					var neighbor = this.map[neighborPosition.hash()];
					if (!neighbor) {
						this.map[neighborPosition.hash()] = new BitBlock(this.map, neighborPosition);
					}
				}
			}
		} else {
			// remove
			var mapPosition = this.toMapPosition(p);
			var block = this.map[mapPosition.hash()];
			if (block) {
				var original = block.matrix;
				block.matrix &= ~(1 << this.toBlockIndex(p));
				if (original != block.matrix) {
					this.size--;
					if (block.isDisposable()) {
						block.dispose();
						delete this.map[mapPosition.hash()];
					}
				}
			}
		}
		this.stateChanged();
	},

	clear: function() {
		this.map = [];
		this.births = 0;
		this.deaths = 0;
		this.generation = 0;
		this.size = 0;

		this.stateChanged();
	},

	toMapPosition: function(p) {
		return new Position(p.x >> 2, p.y >> 2);
	},

	toBlockIndex: function(p) {
		return ((p.y & 3) << 2) + (p.x & 3);
	},

	addPattern: function(pattern) {
		pattern.forEach(function(p) {
			Automaton.set(p, true);
		});
	},

	toPattern: function() {
		var pattern = [];
		this.render(function(x, y) {
			pattern.push({x: x, y: y});
		});
		return pattern;
	},

	addListener: function(listener) {
		this.listeners.push(listener);
	},

	stateChanged: function(code) {
		this.listeners.forEach(function(listener){
			listener.stateChanged(code);
		});
	},

}