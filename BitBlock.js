"use strict";

function Position(x, y) {
	this.x = x;
	this.y = y;
}

Position.prototype.hash = function() {
	return this.x ^ (this.y << 14);
}

function Heading(x, y) {
	this.x = x;
	this.y = y;
}

Heading.prototype.toPosition = function(from, to) {
	if (!to) {
		return new Position(from.x + this.x, from.y + this.y);
	}
	to.x = from.x + this.x;
	to.y = from.y + this.y;
	return to;
}

var Headings = {
	N: new Heading(0, -1),
	NE: new Heading(1, -1),
	E: new Heading(1, 0),
	SE: new Heading(1, 1),
	S: new Heading(0, 1),
	SW: new Heading(-1, 1),
	W: new Heading(-1, 0),
	NW: new Heading(-1, -1),
}

/**
 * Represents a 4x4 bit matrix.
 *
 * 00 01 02 03 | 0x0001 0x0002 0x0004 0x0008
 * 04 05 06 07 | 0x0010 0x0020 0x0040 0x0080
 * 08 09 10 11 | 0x0100 0x0200 0x0400 0x0800
 * 12 13 14 15 | 0x1000 0x2000 0x4000 0x8000
 */
function BitBlock(map, pos) {

	this.position = new Position(pos.x, pos.y);

	this.matrix = 0;
	this.next = 0;

	this.births = 0;
	this.deaths = 0;

	var to = new Position();
	this.N = map[Headings.N.toPosition(pos, to).hash()];
	this.E = map[Headings.E.toPosition(pos, to).hash()];
	this.S = map[Headings.S.toPosition(pos, to).hash()];
	this.W = map[Headings.W.toPosition(pos, to).hash()];
	this.NE = map[Headings.NE.toPosition(pos, to).hash()];
	this.SE = map[Headings.SE.toPosition(pos, to).hash()];
	this.SW = map[Headings.SW.toPosition(pos, to).hash()];
	this.NW = map[Headings.NW.toPosition(pos, to).hash()];

	if (this.N != null) {
		this.N.S = this;
	}
	if (this.E != null) {
		this.E.W = this;
	}
	if (this.S != null) {
		this.S.N = this;
	}
	if (this.W != null) {
		this.W.E = this;
	}
	if (this.NE != null) {
		this.NE.SW = this;
	}
	if (this.SE != null) {
		this.SE.NW = this;
	}
	if (this.SW != null) {
		this.SW.NE = this;
	}
	if (this.NW != null) {
		this.NW.SE = this;
	}
}

/**
 * Compute the next state for each of the 16 cells.
 *
 * 0x8000 | 0x1000 0x2000 0x4000 0x8000 | 0x1000
 * ---------------------------------------------
 * 0x0008 | 0x0001 0x0002 0x0004 0x0008 | 0x0001
 * 0x0080 | 0x0010 0x0020 0x0040 0x0080 | 0x0010
 * 0x0800 | 0x0100 0x0200 0x0400 0x0800 | 0x0100
 * 0x8000 | 0x1000 0x2000 0x4000 0x8000 | 0x1000
 * ---------------------------------------------
 * 0x0008 | 0x0001 0x0002 0x0004 0x0008 | 0x0001
 *
 */
BitBlock.prototype.computeNext = function() {
	// inner four bits
	this.next = lookup0x0660[this.matrix];

	// outer twelve bits
	var n = this.N == null ? 0 : this.N.matrix;
	var e = this.E == null ? 0 : this.E.matrix;
	var s = this.S == null ? 0 : this.S.matrix;
	var w = this.W == null ? 0 : this.W.matrix;
	var ne = this.NE == null ? 0 : this.NE.matrix;
	var se = this.SE == null ? 0 : this.SE.matrix;
	var sw = this.SW == null ? 0 : this.SW.matrix;
	var nw = this.NW == null ? 0 : this.NW.matrix;

	var bits0x0007 = (this.matrix & 0x00FF) | (n & 0xF000) | ((nw & 0x8000) >> 4) | ((w & 0x0080) << 2) | ((w & 0x0008) << 5);
	var bits0x0888 = (this.matrix & 0xCCCC) | (e & 0x1111) | ((ne & 0x1000) >> 7) | ((n & 0x4000) >> 5) | ((n & 0x8000) >> 2);
	var bits0xE000 = (this.matrix & 0xFF00) | (s & 0x000F) | ((se & 0x0001) << 4) | ((e & 0x1000) >> 5) | ((e & 0x0100) >> 2);
	var bits0x1110 = (this.matrix & 0x3333) | (w & 0x8888) | ((sw & 0x0008) << 7) | ((s & 0x0001) << 2) | ((s & 0x0002) << 5);

	this.next |= lookup0x0007[bits0x0007] | lookup0x0888[bits0x0888] | lookup0xE000[bits0xE000] | lookup0x1110[bits0x1110];

	// book-keeping
	var survivors = this.next & this.matrix;
	this.births = bitCounts[survivors ^ this.next];
	this.deaths = bitCounts[survivors ^ this.matrix];
}

BitBlock.prototype.flip = function() {
	this.matrix = this.next;
}

BitBlock.prototype.isDisposable = function() {
	return this.matrix == 0 &&
	(this.N == null || this.N.matrix == 0) && (this.NE == null || this.NE.matrix == 0) &&
	(this.E == null || this.E.matrix == 0) && (this.SE == null || this.SE.matrix == 0) &&
	(this.S == null || this.S.matrix == 0) && (this.SW == null || this.SW.matrix == 0) &&
	(this.W == null || this.W.matrix == 0) && (this.NW == null || this.NW.matrix == 0);
}

BitBlock.prototype.dispose = function() {
	if (this.N != null) {
		this.N = this.N.S = null;
	}
	if (this.NE != null) {
		this.NE = this.NE.SW = null;
	}
	if (this.E != null) {
		this.E = this.E.W = null;
	}
	if (this.SE != null) {
		this.SE = this.SE.NW = null;
	}
	if (this.S != null) {
		this.S = this.S.N = null;
	}
	if (this.SW != null) {
		this.SW = this.SW.NE = null;
	}
	if (this.W != null) {
		this.W = this.W.E = null;
	}
	if (this.NW != null) {
		this.NW = this.NW.SE = null;
	}
}

// bit count lookup
var bitCounts = new Array(0xFFFF + 1);
(function() {
	for (var i = 0; i < bitCounts.length; i++) {
		var n = i - ((i >>> 1) & 0x55555555);
		n = (n & 0x33333333) + ((n >>> 2) & 0x33333333);
		n = (n + (n >>> 4)) & 0x0f0f0f0f;
		n = n + (n >>> 8);
		n = n + (n >>> 16);
		bitCounts[i] = n & 0x3f;
	}
})();

// lookup for inner 4 bits
var lookup0x0660 = new Array(0xFFFF + 1);
// lookup for the outer 12 bits
var lookup0x0007 = new Array(0xFFFF + 1);
var lookup0x0888 = new Array(0xFFFF + 1);
var lookup0xE000 = new Array(0xFFFF + 1);
var lookup0x1110 = new Array(0xFFFF + 1);

(function() {
	function generateLookup(lookup, bits, neighbors) {
		var mask = 0;
		for (var i  = 0; i < bits.length; i++) {
			mask |= bits[i];
		}

		for (var from = 0; from <= 0xFFFF; from++) {
			var to = from;
			for (var j  = 0; j < bits.length; j++) {
				var bit = bits[j];
				var neighborhood = neighbors[j];

				var bitCount = bitCounts[from & neighborhood];
				if ((from & bit) == bit) {
					if (bitCount != 2 && bitCount != 3) {
						to ^= bit;
					}
				} else {
					if (bitCount == 3) {
						to ^= bit;
					}
				}
			}
			lookup[from] = to & mask;
		}
	}

	// inner 4 bits
	generateLookup(lookup0x0660, [0x0020, 0x0040, 0x0200, 0x0400], [0x0757, 0x0EAE, 0x7570, 0xEAE0]);

	// outer 12 bits
	generateLookup(lookup0x0007, [0x0001, 0x0002, 0x0004], [0x3B32, 0x7075, 0xE0EA]);
	generateLookup(lookup0x0888, [0x0008, 0x0080, 0x0800], [0x22F5, 0x0D5D, 0xD5D0]);
	generateLookup(lookup0xE000, [0x2000, 0x4000, 0x8000], [0x5707, 0xAE0E, 0x4CDC]);
	generateLookup(lookup0x1110, [0x0010, 0x0100, 0x1000], [0x0BAB, 0xBAB0, 0xAF44]);
})();