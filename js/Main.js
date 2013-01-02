"use strict";

function onReady() {
	// prevent selection
	document.onselectstart = function() {
		return false;
	};

	Grid.init(document.getElementById("grid"));

	$("#clear").button({
		text : false,
		label : "Clear Grid [C]",
		icons : {
			primary : "ui-icon-document"
		},
	}).click(function() {
		AutomatonManager.halt();
		if(!AutomatonManager.pattern) {
			AutomatonManager.pattern = Automaton.toPattern();
		}
		Automaton.clear();
		Grid.setZoom(Grid.getZoom(Grid.DEFAULT_SCALE), true);
		Grid.recenter();
	});

	$("#reset").button({
		text : false,
		label : "Reset To Last Edit [R]",
		icons : {
			primary : "ui-icon-arrowreturnthick-1-w",
		},
	}).click(function() {
		AutomatonManager.reset();
		Grid.fitPattern();
		Grid.paint();
	});
	var playOptions = {
		label : "Play [Space]",
		icons : {
			primary : "ui-icon-play",
		},
	};
	var pauseOptions = {
		label : "Pause [Space]",
		icons : {
			primary : "ui-icon-pause",
		},
	};
	$("#play").button({
		text : false,
	}).click(function() {
		AutomatonManager.toggle();
	});

	$("#play").button("option", playOptions);

	$("#nextgen").button({
		text : false,
		label : "Next Generation [G]",
		icons : {
			primary : "ui-icon-arrow-1-e",
		},
	}).click(function() {
		AutomatonManager.step(1);
	});
	var getNextStepLabel = function() {
		return "Step Over " + AutomatonManager.getSteps() + " Generation(s) [S]";
	}

	$("#nextstep").button({
		text : false,
		label : getNextStepLabel(),
		icons : {
			primary : "ui-icon-arrowthick-1-e",
		},
	}).click(function() {
		AutomatonManager.step();
	});

	$("#rungroup").buttonset();

	$("#gridlines")[0].checked = Grid.visibleGridLines;
	$("#gridlines").button({
		text : false,
		label : "Toggle Grid Lines [L]",
		icons : {
			primary : "ui-icon-calculator"
		},
	}).click(function() {
		Grid.toggleGridLines();
	});

	$("#fitpattern").button({
		text : false,
		label : "Fit Pattern To Window [F]",
		icons : {
			primary : "ui-icon-arrow-4-diag"
		},
	}).click(function() {
		Grid.fitPattern(true);
		Grid.paint();
	});

	$("#autofit")[0].checked = Grid.autoFit;
	$("#autofit").button({
		text : false,
		label : "Toggle Auto-Fit [A]",
		icons : {
			primary : "ui-icon-check"
		},
	}).click(function() {
		Grid.autoFit = !Grid.autoFit;
	});

	$("#fitgroup").buttonset();

	$("#scale")[0].title = "Scale [click to reset]";
	$("#scale").button({
		label : Grid.getScaleString(),
	}).click(function() {
		Grid.setZoom(Grid.getZoom(Grid.DEFAULT_SCALE), true);
	});

	$("#zoomin").parent().buttonset();
	$("#zoomslider").slider({
		min : 0,
		max : Grid.getMaxZoom(),
		value : Grid.getZoom(),
		slide : function(event, ui) {
			Grid.setZoom(ui.value);
		},
	});
	$("#zoomin").button({
		text : false,
		label : "Zoom In [Ctrl-Up]",
		icons : {
			primary : "ui-icon-zoomin"
		},
	}).click(function() {
		Grid.zoom(1);
	});

	$("#zoomout").button({
		text : false,
		label : "Zoom Out [Ctrl-Down]",
		icons : {
			primary : "ui-icon-zoomout"
		},
	}).click(function() {
		Grid.zoom(-1);
	});
	// speed
	$("#speed")[0].title = "Speed [click to reset]";
	$("#speed").parent().buttonset();
	$("#speed").button({
		label : AutomatonManager.getSpeedString(),
	}).click(function() {
		AutomatonManager.setSpeed(AutomatonManager.DEFAULT_SPEED);
	});

	$("#slower").button({
		text : false,
		label : "Slower [Ctrl-Left]",
		icons : {
			primary : "ui-icon-minus"
		},
	}).click(function() {
		AutomatonManager.speedDown();
	});

	$("#faster").button({
		text : false,
		label : "Faster [Ctrl-Right]",
		icons : {
			primary : "ui-icon-plus",
		},
	}).click(function() {
		AutomatonManager.speedUp();
	})

	$("#speedslider").slider({
		min : AutomatonManager.MIN_SPEED,
		max : AutomatonManager.MAX_SPEED,
		value : AutomatonManager.speed,
		slide : function(event, ui) {
			AutomatonManager.setSpeed(ui.value);
		}
	});

	$("#rule")[0].title = "Automaton Rule (click to edit)";
	$("#rule").button({
		label : Automaton.rule.toString(),
	}).click(function() {
		$("#ruledialog").dialog("open");
	});

	$("#ruleselect").button({
		text : false,
		label : "Select A Rule",
		icons : {
			primary : "ui-icon-triangle-1-s",
		},
	})

	// populate list
	Rules.list.forEach(function(r, index) {
		$("#rulelist").append("<li><a href='#' " + "rule-index='" + index + "' " + ">" + r.toString() + "</a></li>");
	});

	$("#rulelist").menu({
		select : function(e, ui) {
			$("#rule").button("option", "label", ui.item.text());
			var ruleIndex = ui.item.children(0).attr("rule-index");
			Automaton.setRule(Rules.list[ruleIndex]);
			document.activeElement.blur();
		},
	}).popup().parent().buttonset({
		items : "button",
	});

	// stats
	var population = $("#population")[0];
	var generation = $("#generation")[0];
	var updateStats = function() {
		population.innerHTML = Automaton.size;
		generation.innerHTML = Automaton.generation;
	};
	updateStats();

	// event binding
	Automaton.bind("step", updateStats);
	Automaton.bind("edit", updateStats);

	Grid.bind("autofit", function() {
		$("#autofit")[0].checked = Grid.autoFit;
		$("#autofit").button("refresh");
	});

	Grid.bind("zoom", function() {
		$("#zoomslider").slider("value", Grid.getZoom());
		$("#scale").button("option", "label", Grid.getScaleString());
	});

	AutomatonManager.bind('speed', function() {
		$("#speedslider").slider("value", AutomatonManager.speed);
		$("#speed").button("option", "label", AutomatonManager.getSpeedString());
		$("#nextstep").button("option", "label", getNextStepLabel());
		$("#play").button("option", AutomatonManager.paused ? playOptions : pauseOptions);
	});

	AutomatonManager.bind('paused', function() {
		$("#play").button("option", AutomatonManager.paused ? playOptions : pauseOptions);
		if(AutomatonManager.paused) {
			latency.innerHTML = "";
		}
	});
	var latency = $("#latency")[0];
	AutomatonManager.bind('tick', function() {
		latency.innerHTML = new Number(AutomatonManager.getMovingAverage()).toFixed(1) + "ms";
	});

	$(document).bind('keydown', 'space', function() {
		$("#play").click();
	});
	$(document).bind('keydown', 'r', function() {
		$("#reset").click();
	});
	$(document).bind('keydown', 'c', function() {
		$("#clear").click();
	});
	$(document).bind('keydown', 's', function() {
		$("#nextstep").click();
	});
	$(document).bind('keydown', 'g', function() {
		$("#nextgen").click();
	});
	$(document).bind('keydown', 'l', function() {
		$("#gridlines").click();
	});
	$(document).bind('keydown', 'a', function() {
		$("#autofit").click();
	});
	$(document).bind('keydown', 'f', function() {
		$("#fitpattern").click();
	});

	$(document).bind('keydown', 'ctrl+left', function() {
		AutomatonManager.speedDown();
	});
	$(document).bind('keydown', 'ctrl+right', function() {
		AutomatonManager.speedUp();
	});
	$(document).bind('keydown', 'ctrl+up', function() {
		Grid.zoom(1);
	});
	$(document).bind('keydown', 'ctrl+down', function() {
		Grid.zoom(-1);
	});
	var pan;
	(function() {
		var accelaration = 1.5;
		var velocity = (Grid.scale > 0 ? Grid.scale : 1);
		pan = function(x, y) {
			var delta = Math.floor(velocity += accelaration);
			Grid.pan(delta * x, delta * y);
		};
		$(document).bind('keyup', 'up down right left', function() {
			velocity = Grid.scale > 0 ? Grid.scale : 1;
		});
	})();

	$(document).bind('keydown', 'up', function() {
		pan(0, 1);
	});
	$(document).bind('keydown', 'down', function() {
		pan(0, -1);
	});
	$(document).bind('keydown', 'right', function() {
		pan(-1, 0);
	});
	$(document).bind('keydown', 'left', function() {
		pan(1, 0);
	});

	$.get("patterns/AQUA25.LIF", function(data) {
		Automaton.addPattern(Patterns.loadLIF(data).positions);
		Grid.fitPattern();
		Grid.paint();
	});
}