const fs = require('fs');

module.exports = {
  exists: (dir) => fs.existsSync(dir),
  timeDiff: (date) => Date.now() - date,
  creatDir: (dir) => fs.mkdirSync(dir, { recursive: true }),
  createFile: (loc) => fs.writeFileSync(loc, JSON.stringify([])),
  loadArray: (location) => JSON.parse(fs.readFileSync(location)),
  storeArray: (location, array) => fs.writeFileSync(location, JSON.stringify(array)),
};
