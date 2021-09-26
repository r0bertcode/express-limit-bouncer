const express = require('express');
const { Bouncer, bounce } = require('../lib/index');

const bouncer = new Bouncer({
  reqLimit: 10,
  windowDur: 1000 * 30,
  blackListAfter: 2,
  logger: true,
});


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/hello', bounce(bouncer), (req, res) => {
  res.statusCode = 200;
  res.send("hello");
});

app.listen(1337);
