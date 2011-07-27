"use strict";

var Automaton = {

	// Position.hash() -> BitBlock
	map: [],

	rule: Rules.Life,

	disposables: [],
	newNonEmpty: [],

	births: 0,
	deaths: 0,
	size: 0,
	generation: 0,

	listeners: [],

	setRule: function(rule) {
		this.rule = rule;
		setTransformRule(rule);
	},

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
			for (var i = 0; i < this.disposables.length; i++) {
				var key = this.disposables[i].hash();
				this.map[key].dispose();
				delete this.map[key];
			}

			for (var key in this.map) {
				this.map[key].flip();
			}

			// always keep empty blocks around non-empty ones
			var neighbor = new Position();
			for (var i = 0; i < this.newNonEmpty.length; i++) {
				var pos = this.newNonEmpty[i];
				for (var heading in Headings) {
					Headings[heading].toPosition(pos, neighbor);
					if (!this.map[neighbor.hash()]) {
						this.map[neighbor.hash()] = new BitBlock(this.map, neighbor);
					}
				}
			};

		}
		this.trigger("step");
	},

	isSet: function(p) {
		var block = this.map[this.toMapPosition(p).hash()];
		if (block) {
			var n = this.toBlockIndex(p);
			return (block.matrix & (1 << n)) != 0;
		}
		return false;
	},

	add: function(p) {
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
	},

	remove: function(p) {
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
	},

	set: function(p, state) {
		if (state) {
			this.add(p);
		} else {
			this.remove(p);
		}
		this.trigger('edit');
	},

	clear: function() {
		this.map = [];
		this.births = 0;
		this.deaths = 0;
		this.generation = 0;
		this.size = 0;

		this.trigger('edit');
	},

	toMapPosition: function(p) {
		return new Position(p.x >> 2, p.y >> 2);
	},

	toBlockIndex: function(p) {
		return ((p.y & 3) << 2) + (p.x & 3);
	},

	addPattern: function(pattern) {
		for (var i in pattern) {
			Automaton.add(pattern[i]);
		};
		this.trigger('edit');
	},

	toPattern: function() {
		var pattern = [];
		this.render( function(x, y) {
			pattern.push({
				x: x,
				y: y
			});
		});

		return pattern;
	},

}

$.extend(Automaton, EventHandling);