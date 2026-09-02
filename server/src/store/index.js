const { isDatabaseEnabled } = require("../db");

const store = isDatabaseEnabled()
  ? require("./mysql")
  : require("./memory");

module.exports = store;
module.exports.isDatabaseEnabled = isDatabaseEnabled;
