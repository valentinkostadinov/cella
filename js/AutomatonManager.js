"use strict";

var AutomatonManager = {

	/*
	 * speed > 0: gens/step
	 * speed <= 0: delay ms/gen
	 */
	speed: 0,
	DEFAULT_SPEED: -1,
	MAX_SPEED: 24,
	MIN_SPEED: -5,
	delay: [25, 50, 100, 250, 500, 1000],

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
		this.trigger('speed');
	},

	speedUp: function() {
		if (this.speed < this.MAX_SPEED) {
			this.speed++;
			this.trigger('speed');
		}
	},

	speedDown: function() {
		if (this.speed > this.MIN_SPEED) {
			this.speed--;
			this.trigger('speed');
		}
	},

	paused: true,
	pattern: null,
	timer: null,

	toggle: function() {
		if (this.paused) {
			if (Automaton.size == 0) {
				return;
			}
			this.paused = false;
			this.trigger('paused');
			var pattern = Automaton.toPattern();
			if (pattern) {
				this.pattern = pattern;
			}
			this.resetTime();
			this.run();
		} else {
			this.halt();
		}
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

	halt: function() {
		clearTimeout(this.timer);
		this.paused = true;
		this.trigger('paused');
	},

	run: function() {
		AutomatonManager.tick();
	},

	tick: function() {
		var timestamp = new Date();
		Automaton.step(this.getSteps());
		this.recordTime((new Date() - timestamp) / this.getSteps());
		this.trigger('tick');

		if (Automaton.size == 0 || (Automaton.births == 0 && Automaton.deaths == 0)) {
			this.paused = true;
			this.trigger('paused');
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
			this.halt();
		}
		Automaton.step(steps);
	},

	// a moving window performance timer
	MAX_WINDOW_SIZE: 20,
	windowSum: 0,
	movingWindow: new Queue(),

	resetTime: function() {
		this.windowSum = 0;
		this.movingWindow.clear();
	},

	recordTime: function(time) {
		this.movingWindow.enqueue(time);
		this.windowSum += time;
		if (this.movingWindow.size > this.MAX_WINDOW_SIZE) {
			this.windowSum -= this.movingWindow.dequeue();
		}
	},

	getMovingAverage: function() {
		var size = this.movingWindow.size;
		return this.windowSum / (size == 0 ? 0 : size);
	},

}

$.extend(AutomatonManager, EventHandling);

function Queue() {
	this.head = this.tail = null;
	this.size = 0;
}

Queue.prototype.enqueue = function(value) {
	var node = {
		value: value,
		next: null,
	}
	if (this.size == 0) {
		this.head = this.tail = node;
	} else {
		this.tail = this.tail.next = node;
	}
	this.size++;
}

Queue.prototype.dequeue = function() {
	if (this.size == 0) {
		return undefined;
	}
	var value = this.head.value;
	this.head = this.head.next;
	if (this.head == null) {
		this.tail == null;
	}
	this.size--;
	return value;
};

Queue.prototype.clear = function() {
	while (this.dequeue()) {
	};
}