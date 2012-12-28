'use strict';

var EventHandling = {

	eventHandlers: {},

	bind: function(eventType, eventHandler) {
		var handlers = this.eventHandlers[eventType];
		if (!handlers) {
			handlers = this.eventHandlers[eventType] = [];
		}
		handlers.push(eventHandler);
	},

	trigger: function(eventType) {
		var handlers = this.eventHandlers[eventType];
		if (handlers) {
			for (var i = 0; i < handlers.length; i++) {
				handlers[i]();
			}
		}
	},

}