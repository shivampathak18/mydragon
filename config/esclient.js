var elasticsearch = require('elasticsearch');

var client = new elasticsearch.Client({
    host: 'http://128.199.79.88',
    requestTimeout: 1000000,
    deadTimeout: 1
  });
module.exports = client;
