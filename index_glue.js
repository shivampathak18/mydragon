/*
 * entity-store
 * user/repo
 *
 * Copyright (c) 2015 Deepu T Philip
 * Licensed under the MIT license.
 */

'use strict';

// Following the 'Node.js require(s) best practices' by
// http://www.mircozeiss.com/node-js-require-s-best-practices/

// // Nodejs libs
// var fs = require('fs');
//
// // External libs
var Glue = require('glue');
var Hoek = require('hoek');
var es1 = require('./plugins/entity-store');
var es2 = require('./plugins/entity-store-2');
//console.log(es1);
// /console.log(es2);
//
// // Internal libs
// var data = require('./data.js');

// Configurations
//var config = require('./config.json');

var manifest = {
  connections: [
    {
      host: 'localhost',
      port: 8000,
      labels: 'api'        
    },
    {
      host: 'localhost',
      port: 8001,
      labels: 'web'      
    }
  ],
  plugins: {
    '/home/shivam/development/socialcops/sc-dragon-nlp/plugins/sc-upload': [{select: 'api'}],
    '/home/shivam/development/socialcops/sc-dragon-nlp/plugins/heartbeat': [{select: 'web'}]
  }
};

console.log('manifest',manifest);

if (!module.parent) {
  Glue.compose(manifest, function (err, pack) {
    console.log('i  m here',arguments);

    if (err) {
      console.log('Failed composing');
    } else {
      pack.start(function() {
        console.log("Servers are listening on port dffdfdfdffd ");
      });
    }
  });

  console.log('exeuted glue');
}

module.exports = manifest;
