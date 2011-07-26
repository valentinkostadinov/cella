"use strict";

function Pattern(positions, rule, name, description) {
	this.positions = positions;
	this.rule = rule;
	this.name = name;
	this.description = description;
}

var Patterns = {
	loadLIF: function(input) {
		var positions = [];
		var rule = Rules.Life;
		var desc = '';

		var x = 0;
		var y = 0;
		var pattern= /.*[\r\n]+/g;
		var match;
		while ((match = pattern.exec(input)) != null) {
			var line = match[0].trim();

			if (line.substr(0, 2) == '#R') {
				rule = parseRule(null, line.substr(2));
			}
			if (line.substr(0, 2) == '#D') {
				desc += line.substr(2) + '\n';
			}
			if (line.substr(0,2) == '#P') {
				var coords = line.split(' ');
				if (coords.length == 3) {
					x = parseInt(coords[1]);
					y = parseInt(coords[2]);
				}
			}
			if (line.substr(0, 1) != '#') {
				for (var dx = 0; dx < line.length; dx++) {
					if (line.charAt(dx) == '*') {
						positions.push({
							x: x + dx,
							y: y
						});
					}
				}
				y++;
			}
		}

		return new Pattern(positions, rule);
	}

}