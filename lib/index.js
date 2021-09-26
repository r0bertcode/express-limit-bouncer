const Bouncer = require('./Bouncer');

const bounce = (bouncer) => {
  return (req, res, next) => {
    const response = bouncer.validate(req);
    console.log(bouncer.ipTable);
    console.log(bouncer.limitTable);

    if (response.valid) {
      next();
    } else {
      res.statusCode = response.statusCode;
      res.send(response.message);
    }
  };
};

module.exports = { Bouncer, bounce };
