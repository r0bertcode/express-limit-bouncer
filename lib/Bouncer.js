const Response = require('./Response');

const Bouncer = function (options) {
  options = Object.assign({
    logger: false,
    limitCB: (req, address) => { },
    reqLimit: 100,
    windowDur: 5000,
    whiteList: [],
    blackList: [],
    blackListCB: (req, address) => { },
    timeoutStatus: 429,
    blackListAfter: null,
    timeoutMessage: 'ACCESS DENIED: Too many recent requests to this resource, please try again later',
    blackListStatus: 403,
    blackListMessage: 'ACCESS DENIED: This IP address is blacklisted from this resource',
  }, options);

  this.ipTable = {};
  this.limitTable = {};
  this.timeDiff = (date) => Date.now() - date;

  this.logger = options.logger;
  this.limitCB = options.limitCB;
  this.reqLimit = options.reqLimit;
  this.windowDur = options.windowDur;
  this.whiteList = options.whiteList;
  this.blackList = options.blackList;
  this.blackListCB = options.blackListCB;
  this.timeoutStatus = options.timeoutStatus;
  this.timeoutMessage = options.timeoutMessage;
  this.blackListAfter = options.blackListAfter;
  this.timeoutMessage = options.timeoutMessage;
  this.blackListStatus = options.blackListStatus;
  this.blackListMessage = options.blackListMessage;
};

Bouncer.prototype.getAddress = function (req) {
  const address = req.ip || req.connection.remoteAddress;

  if (!address) {
    return new Response({
      valid: false,
      message: 'FATAL: Was unable to recieve remote address',
      statusCode: 500,
    });
  }

  return address;
};

Bouncer.prototype.addBlackList = function (address) {
  if (!this.blackList.includes(address)) {
    this.blackList.push(address);
  }

  if (this.logger) {
    console.log(`Adress | ${address} | was blacklisted`);
  }

  delete this.ipTable[address];
  delete this.limitTable[address];
};

Bouncer.prototype.set = function (address) {
  this.ipTable[address] = {
    time: Date.now(),
    reqCount: 0,
  };
};

Bouncer.prototype.validate = function (req) {
  const address = this.getAddress(req);

  if (this.blackList.includes(address)) {
    return new Response({
      valid: false,
      message: this.blackListMessage,
      statusCode: this.blackListStatus,
    });
  }

  if (this.whiteList.includes(address)) {
    return new Response({ valid: true });
  }

  if (!this.ipTable[address]) {
    this.set(address);
  }

  const node = this.ipTable[address];
  const timeDiff = this.timeDiff(node.time);

  if (timeDiff >= this.windowDur) {
    this.set(address);
  }

  if (node.reqCount === this.reqLimit) {
    this.limitCB(req, address);

    if (this.blackListAfter) {
      if (!this.limitTable[address]) {
        this.limitTable[address] = [node.time];
      } else if (!this.limitTable[address].includes(node.time)) {
        this.limitTable[address].push(node.time);

        if (this.limitTable[address].length >= this.blackListAfter) {
          this.addBlackList(address);
          this.blackListCB(req, address);

          return new Response({
            valid: false,
            message: this.blackListMessage,
            statusCode: this.blackListStatus,
          });
        }
      }
    }

    if (this.logger) {
      console.log(`Bouncer: Address | ${address} | Was blocked from making a request`);
    }

    return new Response({
      valid: false,
      message: this.timeoutMessage,
      statusCode: this.timeoutStatus,
    });
  }

  node.reqCount += 1;
  return new Response({ valid: true });
};

module.exports = Bouncer;
