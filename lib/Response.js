// Simple factory to produce a uniform response from the bouncer for the middleware
const Response = function ({ valid, message, statusCode }) {
  this.valid = valid;
  this.message = message;
  this.statusCode = statusCode;
};

module.exports = Response;
