//var objectree = require("objectree");
var _this = this;

function getMatchingPOSDependencies(tokens, dependencies) {
	var entityGrammar = ['NNS', 'NNP', 'NN'];
	var priorityDependencies = [];

	for (var i = dependencies.dep.length - 1; i >= 1; i--) {
		var governor = dependencies.dep[i].governor;
		var dependent = dependencies.dep[i].dependent;
		var govFlag = false;
		var depFlag = false;
		for (var j = 0; j < tokens.length; j++) {
			if (governor.$.idx === tokens[j].$.id) {
				if (entityGrammar.indexOf(tokens[j].POS) > -1)
					govFlag = true;
			}
			if (dependent.$.idx === tokens[j].$.id) {
				if (entityGrammar.indexOf(tokens[j].POS) > -1)
					depFlag = true;
			}
		}

		if (govFlag && depFlag) {
			priorityDependencies.push(dependencies.dep[i]);
		}
	}

	return priorityDependencies;
}

exports.getDependenciesPriority = function(result, type) {
	console.log('getting dependencies');

	var collapsedDependencies = result.document.sentences.sentence.dependencies[2];
	var tokens = result.document.sentences.sentence.tokens.token;
	var userDefinedDeps = _this.createOrderedDepTree(result, type);

	var priorityDependencies = getMatchingPOSDependencies(tokens, collapsedDependencies);
	console.log("priority deps", JSON.stringify(priorityDependencies));
	//priorityDependencies.push()
	return priorityDependencies;
};

function findMatchingDep(collapsedDependencies, node) {
	var matchingDep = [];
	//console.log('checking length',collapsedDependencies.dep.length);
	var found = false;
	console.log('matching node', node);
	for (var j = 0; j < collapsedDependencies.dep.length; j++) {
		//console.log('checking', node);
		if (collapsedDependencies.dep[j].governor.$.idx === node.idx) {
			var key = '' + collapsedDependencies.dep[j].dependent.$.idx;
			matchingDep.push({
				'idx': key,
				'word': collapsedDependencies.dep[j].dependent._,
				'relationship': collapsedDependencies.dep[j].$.type,
				'children': []
			});
			console.log('matching index', key);
			//collapsedDependencies.dep.splice(j,1);
			found = true;
		}
	}
	//console.log('matchingDep',matchingDep);
	if (found)
		return {
			'matchingDep': matchingDep,
			'collapsedDependencies': collapsedDependencies
		};
	else
		return false;
}

function createTreeRecursively(parentNode, collapsedDependencies, counter, max) {
	while (counter < max) {
		var result = findMatchingDep(collapsedDependencies, parentNode);
		if (!result)
			return;
		parentNode.children = result.matchingDep;
		counter++;
		for (var i = 0; i < parentNode.children.length; i++) {
			console.log('child node', parentNode.children[i]);
			createTreeRecursively(parentNode.children[i], collapsedDependencies, counter, max);
			counter++;

		}
		return;
	}
	return;
}

exports.createOrderedDepTree = function(result, type) {
	var collapsedDependencies = result.document.sentences.sentence.dependencies[2];
	var tokens = result.document.sentences.sentence.tokens.token;
	var parsedTree = result.document.sentences.sentence.parsedTree;

	var parentNode = {
		'idx': '0',
		'word': collapsedDependencies.dep[0].governor._,
		'children': [{
			'idx': collapsedDependencies.dep[0].dependent.$.idx,
			'relationship': collapsedDependencies.dep[0].$.type,
			'word': collapsedDependencies.dep[0].dependent._,
			'children': []
		}]
	};
	console.log(parentNode);
	createTreeRecursively(parentNode.children[0], collapsedDependencies, 1, tokens.length);

	console.log(JSON.stringify(parentNode));

	return parentNode;
};