"use strict";

function onReady() {
	Grid.init(grid);

	$("#rungroup").buttonset();
	$("#play").button({
		text: false,
		label: "play [space]",
		icons: {
			primary: "ui-icon-play",
		},
	})
	.click( function() {
		AutomatonManager.toggle();
	});

	AutomatonManager.addListener({
		stateChanged: function() {
			var options;
			if (AutomatonManager.paused) {
				options = {
					label: "play [space]",
					icons: {
						primary: "ui-icon-play"
					},
				};
			} else {
				options = {
					label: "pause [space]",
					icons: {
						primary: "ui-icon-pause"
					}
				};
			}
			$("#play").button("option", options);
		}

	});

	$("#nextgen").button({
		text: false,
		label: "next generation [G]",
		icons: {
			primary: "ui-icon-arrow-1-e",
		},
	})
	.click( function() {
		AutomatonManager.step(1);
	});

	$("#nextstep").button({
		text: false,
		label: "next step [S]",
		icons: {
			primary: "ui-icon-arrowthick-1-e",
		},
	})
	.click( function() {
		AutomatonManager.step();
	});

	$("#reset").button({
		text: false,
		label: "reset [R]",
		icons: {
			primary: "ui-icon-arrowreturnthick-1-w",
		},
	})
	.click( function() {
		AutomatonManager.reset();
	});

	$("#newpattern").button({
		text: false,
		label: "new pattern [N]",
		icons: {
			primary: "ui-icon-document"
		},
	})
	.click( function() {
		AutomatonManager.halt();
		Automaton.clear();
		Grid.recenter();
		AutomatonManager.pattern = null;
	});

	$("#fitgroup").buttonset();
	$("#fitpattern").button({
		text: false,
		label: "fit pattern now [F]",
		icons: {
			primary: "ui-icon-arrow-4-diag"
		},
	})
	.click( function() {
		Grid.fitPattern(true);
		Grid.paint();
	});

	gridlines.checked = Grid.visibleGridLines;
	gridlines.labels[0].title = "toggle grid lines [L]";
	$("#gridlines").button({
	})
	.click( function() {
		Grid.toggleGridLines();
	});

	autofit.checked = Grid.autoFit;
	autofit.labels[0].title = "toggle auto-fit [A]";
	$("#autofit").button({
	})
	.click( function() {
		Grid.toggleAutoFit();
	});

	$("#zoomgroup").buttonset();
	$("#zoomslider").slider({
		orientation: 'vertical',
		min: 0,
		max: Grid.getMaxZoom(),
		value: Grid.getZoom(),
		slide: function(event, ui) {
			Grid.setZoom(ui.value);
		},

	});
	scale.title = "scale (click to reset)";
	$("#scale").button({
		label: Grid.getScaleString(),
	})
	.click(function() {
		Grid.setZoom(Grid.getZoom(Grid.DEFAULT_SCALE));
		Grid.recenter();
	});
	$("#zoomin").button({
		text: false,
		label: "zoom in [ctrl-up]",
		icons: {
			primary: "ui-icon-zoomin"
		},
	})
	.click( function() {
		Grid.zoom(1);
	});

	$("#zoomout").button({
		text: false,
		label: "zoom out [ctrl-down]",
		icons: {
			primary: "ui-icon-zoomout"
		},
	})
	.click( function() {
		Grid.zoom(-1);
	});

	var getSpeedTag = function() {
		return AutomatonManager.speed < 0 ? "delay" : "steps";
	};

	var getSpeedVal = function() {
		return AutomatonManager.speed < 0 ? (AutomatonManager.getSleep() + 'ms') : AutomatonManager.getSteps();
	};

	$("#speedgroup").buttonset();
	speed.title = "speed (click to reset)";
	$("#speed").button({
		label: getSpeedVal(),
	});
	$("#speedslider").slider({
		orientation: "vertical",
		min: AutomatonManager.MIN_SPEED,
		max: AutomatonManager.MAX_SPEED,
		value: AutomatonManager.speed,
		slide: function(event, ui) {
			AutomatonManager.setSpeed(ui.value);
		}

	});
	$("#slower").button({
		text: false,
		label: "slower [ctrl-left]",
		icons: {
			primary: "ui-icon-minus"
		},
	})
	.click( function() {
		AutomatonManager.speedDown();
	});

	$("#faster").button({
		text: false,
		label: "faster [ctrl-right]",
		icons: {
			primary: "ui-icon-plus"
		},
	})
	.click( function() {
		AutomatonManager.speedUp();
	});

	// listeners
	Grid.addListener({
		stateChanged: function() {
			autofit.checked = Grid.autoFit;
			$("#autofit").button("refresh");
			$("#zoomslider").slider("value", Grid.getZoom());
			$("#scale").button("option", "label", Grid.getScaleString());
		}

	});

	AutomatonManager.addListener({
		stateChanged: function() {
			$("#speedslider").slider("value", AutomatonManager.speed);
			$("#speed").button("option", "label", getSpeedVal());
		}

	});

	Automaton.addListener({
		stateChanged: function() {
			population.innerText = Automaton.size;
			generation.innerText = Automaton.generation;
		}

	});

	// status
	population.innerText = Automaton.size;
	generation.innerText = Automaton.generation;

	// keyboard setup
	(function() {
		var KEY = {
			CTRL: 17,
			RIGHT: 39,
			UP: 38,
			LEFT: 37,
			DOWN: 40,
			SPACE: 32,
			A: 65,
			F: 70,
			G: 71,
			L: 76,
			N: 78,
			R: 82,
			S: 83,
		};

		var velocity = (Grid.scale > 0 ? Grid.scale : 1);
		var accelaration = 1.5;

		document.onkeydown = function(event) {
			var delta = Math.floor(velocity += accelaration);
			if (!event.ctrlKey) {
				switch (event.which) {
					case KEY.N:
						newpattern.click();
						break;
					case KEY.SPACE:
						play.click();
						break;
					case KEY.S:
						nextstep.click();
						break;
					case KEY.G:
						nextgen.click();
						break;
					case KEY.LEFT:
						Grid.pan(delta, 0);
						break;
					case KEY.L:
						gridlines.click();
						break;
					case KEY.A:
						autofit.click();
						break;
					case KEY.F:
						fitpattern.click();
						break;
					case KEY.R:
						reset.click();
						break;
					case KEY.UP:
						Grid.pan(0, delta);
						break;
					case KEY.RIGHT:
						Grid.pan(-delta, 0);
						break;
					case KEY.DOWN:
						Grid.pan(0, -delta);
						break;
				}
			} else {
				// ctrl pressed
				switch (event.which) {
					case KEY.LEFT:
						AutomatonManager.speedDown();
						break;
					case KEY.RIGHT:
						AutomatonManager.speedUp();
						break;
					case KEY.UP:
						Grid.zoom(1)
						break;
					case KEY.DOWN:
						Grid.zoom(-1);
						break;
				}
			};
		};

		document.onkeyup = function() {
			velocity = Grid.scale > 0 ? Grid.scale : 1;
		};

	})();

}