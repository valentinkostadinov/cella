"use strict";

var Grid = {

	/*
	 * scale > 0: pixels/cell
	 * scale < -1: cells/pixel
	 */
	DEFAULT_SCALE: 14,
	MAX_SCALE: 32, // must be > 0
	MIN_SCALE: -32, // must be < -1
	MIN_SCALE_WITH_GRID: 3,
	SCREEN_FIT_RATIO: 0.9,

	// grid lines
	GRID_LINES_COLOR: 'rgb(70, 70, 70)',
	MEASURE_LINES_INTERVAL: 10,
	MEASURE_LINES_COLOR: 'rgb(100, 100, 100)',
	ORIGIN_LINES_COLOR: 'rgb(230, 230, 230)',

	// cell colors
	CELL_COLOR: 'rgb(255, 210, 0)',
	MULTIPLE_CELLS_COLOR: 'rgb(255, 255, 255)',

	canvas: null,
	context: null,
	width: null,
	height: null,

	// grid offset from canvas center
	offset: {
		x: 0,
		y: 0
	},

	visibleGridLines: true,
	autoFit: true,

	init: function(canvas) {
		var me = this;

		me.scale = Grid.DEFAULT_SCALE,

		me.canvas = canvas;
		me.context = canvas.getContext("2d");

		Automaton.addListener({
			stateChanged: function(stepChange) {
				if (me.autoFit && stepChange) {
					me.fitPattern();
				}
				me.paint();
			}

		});

		// resizing setup
		$(window).resize( function() {
			me.width = me.canvas.width = window.innerWidth;
			me.height = me.canvas.height = window.innerHeight;
			if (me.autoFit) {
				me.fitPattern(true);
			}
			me.paint();
		});

		// prevent context menu
		me.canvas.oncontextmenu = function() {
			return false;
		};

		// zooming setup
		$(document).mousewheel( function(event, delta) {
			me.zoom(delta > 0 ? 1 : -1, event.pageX, event.pageY);
		});

		// mouse panning and cell toggle setup
		(function() {
			var dragButton;
			var panOrigin, panOffset;
			var lastPos, toggleState;

			$(canvas).mousedown( function(event) {
				dragButton = event.button;
				switch (event.button) {
					case 0:
						panOrigin = {
							x: event.pageX,
							y: event.pageY,
						};
						panOffset = {
							x: 0,
							y: 0
						};
						event.target.style.cursor = 'move';
						break;
					case 2:
						event.target.style.cursor = 'pointer';
						toggleState = null;
						break;
				}
			});

			$(canvas).mousemove( function(event) {
				if (dragButton == null) {
					return;
				}
				var p = me.toGridXY(event.pageX, event.pageY);
				switch (dragButton) {
					case 0:
						if (panOrigin) {
							me.pan(event.pageX - panOrigin.x - panOffset.x, event.pageY - panOrigin.y - panOffset.y);
							panOffset = {
								x: event.pageX - panOrigin.x,
								y: event.pageY - panOrigin.y
							};
						};
						break;
					case 2:
						if (me.scale > 0) {
							var pos = me.toGridXY(event.pageX, event.pageY);
							if (!lastPos || pos.x != lastPos.x || pos.y != lastPos.y) {
								lastPos = pos;
								if (toggleState == null) {
									toggleState = !Automaton.isSet(pos);
								}
								Automaton.set(pos, toggleState);
							};
						};
						break;
				}
			});

			$(canvas).mouseup( function(event) {
				dragButton = null;
				switch (event.button) {
					case 0:
						panOrigin = null;
						break;
					case 2:
						if (me.scale > 0 && toggleState == null) {
							var pos = me.toGridXY(event.pageX, event.pageY);
							toggleState = !Automaton.isSet(pos);
							Automaton.set(pos, toggleState);
						}
						break;
				}
				// restore cursor
				event.target.style.cursor = 'default';
			});

			$(canvas).dblclick( function(event) {
				var scaleDelta;
				if (me.scale > 0) {
					scaleDelta = Math.min(2 * me.scale, me.MAX_SCALE - me.scale);
				} else {
					scaleDelta = Math.floor(-2*me.scale / 3);
				}
				var smoothZoom = function() {
					if (scaleDelta-- > 0) {
						Grid.zoom(1, event.pageX, event.pageY);
						setTimeout(smoothZoom, 10);
					}
				};

				smoothZoom();
			});

		})();

		this.width = this.canvas.width = window.innerWidth;
		this.height = this.canvas.height = window.innerHeight;

		me.paint();
	},

	pan: function(dx, dy) {
		this.offset.x += dx;
		this.offset.y += dy;
		this.paint();
	},

	getMaxZoom: function() {
		return this.MAX_SCALE - this.MIN_SCALE - 2;
	},

	getScaleString: function() {
		return this.scale > 0 ? ("1:" + this.scale) : (-this.scale + ":1");
	},

	getZoom: function(scale) {
		if (!scale) { // treat 0 as undefined/null
			scale = this.scale;
		}
		return scale > 0 ? scale - this.MIN_SCALE - 2 : scale - this.MIN_SCALE;
	},

	curZoomPos: {
		x: null,
		y: null
	},
	curCenter: {
		x: null,
		y: null
	},
	zoomAt: null,
	setZoom: function(zoom, x, y, dontChangeAutoFit) {
		// normalize
		zoom = Math.max(0, Math.min(this.getMaxZoom(), zoom));
		if (zoom - this.getZoom() == 0) {
			return;
		}

		// default zoom to center
		if (!x || !y) {
			x = Math.floor(this.width / 2);
			y = Math.floor(this.height / 2);
		}

		// need to recalculate grid coordinates of zoom focus?
		var center = this.getCenter();
		if ((this.curZoomPos.x != x) || (this.curZoomPos.y != y)
		|| (this.curCenter.x != center.x) || (this.curCenter.y != center.y)) {
			this.zoomAt = this.toGridXY(x, y); // function of (x, y, center, scale)
		}

		// update scale
		var s = this.scale = zoom + this.MIN_SCALE + (zoom < -this.MIN_SCALE - 1 ? 0 : 2);

		// refocus on zoom position
		var cx = Math.floor(this.width / 2);
		var cy = Math.floor(this.height / 2);
		if (s > 0) {
			this.offset.x = x - cx - s * this.zoomAt.x - Math.floor(this.scale / 2);
			this.offset.y = y - cy - s * this.zoomAt.y - Math.floor(this.scale / 2);
		} else {
			this.offset.x = x - cx - (this.zoomAt.x < 0 ? Math.ceil((this.zoomAt.x + 1) / -s) - 1 : Math.ceil(this.zoomAt.x / -s));
			this.offset.y = y - cy - (this.zoomAt.y < 0 ? Math.ceil((this.zoomAt.y + 1) / -s) - 1 : Math.ceil(this.zoomAt.y / -s));
		}

		// record zoom focus state
		this.curZoomPos.x = x;
		this.curZoomPos.y = y;
		this.curCenter = this.getCenter();

		if (!dontChangeAutoFit) {
			this.autoFit = false;
		}
		this.stateChanged();
		this.paint();
	},

	zoom: function(zoomDelta, x, y) {
		this.setZoom(this.getZoom() + zoomDelta, x, y);
	},

	toGridXY: function(px, py) {
		var center = this.getCenter();
		var x = px - center.x;
		var y = py - center.y;
		var s = this.scale;

		if (s > 0) {
			x = x < 0 ? Math.ceil((x + 1) / s) - 1 : Math.floor(x / s);
			y = y < 0 ? Math.ceil((y + 1) / s) - 1 : Math.floor(y / s);
		} else {
			x = -x * s;
			y = -y * s;
		}
		return new Position(x, y);
	},

	paint: function() {
		// this clears the canvas
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

		var center = this.getCenter();
		var s = this.scale;

		// grid
		if (this.canShowGrid() && this.visibleGridLines) {
			this.context.beginPath();
			this.context.strokeStyle = this.GRID_LINES_COLOR;
			for (var x = center.x % s; x < this.width; x += s) {
				this.context.moveTo(x + .5, 0);
				this.context.lineTo(x + .5, this.height);
			}
			for (var y = center.y % s; y < this.height; y += s) {
				this.context.moveTo(0, y + .5);
				this.context.lineTo(this.width, y + .5);
			}
			this.context.stroke();

			this.context.beginPath();
			this.context.strokeStyle = this.MEASURE_LINES_COLOR;
			for (var x = center.x % s; x < this.width; x += s) {
				if ((x - center.x) % (s * this.MEASURE_LINES_INTERVAL) == 0) {
					this.context.moveTo(x + .5, 0);
					this.context.lineTo(x + .5, this.height);
				}
			}
			for (var y = center.y % s; y < this.height; y += s) {
				if ((y - center.y) % (s * this.MEASURE_LINES_INTERVAL) == 0) {
					this.context.moveTo(0, y + .5);
					this.context.lineTo(this.width, y + .5);
				}
			}
			this.context.stroke();
		}

		// origin cross
		if (this.visibleGridLines) {
			this.context.beginPath();
			this.context.strokeStyle = this.ORIGIN_LINES_COLOR;
			this.context.moveTo(center.x - 0.5, center.y + .5);
			this.context.lineTo(center.x + 1.5, center.y + .5);
			this.context.moveTo(center.x + .5, center.y - 0.5);
			this.context.lineTo(center.x + .5, center.y + 1.5);
			this.context.stroke();
		}

		var me = this;
		// cells
		if (s > 0) {
			this.context.fillStyle = this.CELL_COLOR;
			var gridLineSize = this.canShowGrid() ? 1 : 0;
			var side = s - gridLineSize;

			Automaton.render( function(x, y) {
				me.context.fillRect(
				center.x + gridLineSize + s*x,
				center.y + gridLineSize + s*y,
				side, side);
			});

		} else {
			this.context.fillStyle = this.MULTIPLE_CELLS_COLOR;

			Automaton.render( function(x, y) {
				me.context.fillRect(
				center.x + (x < 0 ? Math.ceil((x + 1) / -s) - 1 : Math.ceil(x / -s)),
				center.y + (y < 0 ? Math.ceil((y + 1) / -s) - 1 : Math.ceil(y / -s)),
				1, 1);
			});

		}
	},

	canShowGrid: function() {
		return this.scale >= this.MIN_SCALE_WITH_GRID;
	},

	toggleGridLines: function() {
		this.visibleGridLines = !this.visibleGridLines;
		this.paint();
	},

	recenter: function() {
		this.offset.x = 0;
		this.offset.y = 0;
		this.stateChanged();
		this.paint();
	},

	getCenter: function() {
		return {
			x: Math.floor(this.width / 2) + this.offset.x,
			y: Math.floor(this.height / 2) + this.offset.y
		};
	},

	toggleAutoFit: function() {
		this.autoFit = !this.autoFit;
		this.stateChanged();
	},

	fitPattern: function(forceFit) {
		if (Automaton.size == 0) {
			return;
		}
		var minX, minY, maxX, maxY;
		minX = minY = (-1 >>> 1);
		maxX = maxY = (1<< 31);
		Automaton.render( function(x, y) {
			if (x < minX) {
				minX = x;
			}
			if (x > maxX) {
				maxX = x;
			}
			if (y < minY) {
				minY = y;
			}
			if (y > maxY) {
				maxY = y;
			}
		});

		var minXY = this.toGridXY(0, 0);
		var maxXY = this.toGridXY(this.width, this.height);
		var fitsScreen = minX > minXY.x && maxX < maxXY.x && minY > minXY.y && maxY < maxXY.y;
		if (!fitsScreen || forceFit) {
			var fScale = Math.min(this.width / (maxX - minX + 1), this.height / (maxY - minY + 1));
			fScale *= this.SCREEN_FIT_RATIO;
			if (fScale >= 1) {
				this.scale = Math.min(Math.floor(fScale), this.MAX_SCALE);
				this.offset.x = -this.scale * (minX + maxX) / 2;
				this.offset.y = -this.scale * (minY + maxY) / 2;
			} else {
				this.scale = Math.min(Math.max(Math.floor(-1 / fScale), this.MIN_SCALE), -2);
				var x = (minX + maxX) / 2;
				var y = (minY + maxY) / 2;
				this.offset.x = x / this.scale;
				this.offset.y = y / this.scale;
			}
			this.stateChanged();
		}
	},

	listeners: [],

	addListener: function(listener) {
		this.listeners.push(listener);
	},

	stateChanged: function(code) {
		this.listeners.forEach( function(listener) {
			listener.stateChanged(code);
		});

	},

}