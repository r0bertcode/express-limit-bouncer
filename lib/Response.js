const Response = function ({ valid, message, statusCode }) {
  this.valid = valid;
  this.message = message;
  this.statusCode = statusCode;
};

module.exports = Response;
