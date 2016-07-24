var ejs = require('elastic.js');
var Q = require('q');
var Hoek = require('hoek');
//var client = require('../../../../../../../../config/esclient');


var _ = require('underscore');
var wreck = require('wreck');
var _this = this;

_this.nodeStack = {
	'nmod:in':{},
	'compound':{},
	'nmod:with':{},
	'nmod:poss':{},
	'nummod':{},
	'advmod':{},
	'mwe':{}
}

_this.execStack = [];
var AND = [];
var compounds = [];
var OR = [];
var columns = [];
var filters = [];

var mwe_symbols = {
'less' : '<',
'more' : '>'
};

var handlers = {
      'root' : function(x){
      	AND.push(x['word']);
      },
      'nmod:in' : function(x){
      	AND.splice(0, 0, x['word']);
      },
      'compound' : function(x){
      	AND.splice(0,0, x['word']);
      },
      'case': function(x){
      	x
      },
      'nmod:with' : function(x){
      	columns.splice(0, 0, x['word']);
      },
      'nmod:poss' : function(x){
      	columns.splice(0, 0, x['word']);
        console.log(columns);
      },
      'nummod' : function(x){
      	filters.splice(0, 0, x['word']);
      },
      'advmod' : function(x){
      	filters.splice(0, 0, mwe_symbols[x['word']]);
      },
      'mwe' : function(x){
      	x
      },
      'cc' : function(x){
      	x
      },
      'conj:and' : function(x){
      	x
      },
      'nsubj' : function(x){
        x
      },
      'amod': function(x){
        //columns.splice(0, 0, x['word']);
        x
      },
      'dep': function(x){
        x
      },
      'nmod:per': function(x){
        x
      },
      'nmod:for' : function(x){
        columns.splice(0, 0, x['word']);
      },
      'nmod:tmod' : function(x){
        x
      },
      'nmod:near': function(x){

        //filters.splice(0, 0, mwe_symbols[x['word']]);
        //columns.splice(0, 0, x['word']);
        x
      }
}

/*
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
	
}*/

function testConjunctions( testString )
{
    //takes the case where "in" and "with" are present with "in" before "with"
    var regExp = /([a-zA-Z\s]+)(in\s)([a-zA-Z\s]+)(with\s)([a-zA-Z\s]+)/g;
    var match = regExp.exec(testString);

    if(match)
    {
        //printing individual groups
        /*for(var i = 1; i < match.length; i++)
        {
            console.log(match[i]);
        }*/
        return match;
    }
    else
    {
        //console.log("match failed");
        return [];
    }
}

function process_children(parentNode){
	var rel = parentNode['relationship'];
	console.log('relationship',rel);

    if(rel){
      handlers[rel](parentNode);
      //_this.nodeStack[rel][parentNode.idx] = parentNode;
    }

    _.each(parentNode['children'], function(child){
      return process_children(child);
    }); 
}

exports.main = function(parentNode,query){
	//process_children(parentNode);
	// Run regex to find pattern and then accordingly choose the right hanlers to process nodes
	//var match = testConjunctions(query);
	_this.nodeStack = {
		'nmod:in':{},
		'compound':{},
		'nmod:with':{},
		'nmod:poss':{},
		'nummod':{},
		'advmod':{},
		'mwe':{}
	}

	_this.execStack = [];
	AND = [];
	OR = [];
	columns = [];
	filters = [];
	process_children(parentNode);

	return {'AND':AND,'OR':OR,'columns':columns,'filters':filters};
};


