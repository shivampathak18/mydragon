var routes = [
  
  {
    path: '/',
    method: 'GET',
    handler: function(request, reply) {
      reply('hello');
    },
    config: {

    }
  }
]

module.exports = routes
