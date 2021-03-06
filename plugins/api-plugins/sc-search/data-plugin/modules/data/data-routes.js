// This is a file generated by the yeoman generator hapijs

/**
 * All the endpoints for anything related to datum
 *
 * @type {exports}
 */
var Joi = require('joi'),
DataController = require('./data-ctrl');
var Wreck = require('wreck');
module.exports = function() {
  return [
    {
      method: 'GET',
      path: '/data/{path*}',
      config : {
        auth: {
          strategies: ['token']
        },
        description: 'Fetches all data',
        handler: DataController.fetch        
      }
    },

    {
      method: 'GET',
      path: '/datafile/{path*}',
      config : {
        description: 'Fetches all data',
        handler: DataController.fetchFile,
        plugins:{
          'sc-limits' : {
            rate_limits : {
              'regular' : [
                {
                  period: 10,
                  limit: 50
                },
                {
                  period: 60,
                  limit: 100
                },

                {
                  period: 1440,
                  limit: 200
                }
              ]
            }
          }
        }

      }
    },

    {
      method: 'GET',
      path: '/datafile/fe/{path*}',
      config : {
        auth: {
          strategies: ['token']
        },
        description: 'Fetches all data',
        handler: DataController.fetchFileForExcelPlugin
      }
    },
    {
      method: 'GET',
      path: '/trending',
      config : {
        /*auth: {
          strategies: ['token']
        }*/
        description: 'Trending',
        handler: DataController.trendingData
      }
    }
  ]
}();
