const helpers = require('./helpers');
const Response = require('./Response');

const Bouncer = function (options) {
  options = Object.assign({
    logger: false, // If true, will console.log when an address is blocked from a request or blacklisted
    limitCB: (req, address) => { }, // Callback to execute when a limited address makes a request
    reqLimit: 1000, // Amount of requests allowed per window
    windowDur: 900000, // Amount of time per window
    whiteList: [], // Whitelisted addresses
    blackList: [], // Blacklisted addresses
    blackListCB: (req, address) => { }, // Callback to execute when a address is blacklisted
    limitStatus: 429, // Status to send on request denied by limit
    limitMessage: 'ACCESS DENIED: Too many recent requests to this resource, please try again later', // Message or data to send on request denied by limit
    blackListAfter: null, // Set to a number to represent the total times a address can be 'timed out' before adding it to the blacklist to stop all future reqs
    blackListStatus: 403, // Status to send on a requst denied by blacklist
    blackListMessage: 'ACCESS DENIED: This IP address is blacklisted from this resource', // Message or data to send on request denied by blacklist
    saveAddressLists: null, // Object to configure persisting blacklist and whitelist
  }, options);

  this.ipTable = {}; // Object holding all address / address info
  this.limitTable = {}; // Object holding all address / array of timestamps it was limited on to track if it should be blacklisted by 'optons.blackListAfter'

  // Binding options
  this.logger = options.logger;
  this.limitCB = options.limitCB;
  this.reqLimit = options.reqLimit;
  this.windowDur = options.windowDur;
  this.whiteList = options.whiteList;
  this.blackList = options.blackList;
  this.blackListCB = options.blackListCB;
  this.limitStatus = options.limitStatus;
  this.limitMessage = options.limitMessage;
  this.blackListAfter = options.blackListAfter;
  this.limitMessage = options.limitMessage;
  this.blackListStatus = options.blackListStatus;
  this.blackListMessage = options.blackListMessage;
  this.saveAddressLists = options.saveAddressLists;

  // Procedure to conform a directory and bind paths if provided a configuaration to persist
  if (this.saveAddressLists.blackList || this.saveAddressLists.whiteList && this.saveAddressLists.directory) {
    this.path = this.saveAddressLists.directory;
    this.whiteListPath = `${this.path}/whiteList.json`;
    this.blackListPath = `${this.path}/blackList.json`;

    if (!helpers.exists(this.path)) {
      helpers.creatDir(this.path);
    }

    if (!helpers.exists(this.whiteListPath)) {
      helpers.createFile(this.whiteListPath);
    }

    if (!helpers.exists(this.blackListPath)) {
      helpers.createFile(this.blackListPath);
    }

    this.whiteList = helpers.loadArray(this.whiteListPath);
    this.blackList = helpers.loadArray(this.blackListPath);
  }
};

/* Public */
// Function to save the current address lists to disk that will be loaded
Bouncer.prototype.writeAddressLists = function () {
  if (this.path) {
    helpers.storeArray(this.whiteListPath, this.whiteList);
    helpers.storeArray(this.blackListPath, this.blackList);
  }
};

/* Internal */
// Attempt to read address from req.ip or req.connection.remoteAddress , throw a bad response if we can't
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

/* Public */
// Blacklist an address
Bouncer.prototype.addBlackList = function (address) {
  if (!this.blackList.includes(address)) {
    this.blackList.push(address);
  }

  if (this.logger) {
    console.log(`Adress | ${address} | was blackListed`);
  }

  delete this.ipTable[address];
  delete this.limitTable[address];
};

/* Public */
// Whitelist an address
Bouncer.prototype.addWhiteList = function (address) {
  if (!this.whiteList.includes(address)) {
    this.whiteList.push(address);
  }

  if (this.logger) {
    console.log(`Adress | ${address} | was whiteListed`);
  }
};

/* Internal */
// Set / clear a address on the ipTable
Bouncer.prototype.set = function (address) {
  this.ipTable[address] = {
    time: Date.now(),
    reqCount: 0,
  };
};

/* Internal */
// Validate the request to send the correct Response
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
  const timeDiff = helpers.timeDiff(node.time);

  if (timeDiff >= this.windowDur) {
    this.set(address);
  }
  console.log(node.reqCount, this.reqLimit);
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
      message: this.limitMessage,
      statusCode: this.limitStatus,
    });
  }

  node.reqCount += 1;
  return new Response({ valid: true });
};

module.exports = Bouncer;
