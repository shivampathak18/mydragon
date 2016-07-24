var _ = require('underscore');
var ejs = require('elastic.js');
var Hoek = require('hoek');
var _this = this;
_this.depStack = [];

var queryTypeHandler = function(type,params){
	console.log(type);
	var posTags = {
		'nmod:in': function(){console.log('nmod:in');params['visited'] = false;_this.depStack.push({'nmod:in':params});return _this.nmodin(params);},
		'compound': function(){console.log('compound');params['visited'] = false;_this.depStack.push({'compound':params}); return _this.compound(params);}
	}
	if(posTags[type])
		return posTags[type]();
	else
		return {};
	
}
exports.getQueryListByPriority = function(dependencies){
	var queryList = [];
	//console.log(JSON.stringify(dependencies));
	_this.dependencies_copy = dependencies;
	_this.depStack = [];
	while(_this.dependencies_copy.length > 0){
		var query = queryTypeHandler(_this.dependencies_copy[0].$.type,dependencies[0]);
		console.log(JSON.stringify(query));
		if(!_.isEmpty(query))
			queryList.push(query);

		_this.dependencies_copy.splice(0,1);

	}
	/*
	for(var i =0; i< dependencies.length; i++){
		var query = queryTypeHandler(dependencies[i].$.type,dependencies[i]);
		//var query = queryFunc(dependencies[i]);
		if(!_.isEmpty(query))
			queryList.push(query);
	}
	*/

	return queryList;
}

exports.getImmediateAssociations = function(id){
	var assoc = {};

	for(var i =0; i<_this.dependencies_copy.length; i++){
		if(_this.dependencies_copy[i].$.type === 'compound')
		{
			if(_this.dependencies_copy[i].governor.$.idx === id){
				assoc = _this.dependencies_copy[i];
				assoc['trueText'] = _this.dependencies_copy[i].dependent._ + ' AND ' + _this.dependencies_copy[i].governor._;
				_this.dependencies_copy.splice(i,1);
				return assoc;
			}
		}
	}

	return assoc;
	
};

exports.nmodin = function(dep){
	
	var assoc = _this.getImmediateAssociations(dep.dependent.$.idx);
	var governor = dep.governor._;
	var dependent = dep.dependent._;

	if(!_.isEmpty(assoc))
		dependent = assoc['trueText'];

	return _this.nmodin_createQuery(governor,dependent);
};

exports.nmodin_createQuery = function(governor,dependent){
	console.log(governor,dependent);
	var queryObj = {};
	var queryString = governor + ' AND '+dependent;
	var queryObj = ejs.Request()  
	.query(
	  ejs.FilteredQuery(
	    ejs.QueryStringQuery(queryString)
	    .defaultOperator('OR')
	  )
	)  
	.agg(
	  ejs.TermsAggregation('node_types')
	  .field('node_type')
	  .size(0)    
	  .agg(
	    ejs.TermsAggregation('boundary')
	    .field('boundary_path')
	    .size(0)     
	    .agg(
	      ejs.TopHitsAggregation('top')
	      .size(3)
	    )
	  )
	)
	.toJSON();

	return queryObj;
}

exports.compound = function(dep){
	//console.log(_this.depStack);
	//var nmodinDeps = _.pluck(_this.depStack,'nmod:in');
	//console.log(JSON.stringify(nmodinDeps));
	/*if(nmodinDeps.length > 0){
		nmodinDep = nmodinDeps[0];

		var governor = nmodinDep.governor._;
		var dependent = dep.dependent._;
		return _this.compound_createQuery(governor,dependent);
	}*/
	//console.log('compound--',dep);
	for(var i =0; i<_this.depStack.length; i++){
		if(_this.depStack[i]['nmod:in']){
			if(_this.depStack[i]['nmod:in']['visited'] === false){
				nmodinDep = _this.depStack[i]['nmod:in'];
				console.log('found nmodin',nmodinDep);
				var governor = nmodinDep.governor._;
				var dependent = dep.dependent._;

				_this.depStack[i]['nmod:in']['visited'] = true;

				return _this.compound_createQuery(governor,dependent);
			}
		}
	}
}

exports.compound_createQuery = function(governor,dependent){
	var queryObj = {};
	var queryString = governor + ' AND '+dependent;
	var queryObj = ejs.Request()  
	.query(
	  ejs.FilteredQuery(
	    ejs.QueryStringQuery(queryString)
	    .defaultOperator('OR')
	  )
	)  
	.agg(
	  ejs.TermsAggregation('node_types')
	  .field('node_type')
	  .size(0)    
	  .agg(
	    ejs.TermsAggregation('boundary')
	    .field('boundary_path')
	    .size(0)     
	    .agg(
	      ejs.TopHitsAggregation('top')
	      .size(3)
	    )
	  )
	)
	.toJSON();

	return queryObj;
}

