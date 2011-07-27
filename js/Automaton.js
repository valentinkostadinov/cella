"use strict";

var Automaton = {

	// Position.hash() -> BitBlock
	map: {},
	keys: [],

	births: 0,
	deaths: 0,
	size: 0,
	generation: 0,

	rule: Rules.Life,

	mapSet: function(key, value) {
		this.map[key] = value;
		this.keys.push(key);
	},

	mapRemove: function(key) {
		delete this.map[key];
		var keyIndex = this.keys.indexOf(key);
		this.keys[keyIndex] = this.keys[this.keys.length - 1];
		this.keys.length--;
	},

	cleanUpKeys: function() {
		var srcIndex = 0;
		var dstIndex = 0;
		while (srcIndex < this.keys.length) {
			var key = this.keys[srcIndex];
			if (key != undefined) {
				this.keys[dstIndex++] = key;
			}
			srcIndex++;
		}
		this.keys.length = dstIndex;
	},

	render: function(cellRenderer) {
		for (var i = 0; i < this.keys.length; i++) {
			var block = this.map[this.keys[i]];
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
			var disposables = [];
			var newNonEmpty = [];
			for (var i = 0; i < this.keys.length; i++) {
				var block = this.map[this.keys[i]];

				if (block.isDisposable()) {
					disposables.push(i);
				} else {
					block.computeNext();
					stepBirths += block.births;
					stepDeaths += block.deaths;
					if (block.matrix == 0 && block.next != 0) {
						newNonEmpty.push(block.position);
					}
				}
			}

			// book-keeping and flip
			this.generation++;
			this.births = stepBirths;
			this.deaths = stepDeaths;
			this.size += (this.births - this.deaths);

			// remove disposable blocks
			for (var i = 0; i < disposables.length; i++) {
				var keyIndex = disposables[i];
				var key = this.keys[keyIndex];

				this.map[key].dispose();
				delete this.map[key];
				delete this.keys[keyIndex]
			}
			this.cleanUpKeys();

			for (var i = 0; i < this.keys.length; i++) {
				this.map[this.keys[i]].flip();
			}

			// always keep empty blocks around non-empty ones
			var neighbor = new Position();
			for (var i = 0; i < newNonEmpty.length; i++) {
				var pos = newNonEmpty[i];
				for (var heading in Headings) {
					Headings[heading].toPosition(pos, neighbor);
					if (!this.map[neighbor.hash()]) {
						this.mapSet(neighbor.hash(), new BitBlock(this.map, neighbor));
					}
				}
			};

		}
		this.trigger("step");
	},

	add: function(p) {
		var mapPosition = this.toMapPosition(p);
		var block = this.map[mapPosition.hash()];
		if (!block) {
			block = new BitBlock(this.map, mapPosition);
			this.mapSet(mapPosition.hash(), block);
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
					this.mapSet(neighborPosition.hash(), new BitBlock(this.map, neighborPosition));
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
					this.mapRemove(mapPosition.hash());
				}
			}
		}
	},

	clear: function() {
		this.map = {};
		this.keys.length = 0;

		this.births = 0;
		this.deaths = 0;
		this.generation = 0;
		this.size = 0;

		this.trigger('edit');
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
			this.add(p);
		} else {
			this.remove(p);
		}
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

	setRule: function(rule) {
		this.rule = rule;
		setTransformRule(rule);
	},

}

$.extend(Automaton, EventHandling);