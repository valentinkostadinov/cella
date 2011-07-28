"use strict";

function Pattern(positions, rule, name, description) {
	this.positions = positions;
	this.rule = rule;
	this.name = name;
	this.description = description;
}

var Patterns = {
	loadLIF : function(input, name) {
		var positions = [];
		var rule = Rules.Life;
		var desc = '';

		var x = 0;
		var y = 0;
		var pattern = /.*[\r\n]+/g;
		var match;
		while(( match = pattern.exec(input)) != null) {
			var line = match[0].trim();

			if(line.substr(0, 2) == '#R') {
				rule = Rules.parseRule(null, line.substr(2));
			}
			if(line.substr(0, 2) == '#D') {
				desc += line.substr(2) + '\n';
			}
			if(line.substr(0, 2) == '#P') {
				var coords = line.split(' ');
				if(coords.length == 3) {
					x = parseInt(coords[1]);
					y = parseInt(coords[2]);
				}
			}
			if(line.substr(0, 1) != '#') {
				for(var dx = 0; dx < line.length; dx++) {
					if(line.charAt(dx) == '*') {
						positions.push({
							x : x + dx,
							y : y
						});
					}
				}
				y++;
			}
		}

		return new Pattern(positions, rule, desc);
	},

	loadRLE : function(input, name) {
		var positions = [];
		var rule = Rules.Life;
		var desc = '';

		var linePattern = /.*[\r\n]+/g;
		var match;
		while(( match = linePattern.exec(input)) != null) {
			var line = match[0].trim();
			if(line[0] != '#' && line[0] != "") {
				break;
			}
			desc += line.substr(2).trim() + '\n';
		}

		var offsetAndRule = "^x\\s*=\\s*(-?\\d+)\\s*,\\s*y\\s*=\\s*(-?\\d+)\\s*(?:,\\s*rule\\s*=\\s*(.*))?$";
		var result = line.match(offsetAndRule);

		var x = parseInt(result[1]);
		var y = parseInt(result[2]);
		rule = Rules.parseRule(null, result[3]);

		// sequence
		var offsetX = x;
		var runCount = 0;
		for(var i = linePattern.lastIndex; i < input.length && input[i] != '!'; i++) {
			var ch = input[i];
			if('\r\n\t'.indexOf(ch) == -1) {
				switch (ch.toLowerCase()) {
					case '$':
						runCount = runCount == 0 ? 1 : runCount;
						y += runCount;
						runCount = 0;
						x = offsetX;
						break;
					case 'b':
						runCount = runCount == 0 ? 1 : runCount;
						x += runCount;
						runCount = 0;
						break;
					case 'o':
						runCount = runCount == 0 ? 1 : runCount;
							for(var count = 0; count < runCount; count++) {
							positions.push(new Position(x++, y));
						}
						runCount = 0;
						break;
					default:
						runCount = parseInt(ch) + 10 * runCount;
				}
			}
		}
		return new Pattern(positions, rule, name, desc);
	},

}