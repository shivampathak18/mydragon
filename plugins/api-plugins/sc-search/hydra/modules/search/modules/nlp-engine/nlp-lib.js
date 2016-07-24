var ejs = require('elastic.js');
var _ = require('underscore');
var Q = require('q');
var Hoek = require('hoek');
var client = require('../../../../../../../../config/esclient');
var moment = require('moment');
var wreck = require('wreck');

var customGrammar = require('../custom-grammar-engine/custom-grammar-ctrl');

function get_candidate_column(tl_query, column_query, callback){
  var candiate_column_query = {
    "query": {
      "query_string": {
        "query": tl_query
      }
    },
    "inner_hits": {
      "column": {
        "path": {
          "columns": {
            "query": {
              "query_string": {
                "query": column_query,
                "fields": [
                  "columns.description"
                ]
              }
            }
          }
        }
      }
    },
    "_source": {
      "includes": [],
      "excludes": [
          "metadata",
          "node_description",
          "*_suggest",
          "columns",
          "metadata_score_details"
      ]
    }
  }
        
  client.search({
    index: "kraken",
    type: "leaf",
    body: candiate_column_query
  }, function(err, result){
    if(err){
      return callback(err)
    }
    return callback(null, result)

  });
}

function get_candidate_hits(queryString,callback){
  console.log('quering ANDs');

  var queryObj = ejs.Request()  
  .query(
    ejs.FilteredQuery(
      ejs.QueryStringQuery(queryString)
      .defaultOperator('OR')
    )
  )
  .agg(
    ejs.FilterAggregation('aggs_filters')
    .filter(ejs.AndFilter(
        []
    ))
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
          .source([], ['columns', '__num*']) 
        )
      )
    )
  )
  .suggest(
    ejs.TermSuggester('my-suggestion')
    .text(queryString)
    .field('_all')
  )
  .toJSON();

  client.search({
    index: 'kraken',
    body: queryObj  
    
  }, function (error, response) {
    if (typeof error !== 'undefined') {
      return callback(error)
    } else {
      console.log('return response');
      //console.log(JSON.stringify(response));
      return callback(null, response)
    }
  });
}


exports.get_nlp_query = function(query, callback){
  var dfd = Q.defer();
  var AND = [];
  var OR = [];
  var columns = [];
  var filters = [];

  var mwe_symbols = {
    'less' : '<',
    'more' : '>'
  };


  /*var handlers = {
      'root' : function(x){AND.push(x['word'])},
      'nmod:in' : function(x){AND.splice(0, 0, x['word'])},
      'case': function(x){x},
      'nmod:with' : function(x){columns.splice(0, 0, x['word'])},
      'nmod:poss' : function(x){columns.splice(0, 0, x['word'])},
      'nummod' : function(x){filters.splice(0, 0, x['word'])},
      'advmod' : function(x){filters.splice(0, 0, mwe_symbols[x['word']])},
      'mwe' : function(x){x}
  }

  function process_children(node){

    var rel = node['relationship']

    if(rel){
      handlers[rel](node);
    }
    _.each(node['children'], function(child){
      return process_children(child);
    })
  }*/
  wreck.get("http://128.199.79.88:9090/parse?q=" + query,
    function(err, req, result){
      if(err || JSON.parse(result).error){
        //return callback(err);
        //console.log('wreck call error',JSON.parse(result));
        dfd.reject(JSON.parse(result));
        
      }
      else{
        //process_children(JSON.parse(result));
        console.log('parsed tree',JSON.parse(result));
        try{ 
                  var queryArrays = customGrammar.main(JSON.parse(result),query);
                  //console.log(JSON.stringify(queryArrays));
                  AND = queryArrays.AND;
                  OR = queryArrays.OR;
                  columns = queryArrays.columns;
                  filters = queryArrays.filters;

                  var tl_query = AND.join(" AND ");

                  if(!_.isEmpty(columns)){
                    var column_query = columns.join(" AND ");
                    get_candidate_column(tl_query, column_query, function(err, result){
                      if(err){
                        //return callback(err)
                        console.log('get_candidate_column_error',err);
                        dfd.resolve(null);
                      }

                      if(result.hits.total === 0){
                        //return callback(null, {})
                        dfd.resolve({});
                      }

                      var leaf = result.hits.hits[0];
                      if(!leaf)
                        return dfd.resolve({});
                      else{
                        var ih = leaf.inner_hits.column
                        if(ih.hits.total === 0){
                          //return callback(null, {})
                          return dfd.resolve({});
                        }
                        var column = ih.hits.hits[0]

                        var fs = filters.join('');
                        var col_name = column._source['internal_name']
                        var column_filter = "(" + col_name + ":" + fs + ")"
                        var qs = column_filter

                        //console.log(qs);
                        //console.log(col_name);

                        client.search({
                          index: "kraken",
                          type: column["_id"],
                          body: {
                            query : {
                              query_string :{
                                query: qs
                              }
                            },
                            _source: {
                              includes: [col_name, '__str__*'],
                            }
                          }
                        }, function(err, result){
                          //console.log('consoling column filter results', result);
                          if(err){
                            //return callback(err, null)
                            console.log('query column results', err);
                            dfd.resolve(null);
                          }

                          var query_result = {
                            nlpResult:{
                              doc: leaf._source.current_node,
                              hits: {tableResults: result.hits.hits}
                            }
                          }

                          //return callback(null, query_result)
                          //console.log('query column results', query_result);
                          dfd.resolve(query_result);
                        });
                      }
                      

                    });
                  }
                  else if(!_.isEmpty(AND)){
                    console.log('tl_query', tl_query);

                    get_candidate_hits(tl_query,function(err, result){
                      if(err){
                        //return callback(err)
                        console.log('query candidate results', err);
                        dfd.resolve(null);
                      }
                      else{
                        if(result.hits.total === 0){
                          //return callback(null, {})
                          console.log('query candidate results = 0');
                          dfd.resolve({});
                        }
                        else{
                          var query_result = {
                            nlpResult:{
                              doc: {},
                              hits: result
                            }
                          }

                          //return callback(null, query_result)
                          //console.log('query candidate results', query_result);
                          console.log('ANDs query result', query_result);
                          dfd.resolve(query_result);
                        }

                        
                      }
                      
                    });
                  }
        }
        catch(err){
          console.log('could not run grammar. check your grammar lib module');
          dfd.reject({error: err});
        }
        

      }
    });

  return dfd.promise;
};

exports.search = function(queryObj){
	var dfd = Q.defer();
	//console.log(JSON.stringify(queryObj));
	client.search({
	    index: 'kraken',
	    body: queryObj  
	    
	  }, function (error, response) {
	    if (typeof error !== 'undefined') {
	      dfd.reject({ error: error });
	    } else {
	      dfd.resolve(response);
	    }
	  })
	return dfd.promise;
}

exports.processResponse = function(response){
	return response;
}





