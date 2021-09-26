const Bouncer = require('./Bouncer');

// Middleware function to operate the bouncer on a endpoint / express app
const bounce = (bouncer) => {
  return (req, res, next) => {
    const response = bouncer.validate(req);

    if (response.valid) {
      next();
    } else {
      res.statusCode = response.statusCode;
      res.send(response.message);
    }
  };
};

module.exports = { Bouncer, bounce };
