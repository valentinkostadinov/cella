"use strict";

var KEY = {
	CTRL: 17,
	RIGHT: 39,
	UP: 38,
	LEFT: 37,
	DOWN: 40,
	SPACE: 32,
	A: 65,
	C: 67,
	F: 70,
	G: 71,
	L: 76,
	N: 78,
	R: 82,
	S: 83,
};

function onLoad() {
	Grid.init(document.getElementById("grid"));

	// hookup controls
	var reset = document.getElementById("reset");
	reset.onclick = function() {
		Automaton.clear();
		var pattern = AutomatonManager.pattern;
		if (pattern) {
			Automaton.addPattern(pattern);
			Grid.fitPattern();
			Grid.paint();
		}
	}

	var newpattern = document.getElementById("newpattern");
	newpattern.onclick = function() {
		Automaton.clear();
		AutomatonManager.pattern = null;
	}

	var run = document.getElementById("run");
	run.onclick = function() {
		AutomatonManager.toggle();
	}

	var nextgen =  document.getElementById("nextgen");
	nextgen.onclick = function() {
		AutomatonManager.step(1);
	}

	var nextstep =  document.getElementById("nextstep");
	nextstep.onclick = function() {
		AutomatonManager.step();
	}

	var recenter =  document.getElementById("recenter");
	recenter.onclick = function() {
		Grid.recenter();
	}

	var fitpattern =  document.getElementById("fitpattern");
	fitpattern.onclick = function() {
		Grid.fitPattern(true);
		Grid.paint();
	}

	var gridlines =  document.getElementById("gridlines");
	gridlines.checked = Grid.visibleGridLines;
	gridlines.onclick = function() {
		Grid.toggleGridLines();
	}

	var autofit =  document.getElementById("autofit");
	autofit.checked = Grid.autoFit;
	autofit.onclick = function() {
		Grid.toggleAutoFit();
	}

	var speeddown = document.getElementById('speeddown');
	speeddown.onclick = function() {
		AutomatonManager.speedDown();
	}

	var speedup = document.getElementById('speedup');
	speedup.onclick = function() {
		AutomatonManager.speedUp();
	}

	var zoomout = document.getElementById('zoomout');
	zoomout.onclick = function() {
		Grid.zoom(-1);
	}

	var zoomin = document.getElementById('zoomin');
	zoomin.onclick = function() {
		Grid.zoom(1);
	}

	var speedSlider = document.getElementById('speedslider');
	speedSlider.min = AutomatonManager.MIN_SPEED;
	speedSlider.max = AutomatonManager.MAX_SPEED;
	speedSlider.value = AutomatonManager.speed;
	speedSlider.onchange = function() {
		AutomatonManager.setSpeed(speedSlider.value);
	};

	var zoomSlider = document.getElementById('zoomslider');
	zoomSlider.min = 0;
	zoomSlider.max = Grid.getMaxZoom();
	zoomSlider.value = Grid.getZoom();
	zoomSlider.onchange = function() {
		Grid.setZoom(zoomSlider.value)
	};

	// status
	var populationStatus = document.getElementById("population");
	populationStatus.innerText = Automaton.size;

	var scaleStatus = document.getElementById("scale");
	scaleStatus.innerText = Grid.getScaleString();

	var generationStatus = document.getElementById("generation");
	generationStatus.innerText = Automaton.generation;

	// listeners
	Grid.addListener({
		stateChanged: function() {
			scaleStatus.innerText = Grid.getScaleString();;
			autofit.checked = Grid.autoFit;
			zoomSlider.value = Grid.getZoom();
		}

	});

	Automaton.addListener({
		stateChanged: function() {
			populationStatus.innerText = Automaton.size;
			generationStatus.innerText = Automaton.generation;
		}

	});

	var speedtag = document.getElementById('speedtag');
	var speed = document.getElementById('speed');

	var getSpeedTag = function() {
		return AutomatonManager.speed < 0 ? "delay" : "steps";
	};

	var getSpeedVal = function() {
		return AutomatonManager.speed < 0 ? (AutomatonManager.getSleep() + 'ms') : AutomatonManager.getSteps();
	};

	speedtag.innerText = getSpeedTag();
	speed.innerText = getSpeedVal();

	AutomatonManager.addListener({
		stateChanged: function() {
			speedSlider.value = AutomatonManager.speed;
			speedtag.innerText = getSpeedTag();
			speed.innerText = getSpeedVal();
		}

	});

	// keyboard setup
	(function() {
		var velocity = (Grid.scale > 0 ? Grid.scale : 1);
		var accelaration = 1.5;

		document.onkeydown = function(event) {
			var delta = Math.floor(velocity += accelaration);
			if (!event.ctrlKey) {
				switch (event.which) {
					case KEY.SPACE:
						run.click();
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
					case KEY.UP:
						Grid.pan(0, delta);
						break;
					case KEY.RIGHT:
						Grid.pan(-delta, 0);
						break;
					case KEY.DOWN:
						Grid.pan(0, -delta);
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
					case KEY.C:
						recenter.click();
						break;
					case KEY.R:
						reset.click();
						break;
					case KEY.N:
						newpattern.click();
						break;						
				}
			} else {
				// ctrl pressed
				switch (event.which) {
					case KEY.UP:
						Grid.zoom(1)
						break;
					case KEY.DOWN:
						Grid.zoom(-1);
						break;
					case KEY.LEFT:
						speeddown.click();
						break;
					case KEY.RIGHT:
						speedup.click();
						break;
				}
			};
		};

		document.onkeyup = function() {
			velocity = Grid.scale > 0 ? Grid.scale : 1;
		};

	})();

}