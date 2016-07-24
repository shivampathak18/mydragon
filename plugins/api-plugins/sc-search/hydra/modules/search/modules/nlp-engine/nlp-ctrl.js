/**
 * Controller which handles requests/responses relating to nlp
 *
 * 
 */
var _ = require('underscore');
var Q = require('q');
//var openNLP = require("opennlp");
//var NLP = require('stanford-corenlp');
//var config = {"nlpPath":"./corenlp","version":"3.4"};
//var coreNLP = new NLP.StanfordNLP({"nlpPath":"/home/shivam/development/socialcops/sc-dragon/node_modules/stanford-corenlp/lib/stanford-corenlp-full-2015-04-20","version":"3.5.2"});
var nlpLib = require('./nlp-lib');
var Dependencies = require('./modules/getDependencies');
var queryEngine = require('../query-engine/query-ctrl');
var Boom = require('boom');
var SearchLib = require('../../search-lib');
//var coreNLP = new NLP.StanfordNLP(config);

//var ddg = require('ddg'); 

/**
* NLP starts here
*
* @param req
* @param reply
*/
var _this = this;

exports.natural = function(request, reply){
	var dfd = Q.defer();
	var options = request.query;
	// Add readable paths to options. default to only /sc prefix
	var creds = request.auth.credentials
	options['_readable_prefixes'] = (creds && creds._allowed_read_prefixes
								  	 || ['/sc'])
	options.aliases = {};
	if(typeof options.from != 'undefined'){		
		nlpLib.get_nlp_query(request.params.queryString).then(function(result){
				//console.log(result);
				if(result === null){
					//return (Boom.wrap(err));
					//console.log('error in nlp controller: called nlpLib',err);
					//dfd.reject({error:'error in nlp controller: called nlpLib'});
					dfd.resolve({});
				}
				else{
					//return (result)
					//console.log('return result from nlp');
					//console.log(JSON.stringify(result));
					var searchResponse = result;
					if(!result.nlpResult.hits.tableResults){
						
						searchResponse = SearchLib.processAgg(result.nlpResult.hits, options);
						
						console.log(searchResponse.length);
						searchResponse = {'nlpResult':{'hits':searchResponse}};
						console.log('process agg successful');
					}				
					dfd.resolve(searchResponse);
				} 
		})
		.catch(function(response) {
				console.log(arguments);
				//dfd.reject({error: response});
				console.log('nlp wreck error');
				dfd.resolve({});
		});
	}
	else
		dfd.resolve({});

	return dfd.promise;
	
};

exports.main = function(request, reply) {	
	var queryString = request.params.queryString;
	var options = request.query;
	var annotators = {'annotators':['tokenize','ssplit','pos','lemma','ner','parse','dcoref']};
	//var annotators = {'annotators':['tokenize','lemma','parse','dcoref']};
	var sentence = queryString;	
	
	coreNLP.loadPipelineSync(annotators);
	var nlpresult;
	coreNLP.process(sentence, function(err, result) {
		nlpresult = result;
		//reply(result);
		
		var dependencyType = 'collapsed-ccprocessed-dependencies';
	
		var dependencies = Dependencies.getDependenciesPriority(result,dependencyType);
		var prepareQueries = queryEngine.getQueryListByPriority(dependencies);
		//console.log(JSON.stringify(prepareQueries));
		var funcArr = [];
		for(var i = 0; i<prepareQueries.length; i++){
			funcArr.push(_this.queryES(prepareQueries[i],request,reply));
		}
		var masterResponse = [];

		//reply(nlpresult);
		
	  	if(funcArr.length > 0){
			Q.allSettled(funcArr)
			.then(function (results) {
				results.forEach(function (result,index) {
					console.log('result.state',result.state);
					if (result.state === "fulfilled") {
						/*if(index == 0){
							masterResponse.push(result.value);
						}
						else{*/
							//nlpLib.filterResultsByPriority(masterResponse,response);
							//masterResponse = _.extend(masterResponse,result.value);
							masterResponse.push(result.value);
						//}	
						
					} else {
						console.log('result not fulfilled');
					}
				});
				//console.log(JSON.stringify(masterResponse));
				//console.log(result);
				masterResponse.push({'nlpResult':nlpresult});
				reply(masterResponse);
			})
			.catch(function(response) {
				console.log('q not processed');	
				console.log(arguments);
				reply({});
			});
	  	}
	  	
	});
};


exports.queryES = function(queryObj,request,reply){
	var dfd = Q.defer();

	nlpLib.search(queryObj)
	.then(function(response) {		
		var searchResponse = nlpLib.processResponse(response);		
		dfd.resolve(searchResponse);
	})
	.catch(function(response) {
		console.log(arguments);
		dfd.reject({ error: response });
	});

	return dfd.promise;
};