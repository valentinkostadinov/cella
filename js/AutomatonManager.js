"use strict";

var AutomatonManager = {

	/*
	 * speed > 0: gens/step
	 * speed <= 0: delay ms/gen
	 */
	speed: 0,
	DEFAULT_SPEED: -1,
	MAX_SPEED: 24,
	MIN_SPEED: -4,
	delay: [50, 100, 250, 500, 1000],

	getSpeedString: function() {
		if (this.speed > 0) {
			return "x" + this.getSteps(); 
		} else {
			return "~" + (1000/this.getSleep()) + 'Hz';
		};
	},

	getSleep: function() {
		 return this.speed > 0 ? 1 : this.delay[-this.speed];
	},

	getSteps: function() {
		return this.speed > 0 ? this.speed : 1;
	},

	setSpeed: function(speed) {
		this.speed = Math.max(this.MIN_SPEED, Math.min(this.MAX_SPEED, speed));
		this.stateChanged();
	},

	speedUp: function() {
		if (this.speed < this.MAX_SPEED) {
			this.speed++;
			this.stateChanged();
		}
	},

	speedDown: function() {
		if (this.speed > this.MIN_SPEED) {
			this.speed--;
			this.stateChanged();
		}
	},

	paused: true,
	pattern: null,
	timer: null,

	listeners: [],

	toggle: function() {
		if (this.paused) {
			if (Automaton.size == 0) {
				return;
			}
			this.paused = false;
			if (!this.pattern) {
				this.pattern = Automaton.toPattern();
			}
			this.stateChanged();
			this.run();
		} else {
			this.paused = true;
			this.stateChanged();
		}
	},
	
	halt: function() {
		clearTimeout(this.timer);
		this.paused = true;
		this.stateChanged();
	},

	reset: function() {
		this.halt();
		Automaton.clear();
		if (this.pattern) {
			Automaton.addPattern(this.pattern);
			Grid.fitPattern();
			Grid.paint();
		}
	},

	run: function() {
		AutomatonManager.tick();
	},

	tick: function() {
		Automaton.step(this.getSteps());

		if (Automaton.size == 0 || (Automaton.births == 0 && Automaton.deaths == 0)) {
			this.paused = true;
			this.stateChanged();
		}
		if (!this.paused) {
			this.timer = setTimeout(this.run, this.getSleep());
		}
	},

	step: function(steps) {
		if (!steps) {
			steps = this.getSteps();
		}
		if (!this.paused) {
			this.paused = true;
			this.stateChanged();
		}
		Automaton.step(steps);
	},

	addListener: function(listener) {
		this.listeners.push(listener);
	},

	stateChanged: function(code) {
		this.listeners.forEach( function(listener) {
			listener.stateChanged(code);
		});

	},

}
