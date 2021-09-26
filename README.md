# express-limit-bouncer

### Express rate limiting middleware

<br />

## Basic Usage

You create a Bouncer with custom options and then can use the provided 'bounce' middleware with the Bouncer to apply that configuration to that endpoint or application.

```
  const express = require('express');
  const { Bouncer, bounce } = require('express-limit-bouncer');

  const bouncer = new Bouncer({
    rateLimit: 100,
    windowDur: 1000 * 60 * 5,
  });

  const app = express();

  // App-wide
  app.use(bounce(bouncer));

  // Endpoint specific
  app.get('/hello', bounce(bouncer), (req, res, next) => { ... })
```

<br />

## Options and default values
-------------
<br />

### logger  ( Default: false )
- Type: Boolean
- If true, will console.log when an address is blocked from a request or blacklisted

<br />

### limitCB ( Default: (req, address) => {  } )
- Type: Function
- Callback to execute when a limited address makes a request passes in the request object and the address

<br />

### reqLimit ( Default: 1000 )
- Type: Number
- Amount of requests allowed per window duration

<br />

### windowDur ( Default: 900000 )
- Type: Number
- Duration of window time ( In miliseconds )

<br />

### whiteList ( Default: [ ] )
 - Type: Array
 - Addresses you wish to whitelist from the rate limit of the resource

<br />

### blackList ( Default: [ ] )
 - Type: Array
 - Addresses you wish to blacklist from the resource

<br />

### blackListAfter ( Default: null )
 - Type: Number
 - If provided, will blacklist any address who reaches the request limit in a window N many times. Ex. If set to '10' and a user gets 'timed out' 10 times, on the 10th time the address would be added to the blackList to stop any further requests

<br />

### blackListCB ( Default: (req, address) => { } )
 - Type: Function
 - Callback to execute when a address reaches the limited rate from options.blackListAfter , will execute a callback with the request object and the address passed in

<br />

### limitStatus ( Default: 429 )
 - Type: Number
 - The response code to send back when a user that is limited is trying to make a request

<br />

### limitMessage ( Default: 'ACCESS DENIED: Too many recent requests to this resource, please try again later' )
- Type: Any
- String or data to send back on the response when a user that is limited is trying to make a request

<br />

### blackListStatus ( Default: 403 )
- Type: Number
- The response code to send back when a blacklisted user is attempting to make a request

<br />

### blackListMessage ( Default: 'ACCESS DENIED: This IP address is blacklisted from this resource' )

- Type: Any
- String or data to send back on the response when a user that is blacklisted is trying to make a request

<br />

### saveAddressLists ( Default: null )

- Type: Object
- This object is used to configure persisting the bouncers blackList, whiteList or both ( Example usage at bottom of page )

Example config to save both whiteList and blackList

```
...
saveAddressList: {
  // Directory to save data to
  directory: path.join(__dirname, 'bouncerOneData'),

  // Boolean for either blackList or whiteList to save or not
  blackList: true,
  whiteList: true,
},
...
```


<br />

## Bouncer methods
---

### Bouncer.addWhiteList( address : string )
- Takes in a string represnting an address, and will push that to the whiteList
<br />

### Bouncer.addBlackList( address : string )
- Takes in a string represnting an address, and will push that to the whiteList
<br />

### Bouncer.writeAddressLists()
- Used in conglomerate with 'options.saveAddressLists', this method must be called before the node process ends to save the whiteList / blackList or both. ( See example at bottom of page )

---
<br />

## Using Multiple Bouncers

If you would like different rate limits or options on different resources, you can make multiple Bouncers

```
  const express = require('express');
  const { Bouncer, bounce } = require('express-limit-bouncer');

  const bouncerLogin = new Bouncer({
    rateLimit: 100,
    windowDur: 1000 * 60 * 5,
  });

  const bouncerData = new Bouncer({
    blackListAfter: 10,
    blackListCB: (req, address) => {
      console.log(`Address: ${address} has been blackListed`);
    },
    rateLimit: 1000,
    windowDur: 1000 * 60 * 5,
  });

  const app = express();

  app.post('/login', bounce(bouncerLogin), (req, res, next) => { ... });

  app.get('/data', bounce(bouncerData), (req, res, next) => { ... });

```

----
<br />

## Persisting a bouncers whiteList and blackList

Providing a 'saveAddressList' object in the configuration will allow you to persist either the whiteList, blackList or both. If using multiple bouncers, each bouncer will need a seperate directory.

```
  const path = require('path');
  const express = require('express');
  const { Bouncer, bounce } = require('express-limit-bouncer');

  const bouncer = new Bouncer({
    reqLimit: 10,
    windowDur: 30000,
    saveAddressLists: {
      directory: path.join(__dirname, 'bouncerData'),
      whiteList: true,
      blackList: true,
    },
  });

  const app = express();
  app.use(bounce(bouncer));

  app.get('/', (req, res, next) => {
    res.statusCode = 200;
    res.send('hello world');
  });

  const server = app.listen(1337, () => console.log('server listening on port 1337'));

  process.on('SIGINT', () => {
    server.close();
    bouncer.writeAddressLists();
  });
  process.on('exit', () => {
    server.close();
    bouncer.writeAddressLists();
  });

```