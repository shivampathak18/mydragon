// This is a file generated by the yeoman generator hapijs

/**
 * Controller which handles requests/responses relating to dise
 *
 * @type {diseDao|exports}
 */
var diseDao = require('./dise-dao');
var diseLib = require('./dise-lib');
var Boom = require('boom');

/**
 * Creates a dise
 *
 * @param req
 * @param reply
 */
exports.searchDise = function (req, reply) {

	diseLib.searchDise(req.params.query, req.query)
	.then(function (response) {
		reply(response);
	})
	.catch(function(response) {
		reply(response).status(418);
	});
};
