function Rule(name, survivalSet, birthSet) {
	var survivalMask = 0;
	var birthMask = 0;
	var ruleString = "S";

	survivalSet.forEach( function(i) {
		survivalMask |= 1 << i;
		ruleString += i;
	});

	ruleString += "/B";
	birthSet.forEach( function(i) {
		birthMask |= 1 << i;
		ruleString += i;
	});

	this.name = name;
	this.survivalMask = survivalMask;
	this.birthMask = birthMask;
	this.ruleString = ruleString;
}

Rule.prototype.survives = function(neighbors) {
	return (this.survivalMask & (1 << neighbors)) != 0;
}

Rule.prototype.born = function(neighbors) {
	return (this.birthMask & (1 << neighbors)) != 0;
}

Rule.prototype.toString = function() {
	return this.name + " (" + this.ruleString + ")";
}

var Rules = {
	rulePattern: /^([SB])?([012345678]*)\/([SB])?([12345678]*)$/i,

	parseRule: function(name, ruleString) {
		function parseDigits(digits) {
			// dedupe string of digits
			var hashSet = Array.prototype.reduce.call(digits, function(set, e) {
				set[e] = null;
				return set;
			}, {});
			// object properties -> [int]
			var set = [];
			for (var i in hashSet) {
				set.push(parseInt(i));
			}
			return set;
		}

		if (ruleString != null) {
			var r = ruleString.trim().match(Rules.rulePattern);
			if (r != null && r.length == 5) {
				if (r[1] && r[3] && r[1] == r[3]) {
					return undefined;
				}
				if (!name) {
					name = "<rule>";
				}
				if ((!r[1] || r[1].toUpperCase() == 'S') && (!r[3] || r[3].toUpperCase() == 'B')) {
					return new Rule(name, parseDigits(r[2]), parseDigits(r[4]));
				} else {
					return new Rule(name, parseDigits(r[4]), parseDigits(r[2]));
				}
			}
		}
	},

}

Rules.list = [
Rules.parseRule("Life", "23/3"),
Rules.parseRule("Gnarl", "B1/S1"),
Rules.parseRule("Replicator", "B1357/S1357"),
Rules.parseRule("Seeds", "B2/S"),
Rules.parseRule("Serviettes", "B234/S"),
Rules.parseRule("Maze", "B3/S12345"),
Rules.parseRule("Coral", "B3/S45678"),
Rules.parseRule("34 Life", "B34/S34"),
Rules.parseRule("Assimilation", "B345/S4567"),
Rules.parseRule("Long life", "B345/S5"),
Rules.parseRule("Diamoeba", "B35678/S5678"),
Rules.parseRule("Amoeba", "B357/S1358"),
Rules.parseRule("Pseudo life", "B357/S238"),
Rules.parseRule("2x2", "B36/S125"),
Rules.parseRule("HighLife", "B36/S23"),
Rules.parseRule("Stains", "B3678/S235678"),
Rules.parseRule("Day & Night", "B3678/S34678"),
Rules.parseRule("Move", "B368/S245"),
Rules.parseRule("Coagulations", "B378/S235678"),
Rules.parseRule("Walled Cities", "B45678/S2345"),
];

Rules.Life = Rules.parseRule("Life", "23/3");